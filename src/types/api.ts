/**
 * Netlify Function API Types
 * Types for BusTime API responses and GTFS-RT data
 */

// =============================================================================
// Agency identifiers
// =============================================================================

export type BustimeAgency = 'ddot' | 'smart' | 'theride';
export type TransitWindsorAgency = 'transit-windsor';
export type RealTimeAgency = BustimeAgency | TransitWindsorAgency;

// =============================================================================
// BusTime API Types (DDOT, SMART, TheRide)
// =============================================================================

/** Wrapper for all BusTime API responses */
export interface BustimeResponse<T> {
  'bustime-response': T;
}

/** Predictions response from BusTime API */
export interface BustimePredictionsData {
  prd?: BustimePrediction[];
  error?: BustimeError[];
}

/** Vehicles response from BusTime API */
export interface BustimeVehiclesData {
  vehicle?: BustimeVehicle[];
  error?: BustimeError[];
}

/** Patterns response from BusTime API */
export interface BustimePatternsData {
  ptr?: BustimePattern[];
  error?: BustimeError[];
}

export interface BustimeError {
  msg: string;
  rt?: string;
  stpid?: string;
  vid?: string;
}

/** Real-time prediction from BusTime API */
export interface BustimePrediction {
  /** Timestamp of prediction generation */
  tmstmp: string;
  /** Type: 'A' = Arrival, 'D' = Departure */
  typ: 'A' | 'D';
  /** Stop ID */
  stpid: string;
  /** Stop name */
  stpnm: string;
  /** Vehicle ID */
  vid: string;
  /** Distance to stop (feet) */
  dstp: number;
  /** Route designator (short name) */
  rt: string;
  /** Route direction */
  rtdir: string;
  /** Final destination */
  des: string;
  /** Predicted arrival/departure time */
  prdtm: string;
  /** Countdown in minutes (as string) */
  prdctdn: string;
  /** Table departure time (scheduled) */
  tablockid?: string;
  /** Trip ID */
  tatripid?: string;
  /** Original route direction for display */
  origtatripno?: string;
  /** Delayed flag */
  dly?: boolean;
  /** Dynamic message ID */
  dyn?: number;
  /** Zone */
  zone?: string;
}

/** Real-time vehicle position from BusTime API */
export interface BustimeVehicle {
  /** Vehicle ID */
  vid: string;
  /** Timestamp */
  tmstmp: string;
  /** Latitude */
  lat: string;
  /** Longitude */
  lon: string;
  /** Heading (0-360 degrees) */
  hdg: string;
  /** Pattern ID */
  pid: number;
  /** Route designator */
  rt: string;
  /** Destination */
  des: string;
  /** Pattern distance traveled */
  pdist: number;
  /** Speed (mph) */
  spd: number;
  /** Table block ID */
  tablockid?: string;
  /** Trip ID */
  tatripid?: string;
  /** Zone */
  zone?: string;
  /** Mode (bus, etc) */
  mode?: number;
  /** Passenger load */
  psgld?: string;
  /** Route direction */
  rtdir?: string;
}

/** Pattern (route shape) from BusTime API */
export interface BustimePattern {
  /** Pattern ID */
  pid: number;
  /** Length in feet */
  ln: number;
  /** Route direction */
  rtdir: string;
  /** Pattern points */
  pt: BustimePatternPoint[];
}

/** A point in a BusTime pattern */
export interface BustimePatternPoint {
  /** Sequence number */
  seq: number;
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Point type: 'S' = stop, 'W' = waypoint */
  typ: 'S' | 'W';
  /** Stop ID (only for stops) */
  stpid?: string;
  /** Stop name (only for stops) */
  stpnm?: string;
  /** Pattern distance at this point */
  pdist: number;
}

// =============================================================================
// Transit Windsor API Types
// =============================================================================

export interface TransitWindsorPrediction {
  StopId: string;
  StopName: string;
  RouteNo: string;
  RouteName: string;
  DirectionName: string;
  VehicleNo: string;
  PredictedTime: string;
  ScheduledTime: string;
  IsPredicted: boolean;
  IsDelayed: boolean;
}

// =============================================================================
// GTFS-RT Vehicle Positions (gtfs-rt-vehicles function)
// =============================================================================

export interface GtfsRtVehiclesResponse {
  timestamp: number | null;
  vehicleCount: number;
  vehicles: GtfsRtVehicle[];
}

export interface GtfsRtVehicle {
  id: string;
  tripId: string | null;
  routeId: string | null;
  directionId: number | null;
  headsign: string | null;
  latitude: number | null;
  longitude: number | null;
  bearing: number | null;
  speed: number | null;
  timestamp: number | null;
  vehicleId: string | null;
  vehicleLabel: string | null;
  currentStopSequence: number | null;
  stopId: string | null;
  currentStatus: VehicleStopStatus | null;
  congestionLevel: CongestionLevel | null;
  occupancyStatus: OccupancyStatus | null;
}

/** GTFS-RT VehicleStopStatus enum values */
export type VehicleStopStatus =
  | 'INCOMING_AT'
  | 'STOPPED_AT'
  | 'IN_TRANSIT_TO';

/** GTFS-RT CongestionLevel enum values */
export type CongestionLevel =
  | 'UNKNOWN_CONGESTION_LEVEL'
  | 'RUNNING_SMOOTHLY'
  | 'STOP_AND_GO'
  | 'CONGESTION'
  | 'SEVERE_CONGESTION';

/** GTFS-RT OccupancyStatus enum values */
export type OccupancyStatus =
  | 'EMPTY'
  | 'MANY_SEATS_AVAILABLE'
  | 'FEW_SEATS_AVAILABLE'
  | 'STANDING_ROOM_ONLY'
  | 'CRUSHED_STANDING_ROOM_ONLY'
  | 'FULL'
  | 'NOT_ACCEPTING_PASSENGERS';

// =============================================================================
// Query Parameter Types
// =============================================================================

export interface PredictionsQueryParams {
  agency: RealTimeAgency;
  vehicleId?: string;
}

export interface StopPredictionsQueryParams {
  agency: RealTimeAgency;
  stopId: string;
}

export interface VehicleQueryParams {
  agency: BustimeAgency;
  vehicleIds: string;
}

export interface PatternsQueryParams {
  agency: RealTimeAgency;
  routeId: string;
}

export interface GtfsRtQueryParams {
  url: string;
}
