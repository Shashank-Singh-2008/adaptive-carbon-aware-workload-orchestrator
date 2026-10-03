import unittest
from datetime import datetime, timezone
from app.models.schemas import WorkloadRequest
from app.engine.decision_engine import decide

class TestDecisionEngine(unittest.TestCase):
    def test_run_selected_when_only_feasible_plan(self):
        """Test #1: RUN is selected when it is the only feasible plan."""
        # Very tight deadline: exactly 6.5 hours window (6h runtime + 0.5h safety buffer)
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T04:30:00",
            submission_time="2026-10-02T22:00:00",
            safety_buffer_minutes=30,
            budget=600.0,
            checkpointable=True
        )
        plan = decide(req, seed=42)
        self.assertEqual(plan.decision, "RUN")
        self.assertTrue(plan.deadline_safe)
        self.assertTrue(plan.budget_safe)

    def test_delay_selected_when_later_window_better(self):
        """Test #2: DELAY is selected when a later low-carbon window gives a better feasible score."""
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            submission_time="2026-10-02T22:00:00",
            budget=600.0,
            checkpointable=False, # Disable checkpointing to isolate DELAY vs RUN
            carbon_priority="high"
        )
        plan = decide(req, seed=42)
        self.assertEqual(plan.decision, "DELAY")
        self.assertLess(plan.estimated_carbon_g, 3360.0)

    def test_no_feasible_plan_produced_when_constraints_violated(self):
        """Test #8: No candidate produces NO_FEASIBLE_PLAN rather than a fabricated result."""
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=12.0, # Impossible to finish within 4 hour window
            deadline="2026-10-03T02:00:00",
            submission_time="2026-10-02T22:00:00",
            budget=600.0,
            checkpointable=True
        )
        plan = decide(req, seed=42)
        self.assertEqual(plan.decision, "NO_FEASIBLE_PLAN")
        self.assertFalse(plan.deadline_safe)
        self.assertTrue(any("DEADLINE" in r for r in plan.reason))

    def test_reproducibility_same_seed_same_request(self):
        """Test #9: Same seed + same request produces the same decision."""
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            submission_time="2026-10-02T22:00:00",
            budget=600.0,
            checkpointable=True
        )
        plan1 = decide(req, seed=123)
        plan2 = decide(req, seed=123)
        self.assertEqual(plan1.decision, plan2.decision)
        self.assertEqual(plan1.estimated_carbon_g, plan2.estimated_carbon_g)
        self.assertEqual(plan1.estimated_cost, plan2.estimated_cost)
        self.assertEqual(plan1.score, plan2.score)

    def test_reference_synthetic_scenario(self):
        """Test Section 22: Reference Synthetic Scenario validation."""
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            submission_time="2026-10-02T22:00:00",
            safety_buffer_minutes=30,
            budget=600.0,
            checkpointable=True,
            checkpoint_overhead_minutes=15
        )
        plan = decide(req, seed=42)
        self.assertIn(plan.decision, ["FRAGMENT", "DELAY"])
        self.assertLessEqual(plan.estimated_cost, 600.0)
        self.assertTrue(plan.deadline_safe)
        self.assertTrue(plan.budget_safe)
        self.assertGreater(len(plan.candidates), 0)

if __name__ == "__main__":
    unittest.main()
