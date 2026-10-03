from typing import Dict, Any
from app.models.schemas import WorkloadRequest, PlanResponse
from app.engine.decision_engine import decide

try:
    from fastapi import FastAPI, HTTPException, status
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field

    app = FastAPI(
        title="Adaptive Carbon-Aware Workload Orchestrator",
        description="Deterministic Decision Engine MVP for Carbon-Aware Workload Scheduling",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class WorkloadInputSchema(BaseModel):
        workload_type: str = "ml_training"
        runtime_hours: float = Field(gt=0, description="Runtime hours must be > 0")
        deadline: str = Field(description="ISO formatted deadline")
        budget: float = Field(ge=0, description="Budget cap must be >= 0")
        region: str = "IN"
        carbon_priority: str = Field(default="high", description="low, medium, or high")
        checkpointable: bool = True
        checkpoint_overhead_minutes: int = Field(default=15, ge=0)
        safety_buffer_minutes: int = Field(default=30, ge=0)
        submission_time: str = None
        power_kw: float = 1.0

    @app.get("/health")
    def health():
        return {
            "status": "healthy",
            "service": "adaptive-carbon-orchestrator-decision-engine",
            "version": "1.0.0"
        }

    @app.post("/plan")
    def create_plan(payload: WorkloadInputSchema):
        try:
            req = WorkloadRequest.from_dict(payload.model_dump())
            result = decide(req)
            return result.to_dict()
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

except ImportError:
    # Fallback to standard library router if fastapi/uvicorn is not in python path
    app = None

# Pure Python dispatch function for CLI or embedded execution
def handle_plan_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    req = WorkloadRequest.from_dict(payload)
    result = decide(req)
    return result.to_dict()

def handle_health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "adaptive-carbon-orchestrator-decision-engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import json
    import sys
    print("Adaptive Carbon-Aware Decision Engine running in standalone mode.")
    if len(sys.argv) > 1 and sys.argv[1] == "test-run":
        sample = {
            "workload_type": "ml_training",
            "runtime_hours": 6.0,
            "deadline": "2026-10-03T08:00:00",
            "budget": 600.0,
            "region": "IN",
            "carbon_priority": "high",
            "checkpointable": True,
            "checkpoint_overhead_minutes": 15,
            "safety_buffer_minutes": 30
        }
        res = handle_plan_request(sample)
        print(json.dumps(res, indent=2))
