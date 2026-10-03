# Adaptive Carbon-Aware Workload Orchestrator

An end-to-end adaptive workload orchestration platform for carbon-aware scheduling and execution. It evaluates **RUN**, **DELAY**, and **FRAGMENT** strategies against hard constraints (deadline, budget, capacity, region, checkpoint capability), continuously monitors grid carbon intensity forecasts, and autonomously adapts in-flight execution when grid conditions spike.

---

## Project Structure

```
adaptive-carbon-aware-workload-orchestrator/
├── app/                        # Python Backend: Deterministic Decision Engine & Simulator
│   ├── data/                   # Hourly carbon, cost & capacity models
│   ├── engine/                 # Constraint rules, scoring, and candidate strategies
│   ├── models/                 # Pydantic schemas & data validation
│   ├── simulator/              # Segment-based workload state machine
│   └── main.py                 # FastAPI service endpoints
│
├── docs/                       # Architectural & Technical Specifications
│   └── ARCHITECTURE.md         # Detailed system design & component map
│
├── src/                        # Modern React 19 + TypeScript Frontend
│   ├── components/             # Cleanly organized component hierarchy
│   │   ├── layout/             # Shell navigation & chrome (Header, Sidebar)
│   │   ├── views/              # Route views (Dashboard, Orchestrator, Workloads, etc.)
│   │   ├── widgets/            # Interactive charts, widgets & maps
│   │   └── index.ts            # Central component barrel export
│   ├── services/               # API clients & live grid fetchers
│   ├── types/                  # Typed interfaces & contracts
│   ├── utils/                  # TypeScript decision engine & history store
│   ├── App.tsx                 # Core app state & navigation
│   └── index.css               # Design system & styling tokens
│
├── tests/                      # Automated Python test suite (16 test cases)
├── index.html                  # Single Page Application entry
├── server.ts                   # Express & Vite full-stack server
├── vite.config.ts              # Vite configuration
└── package.json                # Dependencies and build scripts
```

---

## How to Run Tests

Run the full test suite using Python's built-in test runner or `pytest`:

```bash
# Using python3 unittest runner
python3 -m unittest discover -s tests -p "test_*.py" -v

# Or using pytest (if installed)
pytest tests/ -v
```

---

## API Endpoints

### 1. `POST /plan`
Accepts a structured workload request and returns the selected plan, score, explainability reasons, and full candidate comparison.

#### Example Request:
```json
{
  "workload_type": "ml_training",
  "runtime_hours": 6.0,
  "deadline": "2026-10-03T08:00:00",
  "budget": 600.0,
  "region": "IN",
  "carbon_priority": "high",
  "checkpointable": true,
  "checkpoint_overhead_minutes": 15,
  "safety_buffer_minutes": 30
}
```

#### Example Response:
```json
{
  "decision": "FRAGMENT",
  "effective_deadline": "2026-10-03T07:30:00",
  "selected_plan": [
    {"start": "2026-10-02T23:00:00", "end": "2026-10-03T02:00:00", "type": "RUN"},
    {"start": "2026-10-03T04:00:00", "end": "2026-10-03T07:00:00", "type": "RUN"}
  ],
  "estimated_cost": 468.75,
  "estimated_carbon_g": 3003.0,
  "finish_time": "2026-10-03T07:00:00",
  "deadline_safe": true,
  "budget_safe": true,
  "checkpointable": true,
  "score": 0.825,
  "reason": [
    "Deadline satisfied",
    "Budget satisfied",
    "Checkpointing is available",
    "Lower estimated carbon than RUN NOW (Saves 357.0g CO₂)"
  ],
  "candidates": [...]
}
```

### 2. `GET /health`
Returns system status:
```json
{
  "status": "healthy",
  "service": "adaptive-carbon-orchestrator-decision-engine",
  "version": "1.0.0"
}
```

---

## Decision Logic & Constraints

1. **Hard Constraints (Strict Filters)**:
   - `finish_time <= effective_deadline` (`deadline - safety_buffer`)
   - `total_cost <= budget`
   - All segments must have available capacity in the requested region
   - `FRAGMENT` requires `checkpointable == True`
   - Candidates that violate any constraint are marked `is_feasible = False` and rejected before scoring.

2. **Scoring Model**:
   - `Carbon`: 50%
   - `Cost`: 20%
   - `Deadline safety`: 20%
   - `Overhead / complexity`: 10%
   - When `carbon_priority == "low"`, carbon weight is reduced to 20% and cost/deadline safety are elevated.

3. **Tie-Breaking**:
   - 1. Lower carbon emissions
   - 2. Lower total cost
   - 3. Earlier completion time
   - 4. Fewer checkpoints/segments
