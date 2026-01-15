/**
 * GeoJSON Types for Maps
 * Extended GeoJSON types with transit-specific properties
 */

import type { Feature, FeatureCollection, Point, LineString, Polygon } from 'geojson';
import type { GtfsRoute, GtfsStop } from './gtfs';
import type { BustimePatternPoint } from './api';

// =============================================================================
// Route Feature Collection
// =============================================================================

/** Properties for a route line feature */
export interface RouteFeatureProperties extends GtfsRoute {
  directionDescription: string;
  directionId: number;
}

/** A route line feature */
export type RouteFeature = Feature<LineString, RouteFeatureProperties>;

/** Feature collection of route lines */
export interface RouteFeatureCollection extends FeatureCollection<LineString, RouteFeatureProperties> {
  features: RouteFeature[];
}

// =============================================================================
// Stops Feature Collection
// =============================================================================

/** Properties for a stop point feature */
export interface StopFeatureProperties extends GtfsStop {
  /** Label offset [x, y] */
  offset: [number, number];
  /** Text anchor position */
  anchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Text justification */
  justify: 'left' | 'right' | 'center';
}

/** A stop point feature */
export type StopFeature = Feature<Point, StopFeatureProperties>;

/** Feature collection of stops */
export interface StopsFeatureCollection extends FeatureCollection<Point, StopFeatureProperties> {
  features: StopFeature[];
}

// =============================================================================
// Vehicle Feature Collection
// =============================================================================

/** Properties for a vehicle point feature */
export interface VehicleFeatureProperties {
  /** Vehicle ID */
  vid: string;
  /** Latitude (as string from BusTime) */
  lat: string;
  /** Longitude (as string from BusTime) */
  lon: string;
  /** Heading (as string from BusTime) */
  hdg: string;
  /** Route short name */
  rt: string;
  /** Destination */
  des: string;
  /** Pattern ID */
  pid: number;
  /** Speed */
  spd: number;
  /** Pattern distance traveled */
  pdist: number;
  /** Timestamp */
  tmstmp?: string;

  // Enriched properties
  /** Agency slug */
  agency: string;
  /** Route description */
  description: string;
  /** Trip headsign */
  headsign: string;
  /** Direction ID (0 or 1) */
  directionId: number;
  /** Next stop on pattern */
  nextStop?: BustimePatternPoint;
  /** Upcoming stops on pattern */
  nextStops?: BustimePatternPoint[];
  /** Bearing in degrees */
  bearing: number;
  /** Vehicle icon type */
  vehicleIcon: 'bus';
  /** Maximum distance of the pattern */
  patternMaxDist: number;
}

/** A vehicle point feature */
export type VehicleFeature = Feature<Point, VehicleFeatureProperties>;

/** Feature collection of vehicles */
export interface VehicleFeatureCollection extends FeatureCollection<Point, VehicleFeatureProperties> {
  features: VehicleFeature[];
}

// =============================================================================
// GTFS-RT Vehicle Feature Collection
// =============================================================================

/** Properties for GTFS-RT vehicle (different from BusTime format) */
export interface GtfsRtVehicleFeatureProperties {
  id: string;
  tripId: string | null;
  routeId: string | null;
  directionId: number | null;
  headsign: string | null;
  latitude: number;
  longitude: number;
  bearing: number | null;
  speed: number | null;
  timestamp: number | null;
  vehicleId: string | null;
  vehicleLabel: string | null;
  currentStopSequence: number | null;
  stopId: string | null;
  currentStatus: string | null;

  // Enriched properties
  agency: string;
  vehicleIcon: 'bus';
}

/** A GTFS-RT vehicle point feature */
export type GtfsRtVehicleFeature = Feature<Point, GtfsRtVehicleFeatureProperties>;

/** Feature collection of GTFS-RT vehicles */
export interface GtfsRtVehicleFeatureCollection extends FeatureCollection<Point, GtfsRtVehicleFeatureProperties> {
  features: GtfsRtVehicleFeature[];
}

// =============================================================================
// Bikeshare Feature Collection
// =============================================================================

/** Properties for a bikeshare station feature */
export interface BikeshareStationFeatureProperties {
  station_id: string;
  name: string;
  capacity: number;
  num_bikes_available?: number;
  num_docks_available?: number;
  is_renting?: boolean;
  is_returning?: boolean;
}

/** A bikeshare station point feature */
export type BikeshareStationFeature = Feature<Point, BikeshareStationFeatureProperties>;

/** Feature collection of bikeshare stations */
export interface BikeshareStationFeatureCollection extends FeatureCollection<Point, BikeshareStationFeatureProperties> {
  features: BikeshareStationFeature[];
}

// =============================================================================
// Transit Center Boundary
// =============================================================================

/** A transit center boundary polygon feature */
export type TransitCenterBoundaryFeature = Feature<Polygon, { name: string }>;
