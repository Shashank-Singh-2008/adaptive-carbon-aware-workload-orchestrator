# System Architecture & Directory Layout

The **Adaptive Carbon-Aware Workload Orchestrator** is an enterprise-grade platform uniting a reactive React + TypeScript frontend, an Express + Vite full-stack middleware server, and a high-performance Python decision engine.

---

## High-Level Repository Structure

```
adaptive-carbon-aware-workload-orchestrator/
├── app/                        # Python Backend: Deterministic Decision Engine & Simulator
│   ├── data/                   # Synthetic & live regional grid carbon models
│   ├── engine/                 # Constraint evaluation, candidate scoring, and strategy engine
│   ├── models/                 # Pydantic schemas and contract definitions
│   ├── simulator/              # Segment state machines & workload execution simulators
│   └── main.py                 # FastAPI service endpoints
│
├── docs/                       # Architectural & Technical Specifications
│   └── ARCHITECTURE.md         # System design and component map
│
├── src/                        # Modern React 19 + TypeScript Frontend
│   ├── components/             # Modular Component Hierarchy
│   │   ├── layout/             # Shell components (Header, Sidebar)
│   │   ├── views/              # Route views (Dashboard, Orchestrator, Workloads, etc.)
│   │   ├── widgets/            # Interactive charts, widgets & maps
│   │   └── index.ts            # Central component barrel export
│   │
│   ├── services/               # External APIs, live grid data, and Gemini integration
│   │   ├── carbonApiService.ts
│   │   └── index.ts
│   │
│   ├── types/                  # Strictly-typed interfaces and TypeScript definitions
│   │   ├── auth.ts
│   │   ├── orchestrator.ts
│   │   └── index.ts
│   │
│   ├── utils/                  # Algorithmic decision engine & localStorage persistence
│   │   ├── decisionEngine.ts
│   │   ├── workloadHistory.ts
│   │   └── index.ts
│   │
│   ├── App.tsx                 # Core application controller & shared state
│   ├── main.tsx                # Client entry point
│   └── index.css               # Global theme tokens, typography, and Tailwind styles
│
├── tests/                      # Python automated test suite
│   ├── test_constraints.py
│   ├── test_decision_engine.py
│   ├── test_scoring.py
│   └── test_strategies.py
│
├── index.html                  # Single Page Application entry
├── server.ts                   # Express & Vite SSR/API middleware server
├── vite.config.ts              # Vite configuration & security settings
├── tsconfig.json               # TypeScript compiler rules & path aliases
├── package.json                # Node dependencies & build scripts
└── requirements.txt            # Python dependencies
```

---

## Component Separation of Concerns

### 1. `src/components/layout/`
Encapsulates structural presentation elements:
- **`Header.tsx`**: Status indicator, live vs. synthetic data toggles, quick spike simulations, user profile avatar, and logout dialogs.
- **`Sidebar.tsx`**: Navigation menu with active re-plan counters, system branding, and tab dispatching.

### 2. `src/components/views/`
Page-level routing and state containers:
- **`DashboardView.tsx`**: Main overview KPI dashboard with live widgets and workload pipelines.
- **`OrchestratorView.tsx`**: 5-step interactive scheduling wizard (Setup → Agent Extraction → Strategy Evaluation → Live Simulation → Adaptive Re-planning).
- **`WorkloadsView.tsx`**: Telemetry and history audit logs with status filters, search, and JSON export.
- **`MonitoringView.tsx`**: Real-time regional grid monitoring and forecasted intensity analysis.
- **`LoginView.tsx`**: Multi-role demo authentication panel (DevOps Lead, FinOps Lead, Sustainability Auditor).
- **`AnalyticsView.tsx`**, **`ResourcesView.tsx`**, **`AlertsView.tsx`**, **`SettingsView.tsx`**: Dedicated observability and management views.

### 3. `src/components/widgets/`
Reusable data visualization and chart components:
- **`WorkloadActivityGraph.tsx`**: 24-hour composite timeline chart and active process table.
- **`CarbonEfficiencyWidget.tsx`**: Multi-strategy savings comparisons (DELAY/FRAGMENT vs. RUN).
- **`CarbonIntensityForecast.tsx`**: Interactive grid forecast curves with hover states.
- **`RegionalCarbonMap.tsx`**: Multi-region datacenter carbon emission distribution map.

---

## Key Design Principles
1. **Zero Circular Dependencies**: All layers consume strictly defined contracts from `src/types/`.
2. **Barrel Exports**: Every sub-package exposes an `index.ts` file for clean, predictable imports.
3. **Deterministic Core**: Scheduling decisions remain reproducible with explicit explanations for each candidate strategy.
