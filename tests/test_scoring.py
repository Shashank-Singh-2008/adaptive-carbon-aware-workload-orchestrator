import unittest
from app.models.schemas import CandidateStrategy, WorkloadRequest
from app.engine.scoring import score_candidates, select_best_with_tiebreakers

class TestScoring(unittest.TestCase):
    def setUp(self):
        self.req_high_carbon = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            budget=600.0,
            carbon_priority="high"
        )
        self.req_low_carbon = WorkloadRequest(
            workload_type="ml_training",
            runtime_hours=6.0,
            deadline="2026-10-03T08:00:00",
            budget=600.0,
            carbon_priority="low"
        )

    def test_scoring_normalizes_and_ranks(self):
        c1 = CandidateStrategy("RUN", "2026-10-02T22:00:00", "2026-10-03T04:00:00", 3360.0, 450.0, 3.5, 1, True)
        c2 = CandidateStrategy("DELAY", "2026-10-03T00:00:00", "2026-10-03T06:00:00", 3190.0, 450.0, 1.5, 1, True)
        c3 = CandidateStrategy("FRAGMENT", "2026-10-02T23:00:00", "2026-10-03T07:15:00", 3003.0, 469.0, 0.25, 2, True)

        scored = score_candidates([c1, c2, c3], self.req_high_carbon)
        for c in scored:
            self.assertGreater(c.score, 0.0)

    def test_tie_breaking_prefers_lower_carbon(self):
        """Section 17 rule 1: prefer lower carbon in near-tie."""
        c1 = CandidateStrategy("PLAN_A", "2026-10-02T22:00:00", "2026-10-03T04:00:00", 3000.0, 450.0, 2.0, 1, True, score=0.850)
        c2 = CandidateStrategy("PLAN_B", "2026-10-02T22:00:00", "2026-10-03T04:00:00", 2950.0, 450.0, 2.0, 1, True, score=0.851)
        best = select_best_with_tiebreakers([c1, c2])
        self.assertEqual(best.strategy, "PLAN_B")

    def test_tie_breaking_prefers_lower_cost(self):
        """Section 17 rule 2: if carbon is equal, prefer lower cost."""
        c1 = CandidateStrategy("PLAN_EXPENSIVE", "2026-10-02T22:00:00", "2026-10-03T04:00:00", 3000.0, 480.0, 2.0, 1, True, score=0.850)
        c2 = CandidateStrategy("PLAN_CHEAP", "2026-10-02T22:00:00", "2026-10-03T04:00:00", 3000.0, 450.0, 2.0, 1, True, score=0.850)
        best = select_best_with_tiebreakers([c1, c2])
        self.assertEqual(best.strategy, "PLAN_CHEAP")

if __name__ == "__main__":
    unittest.main()
