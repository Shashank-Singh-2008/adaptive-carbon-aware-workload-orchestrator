from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from enum import Enum

class CarbonPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class DecisionType(str, Enum):
    RUN = "RUN"
    DELAY = "DELAY"
    FRAGMENT = "FRAGMENT"
    NO_FEASIBLE_PLAN = "NO_FEASIBLE_PLAN"

@dataclass
class SyntheticWindow:
    timestamp: str
    carbon_intensity: float
    price_per_hour: float
    capacity_available: bool
    region: str

@dataclass
class PlanSegment:
    start: str
    end: str
    type: str  # "RUN", "CHECKPOINT", "WAIT"

@dataclass
class CandidateStrategy:
    strategy: str  # "RUN", "DELAY", "FRAGMENT"
    start_time: str
    finish_time: str
    carbon_g: float
    cost: float
    deadline_slack_hours: float
    segments_count: int
    is_feasible: bool
    rejection_reasons: List[str] = field(default_factory=list)
    segments: List[PlanSegment] = field(default_factory=list)
    score: float = 0.0

@dataclass
class WorkloadRequest:
    workload_type: str
    runtime_hours: float
    deadline: str
    budget: float
    region: str = "IN"
    carbon_priority: str = "high"
    checkpointable: bool = True
    checkpoint_overhead_minutes: int = 15
    safety_buffer_minutes: int = 30
    submission_time: Optional[str] = None
    power_kw: float = 1.0

    def __post_init__(self):
        # Pydantic validation requirements per Section 6
        if self.runtime_hours <= 0:
            raise ValueError("runtime_hours must be > 0")
        if self.budget < 0:
            raise ValueError("budget must be >= 0")
        if self.checkpoint_overhead_minutes < 0:
            raise ValueError("checkpoint_overhead_minutes must be >= 0")
        if self.safety_buffer_minutes < 0:
            raise ValueError("safety_buffer_minutes must be >= 0")
        if self.carbon_priority.lower() not in ["low", "medium", "high"]:
            raise ValueError("carbon_priority must be low, medium, or high")
        self.carbon_priority = self.carbon_priority.lower()
        if not isinstance(self.checkpointable, bool):
            raise ValueError("checkpointable must be boolean")

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WorkloadRequest":
        return cls(
            workload_type=data.get("workload_type", "ml_training"),
            runtime_hours=float(data["runtime_hours"]),
            deadline=str(data["deadline"]),
            budget=float(data["budget"]),
            region=str(data.get("region", "IN")),
            carbon_priority=str(data.get("carbon_priority", "high")),
            checkpointable=bool(data.get("checkpointable", True)),
            checkpoint_overhead_minutes=int(data.get("checkpoint_overhead_minutes", 15)),
            safety_buffer_minutes=int(data.get("safety_buffer_minutes", 30)),
            submission_time=data.get("submission_time"),
            power_kw=float(data.get("power_kw", 1.0)),
        )

@dataclass
class PlanResponse:
    decision: str
    effective_deadline: str
    selected_plan: List[Dict[str, Any]]
    estimated_cost: float
    estimated_carbon_g: float
    finish_time: str
    deadline_safe: bool
    budget_safe: bool
    checkpointable: bool
    score: float
    reason: List[str]
    candidates: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision": self.decision,
            "effective_deadline": self.effective_deadline,
            "selected_plan": self.selected_plan,
            "estimated_cost": round(self.estimated_cost, 2),
            "estimated_carbon_g": round(self.estimated_carbon_g, 2),
            "finish_time": self.finish_time,
            "deadline_safe": self.deadline_safe,
            "budget_safe": self.budget_safe,
            "checkpointable": self.checkpointable,
            "score": round(self.score, 4),
            "reason": self.reason,
            "candidates": self.candidates,
        }
