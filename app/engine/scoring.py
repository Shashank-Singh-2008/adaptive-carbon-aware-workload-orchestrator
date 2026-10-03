from typing import List, Dict
from datetime import datetime
from app.models.schemas import CandidateStrategy, WorkloadRequest

DEFAULT_WEIGHTS = {
    "carbon": 0.50,
    "cost": 0.20,
    "deadline_safety": 0.20,
    "overhead": 0.10,
}

LOW_CARBON_PRIORITY_WEIGHTS = {
    "carbon": 0.20,
    "cost": 0.40,
    "deadline_safety": 0.30,
    "overhead": 0.10,
}

def score_candidates(
    candidates: List[CandidateStrategy],
    request: WorkloadRequest
) -> List[CandidateStrategy]:
    """
    Scores feasible candidates using multi-factor normalized scoring (Section 16).
    Only feasible candidates are scored.
    """
    feasible = [c for c in candidates if c.is_feasible]
    if not feasible:
        return candidates

    weights = (
        LOW_CARBON_PRIORITY_WEIGHTS
        if request.carbon_priority == "low"
        else DEFAULT_WEIGHTS
    )

    carbon_vals = [c.carbon_g for c in feasible]
    cost_vals = [c.cost for c in feasible]
    slack_vals = [c.deadline_slack_hours for c in feasible]

    min_carbon, max_carbon = min(carbon_vals), max(carbon_vals)
    min_cost, max_cost = min(cost_vals), max(cost_vals)
    min_slack, max_slack = min(slack_vals), max(slack_vals)

    for c in feasible:
        # Lower carbon -> higher score (0 to 1)
        if max_carbon > min_carbon:
            norm_carbon = 1.0 - (c.carbon_g - min_carbon) / (max_carbon - min_carbon)
        else:
            norm_carbon = 1.0

        # Lower cost -> higher score (0 to 1)
        if max_cost > min_cost:
            norm_cost = 1.0 - (c.cost - min_cost) / (max_cost - min_cost)
        else:
            norm_cost = 1.0

        # More remaining slack -> higher safety score (0 to 1)
        if max_slack > min_slack:
            norm_slack = (c.deadline_slack_hours - min_slack) / (max_slack - min_slack)
        else:
            norm_slack = 1.0

        # Fewer segments/overhead -> higher score (1.0 for 1 segment, 0.85 for 2 segments)
        norm_overhead = 1.0 if c.segments_count <= 1 else 0.85

        score = (
            weights["carbon"] * norm_carbon
            + weights["cost"] * norm_cost
            + weights["deadline_safety"] * norm_slack
            + weights["overhead"] * norm_overhead
        )
        c.score = round(score, 4)

    return candidates

def select_best_with_tiebreakers(
    feasible_candidates: List[CandidateStrategy],
    tolerance: float = 0.005
) -> CandidateStrategy:
    """
    Applies Section 17 tie-breaking rules:
    1. prefer lower carbon
    2. if carbon is equal, prefer lower cost
    3. if cost is equal, prefer earlier completion
    4. if still tied, prefer fewer segments/checkpoints
    """
    if not feasible_candidates:
        raise ValueError("No feasible candidates to select from")

    # Sort descending by score initially
    sorted_by_score = sorted(feasible_candidates, key=lambda c: c.score, reverse=True)
    best = sorted_by_score[0]

    # Find near-ties within tolerance
    tied_candidates = [c for c in sorted_by_score if abs(c.score - best.score) <= tolerance]

    if len(tied_candidates) == 1:
        return best

    # Apply strict Section 17 tiebreakers:
    # (carbon ascending, cost ascending, finish_time ascending, segments_count ascending)
    sorted_tied = sorted(
        tied_candidates,
        key=lambda c: (
            c.carbon_g,
            c.cost,
            c.finish_time,
            c.segments_count
        )
    )
    return sorted_tied[0]
