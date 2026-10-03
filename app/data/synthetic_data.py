from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
import random
from app.models.schemas import SyntheticWindow

# Exact synthetic benchmark profiles from Section 4, 9, 22
REFERENCE_HOURLY_INTENSITIES: Dict[int, float] = {
    22: 600.0,
    23: 560.0,
    0:  510.0,
    1:  490.0,
    2:  590.0, # fossil spike window
    3:  610.0, # dirty peaker peak
    4:  450.0, # clean early morning valley
    5:  420.0,
    6:  440.0,
    7:  540.0,
    8:  580.0,
}

def generate_synthetic_conditions(
    start_time: datetime,
    hours: int = 24,
    region: str = "IN",
    default_price: float = 75.0,
    unavailable_hours: Optional[List[int]] = None,
    seed: int = 42
) -> List[SyntheticWindow]:
    """
    Generates a deterministic sequence of hourly windows covering the scheduling horizon.
    Uses deterministic seeding per Section 9 for reproducible tests and demos.
    """
    rng = random.Random(seed)
    windows: List[SyntheticWindow] = []
    unavail = unavailable_hours or []

    for i in range(hours):
        t = start_time + timedelta(hours=i)
        h = t.hour

        # Base intensity aligned with reference benchmark scenario
        if h in REFERENCE_HOURLY_INTENSITIES:
            base_intensity = REFERENCE_HOURLY_INTENSITIES[h]
        elif 12 <= h <= 16:
            # Solar peak valley
            base_intensity = 180.0 - (h - 11) * 15.0
        elif 17 <= h <= 20:
            # Evening lighting peaker ramp
            base_intensity = 210.0 + (h - 16) * 30.0
        else:
            base_intensity = 200.0 + (rng.random() * 40.0 - 20.0)

        # Region scaling
        if region == "EU-NORTH":
            base_intensity *= 0.25
        elif region == "US-WEST":
            base_intensity *= 0.50
        elif region == "EU-WEST":
            base_intensity *= 0.65
        elif region == "US-EAST":
            base_intensity *= 1.35
        elif region == "ASIA-EAST":
            base_intensity *= 1.20

        is_capacity_avail = h not in unavail

        windows.append(
            SyntheticWindow(
                timestamp=t.isoformat(),
                carbon_intensity=round(base_intensity, 1),
                price_per_hour=default_price,
                capacity_available=is_capacity_avail,
                region=region,
            )
        )

    return windows

def get_window_at_time(windows: List[SyntheticWindow], target_time: datetime) -> Optional[SyntheticWindow]:
    """Finds the hourly window matching target_time."""
    target_iso_hour = target_time.strftime("%Y-%m-%dT%H:00:00")
    for w in windows:
        if w.timestamp.startswith(target_iso_hour[:13]):
            return w
    return None
