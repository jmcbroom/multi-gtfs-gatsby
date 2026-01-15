/**
 * Merged Data Types
 * Types for combined GTFS + Sanity data created by util.js functions
 */

import type {
  GtfsAgency,
  GtfsRoute,
  TripWithStopTimes,
  GtfsFareAttribute,
  ServiceDays,
  HeadsignsByDirectionId,
  TripsByServiceAndDirection,
  GtfsFeedInfoWithCalendars,
} from './gtfs';

import type {
  SanitySlug,
  SanityColor,
  PortableTextBlock,
  SanityFareAttribute,
  ExtRouteDirection,
  StopIdentifierField,
} from './sanity';

// =============================================================================
// Agency Data (GTFS + Sanity merged)
// =============================================================================

/**
 * Agency data from createAgencyData()
 * Combines GTFS agency with Sanity agency content
 */
export interface AgencyData extends GtfsAgency {
  // From Sanity
  slug: SanitySlug;
  name: string;
  content?: PortableTextBlock[];
  description?: PortableTextBlock[];
  color?: SanityColor;
  textColor?: SanityColor;
  fareAttributes?: SanityFareAttribute[] | GtfsFareAttribute[];
  fareContent?: PortableTextBlock[];
  realTimeEnabled?: boolean;
  stopIdentifierField?: StopIdentifierField;
  gtfsRtVehiclePositions?: string;

  // From GTFS with relationships
  routes?: RouteData[];
  feedInfo?: GtfsFeedInfoWithCalendars;
}

// =============================================================================
// Route Data (GTFS + Sanity merged)
// =============================================================================

/**
 * Route data from createRouteData()
 * Combines GTFS route with Sanity route content
 */
export interface RouteData extends GtfsRoute {
  // From Sanity (overrides GTFS values)
  routeLongName: string;
  /** Hex color with # prefix */
  routeColor?: string;
  /** Hex color with # prefix */
  routeTextColor?: string;
  /** Map rendering priority (1-5) */
  mapPriority?: number;
  /** Direction shapes and metadata from Sanity */
  directions?: ExtRouteDirection[];
  /** Display short name (falls back to routeShortName) */
  displayShortName: string;

  // From GTFS with relationships
  trips?: TripWithStopTimes[];
  longTrips?: TripWithStopTimes[];
}

// =============================================================================
// Route Page Derived Data
// =============================================================================

/** Props commonly passed to route components */
export interface RoutePageData {
  agencyData: AgencyData;
  routeData: RouteData;
  serviceDays: ServiceDays;
  headsignsByDirectionId: HeadsignsByDirectionId;
  tripsByServiceAndDirection: TripsByServiceAndDirection;
}

// =============================================================================
// Favorite Types (stored in IndexedDB via src/db.js)
// =============================================================================

/** Trip direction for a stop (which routes/directions serve this stop) */
export interface FavoriteStopTripDirection {
  /** Route short name (e.g., "38") */
  routeId: string;
  /** GTFS direction_id (0 or 1) */
  directionId: number;
  /** Number of trips in this direction (from stop-page GraphQL) */
  tripCount?: number;
}

/** Route stored with favorite stop (for departure-board map shapes) */
export interface FavoriteStopRoute {
  routeShortName: string;
  displayShortName: string;
  routeLongName?: string;
  routeColor?: string;
  routeTextColor?: string;
  /** Sanity directions with shapes (ExtRouteDirection[]) */
  directions?: ExtRouteDirection[];
}

/** Agency info for favorite stop */
export interface FavoriteStopAgency {
  agencySlug: string;
  name: string;
  feedIndex?: number;
}

/** Favorite stop stored in IndexedDB */
export interface FavoriteStop {
  /** Auto-generated IndexedDB id */
  id?: number;
  /** GTFS stop_id */
  stopId: string;
  /** GTFS stop_code (for display in URLs) */
  stopCode?: string;
  /** Stop name */
  stopName: string;
  /** Latitude */
  stopLat: number;
  /** Longitude */
  stopLon: number;
  /** Routes/directions serving this stop (for StopCard display) */
  tripDirections: FavoriteStopTripDirection[];
  /** Routes with Sanity directions (for FavoritesDashboard map shapes) */
  routes?: FavoriteStopRoute[];
  /** Agency info */
  agency: FavoriteStopAgency;
}

/** Favorite bikeshare station stored in IndexedDB */
export interface FavoriteBikeshare {
  id?: number;
  agency: string;
  stop_id: string;
}

/** Favorite route stored in IndexedDB */
export interface FavoriteRoute {
  id?: number;
  agency: string;
  route_id: string;
  routeShortName: string;
  displayShortName: string;
  routeLongName: string;
  routeColor: string;
  routeTextColor: string;
  feedIndex: number;
  agencyInfo: {
    agencySlug: string;
    agencyName: string;
    feedIndex: number;
  };
}

// =============================================================================
// Stop with agency context
// =============================================================================

/** Stop data with agency context for display */
export interface StopWithAgency {
  stopId: string;
  stopCode?: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
  feedIndex: number;
  agencySlug: string;
  agencyName?: string;
  stopIdentifierField?: StopIdentifierField;
}

/** Nearby bikeshare station (attached to stop pages) */
export interface NearbyBikeshare {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  bikeshareSlug: string;
  feedUrl: string;
}
