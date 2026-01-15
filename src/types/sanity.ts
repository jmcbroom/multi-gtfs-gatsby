/**
 * Sanity CMS Types
 * Types for content from Sanity CMS (via gatsby-source-sanity)
 */

// =============================================================================
// Common Sanity Types
// =============================================================================

/** Sanity document base fields */
export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt?: string;
  _updatedAt?: string;
  _rev?: string;
}

/** Sanity slug field */
export interface SanitySlug {
  current: string;
  _type?: 'slug';
}

/** Sanity color field (from @sanity/color-input) */
export interface SanityColor {
  hex: string;
  alpha?: number;
  hsl?: { h: number; s: number; l: number; a: number };
  hsv?: { h: number; s: number; v: number; a: number };
  rgb?: { r: number; g: number; b: number; a: number };
  _type?: 'color';
}

/** Sanity reference field */
export interface SanityReference<T = unknown> {
  _ref: string;
  _type: 'reference';
  /** Resolved reference (when expanded in query) */
  _resolved?: T;
}

/** Sanity block content (Portable Text) */
export interface PortableTextBlock {
  _type: 'block';
  _key: string;
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote';
  markDefs?: PortableTextMarkDef[];
  children?: PortableTextSpan[];
}

export interface PortableTextSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks?: string[];
}

export interface PortableTextMarkDef {
  _type: string;
  _key: string;
  href?: string;
}

// =============================================================================
// Agency
// =============================================================================

export type AgencyType = 'local-bus' | 'rail' | 'express-bus' | 'streetcar' | 'monorail';
export type StopIdentifierField = 'stopId' | 'stopCode';
export type FareCurrency = 'USD' | 'CAD';

/** Sanity Agency document */
export interface SanityAgency extends SanityDocument {
  _type: 'agency';
  name: string;
  fullName?: string;
  slug: SanitySlug;
  agencyId?: string;
  onestopId?: string;
  color?: SanityColor;
  textColor?: SanityColor;
  description?: PortableTextBlock[];
  content?: PortableTextBlock[];
  fareAttributes?: SanityFareAttribute[];
  fareContent?: PortableTextBlock[];
  fareCurrency?: FareCurrency;
  agencyType?: AgencyType;
  realTimeEnabled: boolean;
  /** Field used to identify stops in URLs */
  stopIdentifierField: StopIdentifierField;
  /** Field used to identify stops when calling real-time API */
  apiStopIdentifierField?: StopIdentifierField;
  serviceIds?: string[];
  /** Links Sanity to PostgreSQL GTFS feed */
  currentFeedIndex: number;
  /** OTP Feed ID prefix (e.g., 'ddot', 'smart') */
  otpFeedId?: string;
  /** URL for GTFS-RT vehicle positions feed */
  gtfsRtVehiclePositions?: string;
}

// =============================================================================
// Route
// =============================================================================

/** Sanity Route document */
export interface SanityRoute extends SanityDocument {
  _type: 'route';
  shortName: string;
  displayShortName?: string;
  longName?: string;
  slug: SanitySlug;
  routeType?: string;
  color?: SanityColor;
  textColor?: SanityColor;
  agency: SanityReference<SanityAgency>;
  content?: PortableTextBlock[];
  /** Extended route directions with shapes */
  extRouteDirections?: ExtRouteDirection[];
  /** Alias for extRouteDirections in some queries */
  directions?: ExtRouteDirection[];
  /** Map rendering priority (1 = most prominent, 5 = least) */
  mapPriority?: number;
}

/** Direction info with GeoJSON shape */
export interface ExtRouteDirection {
  _key?: string;
  _type?: 'extRouteDirection';
  /** GTFS direction_id (0 or 1) */
  directionId: number;
  /** Custom headsign for this direction */
  directionHeadsign?: string;
  /** Cardinal direction description */
  directionDescription?: DirectionDescription;
  /** Array of stop IDs that are timepoints */
  directionTimepoints?: string[];
  /** GeoJSON Feature as JSON string */
  directionShape?: string;
  /** GTFS shape_id */
  shapeId?: string;
}

export type DirectionDescription =
  | 'northbound'
  | 'southbound'
  | 'eastbound'
  | 'westbound'
  | 'clockwise'
  | 'counterclockwise'
  | 'inbound'
  | 'outbound'
  | 'uptown'
  | 'downtown';

// =============================================================================
// Fares
// =============================================================================

/** Fare attribute (shared by agency and bikeshare) */
export interface SanityFareAttribute {
  _key?: string;
  _type?: 'fareAttribute';
  price: number;
  currencyType?: string;
  /** Number of transfers allowed (undefined = unlimited) */
  transfers?: number;
  /** Transfer validity duration in seconds (0 = unlimited) */
  transferDuration?: number;
}

// =============================================================================
// Bikeshare
// =============================================================================

/** Sanity Bikeshare document */
export interface SanityBikeshare extends SanityDocument {
  _type: 'bikeshare';
  name: string;
  fullName?: string;
  slug: SanitySlug;
  /** GBFS feed base URL */
  feedUrl: string;
  color?: SanityColor;
  textColor?: SanityColor;
  description?: PortableTextBlock[];
  content?: PortableTextBlock[];
  fareAttributes?: SanityFareAttribute[];
  fareContent?: PortableTextBlock[];
  fareCurrency?: FareCurrency;
}

// =============================================================================
// Transit Center
// =============================================================================

/** Sanity Transit Center document */
export interface SanityTransitCenter extends SanityDocument {
  _type: 'transitCenter';
  name: string;
  slug: SanitySlug;
  description?: PortableTextBlock[];
  /** GeoJSON polygon boundary as JSON string */
  boundary?: string;
  stops?: TransitCenterStop[];
  bikeshareStations?: TransitCenterBikeshare[];
  content?: PortableTextBlock[];
}

/** A bus stop at a transit center */
export interface TransitCenterStop {
  _key?: string;
  _type?: 'transitCenterStop';
  agency: SanityReference<SanityAgency>;
  /** Stop ID or code (depends on agency's stopIdentifierField) */
  stopId: string;
  /** Custom display label (e.g., 'Bay A') */
  label?: string;
}

/** A bikeshare station at a transit center */
export interface TransitCenterBikeshare {
  _key?: string;
  _type?: 'transitCenterBikeshare';
  bikeshare: SanityReference<SanityBikeshare>;
  /** GBFS station_id */
  stationId: string;
  /** Custom display label */
  label?: string;
}

// =============================================================================
// Re-export common types used across the codebase
// =============================================================================

// These are simpler aliases matching the existing AgencyType.ts pattern
export { SanitySlug as AgencySlug };
export { SanityColor as Color };

/** Simple agency type for component props (matches existing AgencyType.ts) */
export interface AgencyTypeSimple {
  slug: SanitySlug;
  name: string;
  color: SanityColor;
  textColor: SanityColor;
}
