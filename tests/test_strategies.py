import unittest
from datetime import datetime, timezone
from app.models.schemas import WorkloadRequest
from app.data.synthetic_data import generate_synthetic_conditions
from app.engine.strategies import generate_run, generate_delay, generate_fragment

class TestStrategies(unittest.TestCase):
    def setUp(self):
        self.start_time = datetime(2026, 10, 2, 22, 0, tzinfo=timezone.utc)
        self.deadline = datetime(2026, 10, 3, 7, 30, tzinfo=timezone.utc)
        self.windows = generate_synthetic_conditions(self.start_time, hours=24, seed=42)

    def test_run_strategy_generation(self):
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            budget=600.0,
            checkpointable=True
        )
        candidates = generate_run(req, self.windows, self.start_time, self.deadline)
        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0].strategy, "RUN")
        self.assertEqual(candidates[0].segments_count, 1)
        self.assertEqual(candidates[0].cost, 450.0)

    def test_delay_strategy_generation(self):
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            budget=600.0,
            checkpointable=True
        )
        candidates = generate_delay(req, self.windows, self.start_time, self.deadline)
        self.assertGreaterEqual(len(candidates), 1)
        for c in candidates:
            self.assertEqual(c.strategy, "DELAY")
            self.assertEqual(c.segments_count, 1)

    def test_fragment_rejected_when_checkpoint_overhead_negates_savings(self):
        """Test #4: FRAGMENT is rejected when checkpoint overhead makes net carbon saving non-positive."""
        req = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            budget=600.0,
            checkpointable=True,
            checkpoint_overhead_minutes=180, # extreme 3h overhead that ruins savings
            carbon_priority="high"
        )
        # Passing an artificially low baseline so fragment carbon exceeds baseline
        candidates = generate_fragment(req, self.windows, self.start_time, self.deadline, baseline_run_carbon=100.0)
        for c in candidates:
            self.assertFalse(c.is_feasible)
            self.assertTrue(any("NO_CARBON_SAVINGS" in r for r in c.rejection_reasons))

if __name__ == "__main__":
    unittest.main()
