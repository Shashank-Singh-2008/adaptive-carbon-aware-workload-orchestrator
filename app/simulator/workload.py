from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from enum import Enum
from app.models.schemas import PlanSegment

class WorkloadState(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    CHECKPOINTED_WAITING = "CHECKPOINTED/WAITING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class WorkloadSimulator:
    """
    Simulated Workload Execution State Machine (Section 24).
    Simulates progress across segments, preserves state across pauses,
    and supports monitoring disturbance triggers.
    """
    def __init__(
        self,
        total_runtime_hours: float,
        plan_segments: List[Dict[str, Any]],
        start_time: datetime
    ):
        self.total_runtime_hours = total_runtime_hours
        self.remaining_runtime_hours = total_runtime_hours
        self.plan_segments = plan_segments
        self.current_time = start_time
        self.state = WorkloadState.PENDING
        self.current_segment_idx = 0
        self.checkpoints_saved = 0
        self.events_log: List[str] = [f"Initialized: {self.state.value} at {start_time.isoformat()}"]

    def step(self, advance_hours: float = 1.0) -> WorkloadState:
        """Advances simulated time by advance_hours and updates state."""
        if self.state in [WorkloadState.COMPLETED, WorkloadState.FAILED]:
            return self.state

        self.current_time += timedelta(hours=advance_hours)

        if self.remaining_runtime_hours <= 0:
            self.state = WorkloadState.COMPLETED
            self.events_log.append(f"Completed all execution segments at {self.current_time.isoformat()}")
            return self.state

        # Check current active segment based on current_time
        iso_now = self.current_time.isoformat()
        active_segment = None
        for idx, seg in enumerate(self.plan_segments):
            if seg["start"] <= iso_now <= seg["end"]:
                active_segment = seg
                self.current_segment_idx = idx
                break

        if active_segment:
            if active_segment.get("type") == "RUN":
                self.state = WorkloadState.RUNNING
                self.remaining_runtime_hours = max(0.0, self.remaining_runtime_hours - advance_hours)
                self.events_log.append(
                    f"Running segment {self.current_segment_idx + 1}: remaining {self.remaining_runtime_hours:.2f}h"
                )
            else:
                self.state = WorkloadState.CHECKPOINTED_WAITING
                self.checkpoints_saved += 1
                self.events_log.append(f"Paused/Checkpointed at {self.current_time.isoformat()}")
        else:
            if self.remaining_runtime_hours > 0:
                self.state = WorkloadState.CHECKPOINTED_WAITING

        if self.remaining_runtime_hours <= 0:
            self.state = WorkloadState.COMPLETED

        return self.state

    def trigger_failure(self, reason: str):
        """Explicit simulated failure condition."""
        self.state = WorkloadState.FAILED
        self.events_log.append(f"Simulated failure: {reason}")
