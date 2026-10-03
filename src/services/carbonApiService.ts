export interface HourlyCarbonData {
  time: string;
  hour: number;
  intensity: number; // gCO2/kWh
  renewablePercentage: number;
  isPeak: boolean;
  isOptimal: boolean;
  statusText: string;
}

export interface GridForecastResponse {
  region: string;
  regionName: string;
  fetchedAt: string;
  unit: string;
  data: HourlyCarbonData[];
  metrics: {
    current: number;
    min: { value: number; time: string };
    max: { value: number; time: string };
    avg: number;
    recommendedWindow: string;
  };
}

// Generate realistic 24-hour predicted carbon intensity trends
export async function fetchLiveGridForecast(
  region: string = 'IN',
  isSpiked: boolean = false
): Promise<GridForecastResponse> {
  // Simulate network latency of live API call
  await new Promise((resolve) => setTimeout(resolve, 450));

  const now = new Date();
  const currentHour = 12; // Start from 12:00 midday benchmark per spec

  const data: HourlyCarbonData[] = [];
  
  // Base 24-hour curve profiles for regions
  for (let i = 0; i < 24; i++) {
    const h = (currentHour + i) % 24;
    const timeLabel = `${h.toString().padStart(2, '0')}:00`;

    let baseIntensity = 180;
    let renewable = 35;

    // Diurnal grid pattern:
    // 12:00 - 16:00: Solar peak -> Low carbon (125-165 gCO2/kWh, 45-55% renewable)
    // 17:00 - 20:00: Evening peak -> High fossil peaker dispatch (210-270 gCO2, or 360 if spiked)
    // 21:00 - 05:00: Night baseload & wind (120-170 gCO2, 40-50% renewable)
    // 06:00 - 11:00: Morning ramp (160-200 gCO2)
    if (h >= 12 && h <= 15) {
      baseIntensity = 180 - (h - 11) * 18; // drops to 125 at 15:00
      renewable = 38 + (h - 11) * 4;
    } else if (h === 16) {
      baseIntensity = 145;
      renewable = 44;
    } else if (h === 17) {
      baseIntensity = isSpiked ? 360 : 210;
      renewable = isSpiked ? 14 : 28;
    } else if (h === 18) {
      baseIntensity = isSpiked ? 310 : 270;
      renewable = 18;
    } else if (h === 19) {
      baseIntensity = 250;
      renewable = 20;
    } else if (h === 20) {
      baseIntensity = 190;
      renewable = 30;
    } else if (h >= 21 || h <= 2) {
      baseIntensity = 140 - (h >= 21 ? (h - 21) * 8 : (h + 3) * 6);
      renewable = 46;
    } else if (h >= 3 && h <= 6) {
      baseIntensity = 120 + (h - 3) * 10;
      renewable = 48;
    } else {
      // 07:00 - 11:00
      baseIntensity = 160 + ((h - 7) % 5) * 8;
      renewable = 34;
    }

    // Regional adjustments
    if (region === 'US-EAST') {
      baseIntensity = Math.round(baseIntensity * 1.35); // PJM gas/coal baseline
      renewable = Math.max(12, renewable - 10);
    } else if (region === 'EU-WEST') {
      baseIntensity = Math.round(baseIntensity * 0.75); // German / EU high wind baseline
      renewable = Math.min(75, renewable + 15);
    }

    const isOptimal = baseIntensity <= 150;
    const isPeak = baseIntensity >= 230 || (h === 17 && isSpiked);

    let statusText = 'Normal';
    if (isPeak) statusText = 'Dirty Peaker Peak';
    else if (isOptimal) statusText = 'Clean Valley (Solar/Wind)';

    data.push({
      time: timeLabel,
      hour: h,
      intensity: baseIntensity,
      renewablePercentage: renewable,
      isPeak,
      isOptimal,
      statusText,
    });
  }

  // Calculate high-level summary metrics
  const intensities = data.map((d) => d.intensity);
  const minVal = Math.min(...intensities);
  const maxVal = Math.max(...intensities);
  const minItem = data.find((d) => d.intensity === minVal)!;
  const maxItem = data.find((d) => d.intensity === maxVal)!;
  const avg = Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length);

  const regionNames: Record<string, string> = {
    IN: 'India (Western Regional Grid)',
    'US-EAST': 'US-East (PJM Interconnection)',
    'EU-WEST': 'Europe-West (Germany - TenneT/50Hertz)',
  };

  return {
    region,
    regionName: regionNames[region] || region,
    fetchedAt: new Date().toLocaleTimeString(),
    unit: 'gCO2/kWh',
    data,
    metrics: {
      current: data[0].intensity,
      min: { value: minVal, time: minItem.time },
      max: { value: maxVal, time: maxItem.time },
      avg,
      recommendedWindow: `${minItem.time} – ${((minItem.hour + 4) % 24).toString().padStart(2, '0')}:00`,
    },
  };
}
