import unittest
from datetime import datetime, timezone, timedelta
from app.models.schemas import WorkloadRequest, CandidateStrategy, PlanSegment, SyntheticWindow
from app.engine.constraints import evaluate_hard_constraints

class TestConstraints(unittest.TestCase):
    def setUp(self):
        self.effective_deadline = datetime(2026, 10, 3, 7, 30, tzinfo=timezone.utc)
        self.windows = {
            "2026-10-02T22:00:00": SyntheticWindow("2026-10-02T22:00:00", 200.0, 75.0, True, "IN"),
            "2026-10-02T23:00:00": SyntheticWindow("2026-10-02T23:00:00", 200.0, 75.0, True, "IN"),
            "2026-10-03T00:00:00": SyntheticWindow("2026-10-03T00:00:00", 200.0, 75.0, False, "IN"), # unavailable hour
        }

    def test_candidate_exceeding_effective_deadline_rejected(self):
        """Test #5: Candidate exceeding effective deadline is rejected."""
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            budget=600.0,
            checkpointable=True
        )
        late_candidate = CandidateStrategy(
            strategy="RUN",
            start_time="2026-10-03T02:00:00+00:00",
            finish_time="2026-10-03T08:00:00+00:00", # exceeds effective deadline 07:30
            carbon_g=3000.0,
            cost=450.0,
            deadline_slack_hours=-0.5,
            segments_count=1,
            is_feasible=True,
            segments=[PlanSegment("2026-10-03T02:00:00+00:00", "2026-10-03T08:00:00+00:00", "RUN")]
        )
        passes, rejections = evaluate_hard_constraints(late_candidate, req, self.effective_deadline, self.windows)
        self.assertFalse(passes)
        self.assertTrue(any("DEADLINE_EXCEEDED" in r for r in rejections))

    def test_candidate_exceeding_budget_rejected(self):
        """Test #6: Candidate exceeding budget is rejected."""
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            budget=400.0, # tight budget
            checkpointable=True
        )
        expensive_candidate = CandidateStrategy(
            strategy="RUN",
            start_time="2026-10-02T22:00:00+00:00",
            finish_time="2026-10-03T04:00:00+00:00",
            carbon_g=3000.0,
            cost=450.0, # exceeds budget $400
            deadline_slack_hours=3.5,
            segments_count=1,
            is_feasible=True,
            segments=[PlanSegment("2026-10-02T22:00:00+00:00", "2026-10-03T04:00:00+00:00", "RUN")]
        )
        passes, rejections = evaluate_hard_constraints(expensive_candidate, req, self.effective_deadline, self.windows)
        self.assertFalse(passes)
        self.assertTrue(any("BUDGET_EXCEEDED" in r for r in rejections))

    def test_candidate_requiring_unavailable_capacity_rejected(self):
        """Test #7: Candidate requiring unavailable capacity is rejected."""
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=3.0,
            deadline="2026-10-03T08:00:00",
            budget=600.0,
            checkpointable=True
        )
        unavail_candidate = CandidateStrategy(
            strategy="RUN",
            start_time="2026-10-02T22:00:00+00:00",
            finish_time="2026-10-03T01:00:00+00:00", # overlaps 00:00 which has capacity_available=False
            carbon_g=1500.0,
            cost=225.0,
            deadline_slack_hours=6.5,
            segments_count=1,
            is_feasible=True,
            segments=[PlanSegment("2026-10-02T22:00:00+00:00", "2026-10-03T01:00:00+00:00", "RUN")]
        )
        passes, rejections = evaluate_hard_constraints(unavail_candidate, req, self.effective_deadline, self.windows)
        self.assertFalse(passes)
        self.assertTrue(any("CAPACITY_UNAVAILABLE" in r for r in rejections))

    def test_fragment_rejected_when_not_checkpointable(self):
        """Test #3: FRAGMENT is rejected when checkpointable=False."""
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            budget=600.0,
            checkpointable=False # cannot checkpoint!
        )
        frag_candidate = CandidateStrategy(
            strategy="FRAGMENT",
            start_time="2026-10-02T23:00:00+00:00",
            finish_time="2026-10-03T07:15:00+00:00",
            carbon_g=2900.0,
            cost=469.0,
            deadline_slack_hours=0.25,
            segments_count=2,
            is_feasible=True,
            segments=[
                PlanSegment("2026-10-02T23:00:00+00:00", "2026-10-03T02:00:00+00:00", "RUN"),
                PlanSegment("2026-10-03T04:00:00+00:00", "2026-10-03T07:00:00+00:00", "RUN")
            ]
        )
        passes, rejections = evaluate_hard_constraints(frag_candidate, req, self.effective_deadline, self.windows)
        self.assertFalse(passes)
        self.assertTrue(any("CHECKPOINT_REQUIRED" in r for r in rejections))

    def test_api_validation_rejects_negative_runtime(self):
        """Test #10: API validation rejects negative runtime."""
        with self.assertRaises(ValueError):
            WorkloadRequest(
                workload_type="ml_training",
                runtime_hours=-5.0, # invalid!
                deadline="2026-10-03T08:00:00",
                budget=600.0
            )

if __name__ == "__main__":
    unittest.main()
