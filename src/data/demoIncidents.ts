import { Incident, TelemetryPoint } from '../types';

export const DEMO_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-0891',
    title: 'Flash Flame Ingress in Solvent Storage',
    type: 'fire',
    severity: 'critical',
    status: 'active',
    location: 'Sector 4B - Chemical Processing Unit',
    zone: 'Zone-North',
    sector: 'SEC-4B',
    timestamp: '2026-10-21 23:42:18 UTC',
    confidence: 0.964,
    cameraFeedId: 'CAM-08-THERMAL',
    evidenceImageUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80',
    isDemo: true,
    description: 'High-intensity localized flame cluster identified adjacent to volatile drum storage rack. Thermal gradient elevated by 142°C in 45 seconds.',
    spreadRateEstimate: '1.8 m/min',
    temperaturePeak: 485,
    actionsTaken: [
      'Automated HVAC exhaust isolation engaged (SIMULATED)',
      'Hazmat dispatch unit alert broadcast (SIMULATED)',
      'Perimeter thermal scan initialized'
    ]
  },
  {
    id: 'INC-2026-0889',
    title: 'Dense Smoldering Smoke Column',
    type: 'smoke',
    severity: 'high',
    status: 'investigating',
    location: 'East Timber Yard - Bay 12',
    zone: 'Zone-East',
    sector: 'SEC-12E',
    timestamp: '2026-10-21 22:15:04 UTC',
    confidence: 0.912,
    cameraFeedId: 'CAM-03-OPTICAL',
    evidenceImageUrl: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=600&q=80',
    isDemo: true,
    description: 'Expanding grey-white smoke plume emerging from stacked pine pallets. Optical attenuation index reaches 72%.',
    spreadRateEstimate: '0.6 m/min',
    temperaturePeak: 120,
    actionsTaken: [
      'Security patrol unit routed to Bay 12',
      'Air intake dampers closed to adjacent Office B'
    ]
  },
  {
    id: 'INC-2026-0884',
    title: 'Dual Fire & Heavy Smoke Plume',
    type: 'combined',
    severity: 'critical',
    status: 'active',
    location: 'Turbine Hall B - Transformer Substation',
    zone: 'Zone-Central',
    sector: 'SEC-02C',
    timestamp: '2026-10-21 20:30:11 UTC',
    confidence: 0.958,
    cameraFeedId: 'CAM-11-OPTICAL',
    evidenceImageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80',
    isDemo: true,
    description: 'Oil dielectric fluid ignition with rapid thick black smoke plume contacting overhead cable tray assembly.',
    spreadRateEstimate: '2.4 m/min',
    temperaturePeak: 560,
    actionsTaken: [
      'Substation busbar electrical trip command issued (SIMULATED)',
      'Water deluge advisory activated (ADVISORY)',
      'Emergency personnel muster alarm sounded'
    ]
  },
  {
    id: 'INC-2026-0872',
    title: 'Electrical Panel Arc Flash & Smoke Trace',
    type: 'smoke',
    severity: 'moderate',
    status: 'contained',
    location: 'Sub-level Electrical Vault 3',
    zone: 'Zone-Subfloor',
    sector: 'SEC-03S',
    timestamp: '2026-10-21 16:48:29 UTC',
    confidence: 0.843,
    cameraFeedId: 'CAM-14-PTZ',
    evidenceImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    isDemo: true,
    description: 'Initial optical detection of localized aerosol ionization and thin smoke wisps from 480V distribution breaker.',
    spreadRateEstimate: '0.1 m/min',
    temperaturePeak: 88,
    actionsTaken: [
      'Breaker locked out by maintenance technician',
      'Area vented with mobile extraction fan',
      'Thermal camera verified temperature normalized to 24°C'
    ]
  },
  {
    id: 'INC-2026-0865',
    title: 'Controlled Burn Flare Pit Drift',
    type: 'fire',
    severity: 'low',
    status: 'resolved',
    location: 'Perimeter Flare Station 1',
    zone: 'Zone-Perimeter',
    sector: 'SEC-FL1',
    timestamp: '2026-10-21 12:10:00 UTC',
    confidence: 0.981,
    cameraFeedId: 'CAM-01-WIDE',
    evidenceImageUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80',
    isDemo: true,
    description: 'Scheduled flare combustion observed within permissible burn radius. Flagged due to sudden wind gust deflection.',
    spreadRateEstimate: '0.0 m/min',
    temperaturePeak: 310,
    actionsTaken: [
      'Verified against scheduled flare activity authorization',
      'Flagged as false alarm / authorized burn in telemetry log'
    ]
  }
];

export const DEMO_TELEMETRY: TelemetryPoint[] = [
  { time: '00:00', fireCount: 0, smokeCount: 1, totalAlerts: 1 },
  { time: '03:00', fireCount: 0, smokeCount: 0, totalAlerts: 0 },
  { time: '06:00', fireCount: 1, smokeCount: 1, totalAlerts: 2 },
  { time: '09:00', fireCount: 0, smokeCount: 2, totalAlerts: 2 },
  { time: '12:00', fireCount: 2, smokeCount: 3, totalAlerts: 5 },
  { time: '15:00', fireCount: 1, smokeCount: 2, totalAlerts: 3 },
  { time: '18:00', fireCount: 3, smokeCount: 4, totalAlerts: 7 },
  { time: '21:00', fireCount: 2, smokeCount: 3, totalAlerts: 5 },
  { time: 'Now',   fireCount: 4, smokeCount: 6, totalAlerts: 10 },
];
