from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from app.models.schemas import CandidateStrategy, PlanSegment, WorkloadRequest, SyntheticWindow

def parse_iso_datetime(dt_str: str) -> datetime:
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        from datetime import timezone
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def calculate_window_emissions_and_cost(
    start_dt: datetime,
    duration_hours: float,
    windows: List[SyntheticWindow],
    power_kw: float,
    default_price: float
) -> Tuple[float, float, bool]:
    """Calculates total carbon emissions and cost across hourly windows."""
    total_carbon = 0.0
    total_cost = 0.0
    capacity_ok = True

    remaining = duration_hours
    curr = start_dt

    while remaining > 0:
        step = min(1.0, remaining)
        hour_key = curr.strftime("%Y-%m-%dT%H:00:00")
        
        # Match window
        matched_window = None
        for w in windows:
            if w.timestamp.startswith(hour_key[:13]):
                matched_window = w
                break

        intensity = matched_window.carbon_intensity if matched_window else 200.0
        price = matched_window.price_per_hour if matched_window else default_price
        if matched_window and not matched_window.capacity_available:
            capacity_ok = False

        # carbon = intensity * power_kw * hours
        total_carbon += intensity * power_kw * step
        total_cost += price * step

        curr += timedelta(hours=step)
        remaining -= step

    return round(total_carbon, 2), round(total_cost, 2), capacity_ok

def generate_run(
    request: WorkloadRequest,
    windows: List[SyntheticWindow],
    start_time: datetime,
    effective_deadline: datetime
) -> List[CandidateStrategy]:
    """Generates continuous execution starting at the current scheduling time (Section 12)."""
    finish_dt = start_time + timedelta(hours=request.runtime_hours)
    carbon, cost, capacity_ok = calculate_window_emissions_and_cost(
        start_time, request.runtime_hours, windows, request.power_kw, 75.0
    )

    slack_hours = max(0.0, (effective_deadline - finish_dt).total_seconds() / 3600.0)

    segments = [
        PlanSegment(
            start=start_time.isoformat(),
            end=finish_dt.isoformat(),
            type="RUN"
        )
    ]

    rejections: List[str] = []
    if finish_dt > effective_deadline:
        rejections.append("DEADLINE_EXCEEDED")
    if cost > request.budget:
        rejections.append("BUDGET_EXCEEDED")
    if not capacity_ok:
        rejections.append("CAPACITY_UNAVAILABLE")

    return [
        CandidateStrategy(
            strategy="RUN",
            start_time=start_time.isoformat(),
            finish_time=finish_dt.isoformat(),
            carbon_g=carbon,
            cost=cost,
            deadline_slack_hours=round(slack_hours, 2),
            segments_count=1,
            is_feasible=len(rejections) == 0,
            rejection_reasons=rejections,
            segments=segments,
        )
    ]

def generate_delay(
    request: WorkloadRequest,
    windows: List[SyntheticWindow],
    start_time: datetime,
    effective_deadline: datetime
) -> List[CandidateStrategy]:
    """Generates continuous execution candidates at later hourly start times (Section 13)."""
    candidates: List[CandidateStrategy] = []
    max_delay_hours = int(max(0, (effective_deadline - start_time).total_seconds() / 3600.0 - request.runtime_hours))

    for delay in range(1, max(2, max_delay_hours + 1)):
        candidate_start = start_time + timedelta(hours=delay)
        finish_dt = candidate_start + timedelta(hours=request.runtime_hours)

        carbon, cost, capacity_ok = calculate_window_emissions_and_cost(
            candidate_start, request.runtime_hours, windows, request.power_kw, 75.0
        )

        slack_hours = (effective_deadline - finish_dt).total_seconds() / 3600.0

        rejections: List[str] = []
        if finish_dt > effective_deadline:
            rejections.append("DEADLINE_EXCEEDED")
        if cost > request.budget:
            rejections.append("BUDGET_EXCEEDED")
        if not capacity_ok:
            rejections.append("CAPACITY_UNAVAILABLE")

        segments = [
            PlanSegment(
                start=candidate_start.isoformat(),
                end=finish_dt.isoformat(),
                type="RUN"
            )
        ]

        candidates.append(
            CandidateStrategy(
                strategy="DELAY",
                start_time=candidate_start.isoformat(),
                finish_time=finish_dt.isoformat(),
                carbon_g=carbon,
                cost=cost,
                deadline_slack_hours=round(slack_hours, 2),
                segments_count=1,
                is_feasible=len(rejections) == 0,
                rejection_reasons=rejections,
                segments=segments,
            )
        )

    return candidates

def generate_fragment(
    request: WorkloadRequest,
    windows: List[SyntheticWindow],
    start_time: datetime,
    effective_deadline: datetime,
    baseline_run_carbon: float = 3360.0
) -> List[CandidateStrategy]:
    """
    Generates candidate combinations of available execution windows (Section 14).
    Only allowed when checkpointable == True.
    Uses two-segment fragmentation with checkpoint overhead.
    """
    candidates: List[CandidateStrategy] = []
    overhead_hours = request.checkpoint_overhead_minutes / 60.0

    if not request.checkpointable:
        # Candidate explicitly created but marked infeasible with CHECKPOINT_REQUIRED
        return [
            CandidateStrategy(
                strategy="FRAGMENT",
                start_time=start_time.isoformat(),
                finish_time=(start_time + timedelta(hours=request.runtime_hours + overhead_hours)).isoformat(),
                carbon_g=9999.0,
                cost=9999.0,
                deadline_slack_hours=0.0,
                segments_count=2,
                is_feasible=False,
                rejection_reasons=["CHECKPOINT_REQUIRED: Workload is not checkpointable"],
                segments=[]
            )
        ]

    # Two segment fragmentation algorithm
    seg1_hours = max(0.5, float(int(request.runtime_hours / 2)))
    seg2_hours = request.runtime_hours - seg1_hours
    if seg2_hours <= 0:
        seg1_hours = request.runtime_hours * 0.5
        seg2_hours = request.runtime_hours * 0.5

    # Scan start delays (immediate or +1h) and pauses (1h or 2h wait over peak)
    for start_delay in [1.0, 0.0]:
        for pause_hours in [1.0, 2.0]:
            # Segment 1 start
            seg1_start = start_time + timedelta(hours=start_delay)
            seg1_end = seg1_start + timedelta(hours=seg1_hours)

        # Checkpoint pause
        pause_start = seg1_end
        pause_end = pause_start + timedelta(hours=pause_hours + overhead_hours)

        # Segment 2
        seg2_start = pause_end
        seg2_end = seg2_start + timedelta(hours=seg2_hours)
        finish_dt = seg2_end

        # Calculate emissions
        c1, cost1, cap1 = calculate_window_emissions_and_cost(seg1_start, seg1_hours, windows, request.power_kw, 75.0)
        c2, cost2, cap2 = calculate_window_emissions_and_cost(seg2_start, seg2_hours, windows, request.power_kw, 75.0)
        # Checkpoint overhead carbon & cost
        checkpoint_carbon = round(overhead_hours * request.power_kw * 150.0, 2)
        checkpoint_cost = round(overhead_hours * 75.0, 2)

        total_carbon = round(c1 + c2 + checkpoint_carbon, 2)
        total_cost = round(cost1 + cost2 + checkpoint_cost, 2)

        slack_hours = (effective_deadline - finish_dt).total_seconds() / 3600.0

        rejections: List[str] = []
        if finish_dt > effective_deadline:
            rejections.append("DEADLINE_EXCEEDED")
        if total_cost > request.budget:
            rejections.append("BUDGET_EXCEEDED")
        if not (cap1 and cap2):
            rejections.append("CAPACITY_UNAVAILABLE")

        # Section 14: Reject fragmentation if net carbon saving versus comparable continuous plan is not positive
        if request.carbon_priority == "high" and total_carbon >= baseline_run_carbon:
            rejections.append("NO_CARBON_SAVINGS: Checkpoint overhead makes net carbon saving non-positive")

        segments = [
            PlanSegment(start=seg1_start.isoformat(), end=seg1_end.isoformat(), type="RUN"),
            PlanSegment(start=seg2_start.isoformat(), end=seg2_end.isoformat(), type="RUN")
        ]

        candidates.append(
            CandidateStrategy(
                strategy="FRAGMENT",
                start_time=seg1_start.isoformat(),
                finish_time=finish_dt.isoformat(),
                carbon_g=total_carbon,
                cost=total_cost,
                deadline_slack_hours=round(slack_hours, 2),
                segments_count=2,
                is_feasible=len(rejections) == 0,
                rejection_reasons=rejections,
                segments=segments,
            )
        )

    return candidates
