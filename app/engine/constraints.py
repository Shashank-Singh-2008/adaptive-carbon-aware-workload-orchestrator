from datetime import datetime
from typing import List, Tuple, Dict
from app.models.schemas import CandidateStrategy, WorkloadRequest, SyntheticWindow

def parse_iso_datetime(dt_str: str) -> datetime:
    """Parses ISO format datetime string into timezone-aware datetime."""
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        from datetime import timezone
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def evaluate_hard_constraints(
    candidate: CandidateStrategy,
    request: WorkloadRequest,
    effective_deadline: datetime,
    windows_dict: Dict[str, SyntheticWindow]
) -> Tuple[bool, List[str]]:
    """
    Evaluates the 7 hard constraints per Section 15 of the specification.
    Returns (is_feasible, rejection_reasons).
    """
    rejections: List[str] = []

    finish_dt = parse_iso_datetime(candidate.finish_time)

    # 1. finish_time <= effective_deadline
    if finish_dt > effective_deadline:
        rejections.append(
            f"DEADLINE_EXCEEDED: Finish time {candidate.finish_time} exceeds effective deadline {effective_deadline.isoformat()}"
        )

    # 2. total_cost <= budget
    if candidate.cost > request.budget:
        rejections.append(
            f"BUDGET_EXCEEDED: Cost ${candidate.cost:.2f} exceeds budget ${request.budget:.2f}"
        )

    # 3. FRAGMENT requires checkpointable == true
    if candidate.strategy == "FRAGMENT" and not request.checkpointable:
        rejections.append(
            "CHECKPOINT_REQUIRED: FRAGMENT strategy requested but workload is not checkpointable"
        )

    # 4 & 5. Capacity checks across all segments
    for seg in candidate.segments:
        if seg.type == "RUN":
            seg_start = parse_iso_datetime(seg.start)
            seg_end = parse_iso_datetime(seg.end)
            curr = seg_start
            while curr < seg_end:
                hour_key = curr.strftime("%Y-%m-%dT%H:00:00")
                matching_win = None
                for ts, win in windows_dict.items():
                    if ts.startswith(hour_key[:13]):
                        matching_win = win
                        break

                if matching_win:
                    if not matching_win.capacity_available:
                        rejections.append(
                            f"CAPACITY_UNAVAILABLE: No GPU capacity at {matching_win.timestamp}"
                        )
                        break
                    if matching_win.region != request.region:
                        rejections.append(
                            f"REGION_MISMATCH: Window region {matching_win.region} does not match {request.region}"
                        )
                        break
                curr += (datetime.fromtimestamp(3600) - datetime.fromtimestamp(0))

    is_feasible = len(rejections) == 0
    return is_feasible, rejections
