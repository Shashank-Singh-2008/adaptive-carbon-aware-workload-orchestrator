from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from app.models.schemas import WorkloadRequest, PlanResponse, CandidateStrategy, PlanSegment
from app.data.synthetic_data import generate_synthetic_conditions
from app.engine.constraints import evaluate_hard_constraints
from app.engine.strategies import generate_run, generate_delay, generate_fragment
from app.engine.scoring import score_candidates, select_best_with_tiebreakers

def parse_iso(dt_str: str) -> datetime:
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def decide(
    request: WorkloadRequest,
    windows: Optional[List[Any]] = None,
    seed: int = 42
) -> PlanResponse:
    """
    Deterministic Decision Engine implementation per Section 18.
    Zero LLM calls. Fully testable and reproducible.
    """
    raw_deadline = parse_iso(request.deadline)
    safety_buffer = timedelta(minutes=request.safety_buffer_minutes)
    effective_deadline = raw_deadline - safety_buffer

    # Determine start scheduling time
    if request.submission_time:
        start_time = parse_iso(request.submission_time)
    else:
        # Default aligned to reference scenario: 22:00 of deadline's previous day
        start_time = raw_deadline - timedelta(hours=10)

    # Generate synthetic conditions if not explicitly provided
    if not windows:
        horizon_hours = int(max(24, (effective_deadline - start_time).total_seconds() / 3600.0 + 4))
        windows = generate_synthetic_conditions(
            start_time=start_time,
            hours=horizon_hours,
            region=request.region,
            seed=seed
        )

    windows_dict = {w.timestamp: w for w in windows}

    # 1. Candidate Generation
    candidates: List[CandidateStrategy] = []
    run_candidates = generate_run(request, windows, start_time, effective_deadline)
    candidates.extend(run_candidates)

    baseline_carbon = run_candidates[0].carbon_g if run_candidates else 3360.0

    delay_candidates = generate_delay(request, windows, start_time, effective_deadline)
    candidates.extend(delay_candidates)

    fragment_candidates = generate_fragment(
        request, windows, start_time, effective_deadline, baseline_run_carbon=baseline_carbon
    )
    candidates.extend(fragment_candidates)

    # 2. Hard Constraint Evaluation (Section 15)
    for c in candidates:
        passes, rejections = evaluate_hard_constraints(c, request, effective_deadline, windows_dict)
        c.is_feasible = passes
        c.rejection_reasons = rejections

    feasible = [c for c in candidates if c.is_feasible]

    # 3. No-Feasible-Plan Handling (Section 19)
    if not feasible:
        primary_reasons: List[str] = []
        for c in candidates:
            primary_reasons.extend(c.rejection_reasons)
        unique_reasons = list(dict.fromkeys(primary_reasons))[:4] or ["NO_FEASIBLE_CANDIDATES_FOUND"]

        return PlanResponse(
            decision="NO_FEASIBLE_PLAN",
            effective_deadline=effective_deadline.isoformat(),
            selected_plan=[],
            estimated_cost=0.0,
            estimated_carbon_g=0.0,
            finish_time="",
            deadline_safe=False,
            budget_safe=False,
            checkpointable=request.checkpointable,
            score=0.0,
            reason=unique_reasons,
            candidates=[
                {
                    "strategy": c.strategy,
                    "start_time": c.start_time,
                    "finish_time": c.finish_time,
                    "carbon_g": c.carbon_g,
                    "cost": c.cost,
                    "deadline_slack_hours": c.deadline_slack_hours,
                    "is_feasible": c.is_feasible,
                    "rejection_reasons": c.rejection_reasons,
                }
                for c in candidates
            ],
        )

    # 4. Scoring Engine (Section 16)
    score_candidates(feasible, request)

    # 5. Tie-breaker & Best selection (Section 17)
    best_candidate = select_best_with_tiebreakers(feasible)

    # Format selected plan
    selected_plan = [
        {"start": seg.start, "end": seg.end, "type": seg.type}
        for seg in best_candidate.segments
    ]

    # Construct explainability reasons per Section 7 & 25
    reasons = [
        "Deadline satisfied",
        "Budget satisfied",
    ]
    if request.checkpointable:
        reasons.append("Checkpointing is available")
    if best_candidate.strategy in ["DELAY", "FRAGMENT"]:
        reasons.append(f"Lower estimated carbon than RUN NOW (Saves {baseline_carbon - best_candidate.carbon_g:.1f}g CO₂)")
    else:
        reasons.append("Immediate execution preferred within tight schedule bounds")

    return PlanResponse(
        decision=best_candidate.strategy,
        effective_deadline=effective_deadline.isoformat(),
        selected_plan=selected_plan,
        estimated_cost=best_candidate.cost,
        estimated_carbon_g=best_candidate.carbon_g,
        finish_time=best_candidate.finish_time,
        deadline_safe=True,
        budget_safe=best_candidate.cost <= request.budget,
        checkpointable=request.checkpointable,
        score=best_candidate.score,
        reason=reasons,
        candidates=[
            {
                "strategy": c.strategy,
                "start_time": c.start_time,
                "finish_time": c.finish_time,
                "carbon_g": c.carbon_g,
                "cost": c.cost,
                "deadline_slack_hours": c.deadline_slack_hours,
                "segments_count": c.segments_count,
                "is_feasible": c.is_feasible,
                "score": c.score,
                "rejection_reasons": c.rejection_reasons,
            }
            for c in candidates
        ],
    )
