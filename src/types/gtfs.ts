/**
 * GTFS Data Types
 * Types for transit data from PostgreSQL (via gatsby-source-pg)
 */

// =============================================================================
// Time Types
// =============================================================================

/**
 * GTFS arrival/departure time.
 * Hours can exceed 24 for overnight service (e.g., 25:30 = 1:30am next day)
 */
export interface TimeObject {
  hours: number;
  minutes: number;
  seconds?: number;
}

// =============================================================================
// Core GTFS Entities
// =============================================================================

/** GTFS Agency from agencies table */
export interface GtfsAgency {
  agencyId: string;
  agencyName: string;
  agencyUrl?: string;
  agencyTimezone?: string;
  agencyLang?: string;
  agencyPhone?: string;
  agencyFareUrl?: string;
  agencyEmail?: string;
  bikesPolicyUrl?: string;
  feedIndex: number;
}

/** GTFS Route from routes table */
export interface GtfsRoute {
  agencyId?: string;
  routeShortName: string;
  routeLongName: string;
  routeDesc?: string;
  /** Route type: 0=tram, 1=subway, 2=rail, 3=bus, etc. */
  routeType: number | string;
  routeUrl?: string;
  /** Hex color without # */
  routeColor?: string;
  /** Hex color without # */
  routeTextColor?: string;
  routeSortOrder?: number;
  implicitSort?: number;
  feedIndex: number;
}

/** GTFS Stop from stops table */
export interface GtfsStop {
  stopId: string;
  stopCode?: string;
  stopName: string;
  stopDesc?: string;
  stopLat: number;
  stopLon: number;
  zoneId?: string;
  stopUrl?: string;
  locationType?: number;
  parentStation?: string;
  stopTimezone?: string;
  wheelchairBoarding?: number;
  feedIndex: number;
}

/** GTFS Trip from trips table */
export interface GtfsTrip {
  tripId: string;
  routeId?: string;
  serviceId: string;
  tripHeadsign?: string;
  tripShortName?: string;
  directionId: number;
  blockId?: string;
  shapeId?: string;
  wheelchairAccessible?: number;
  bikesAllowed?: number;
  feedIndex?: number;
}

/** GTFS StopTime from stop_times table */
export interface GtfsStopTime {
  tripId?: string;
  arrivalTime: TimeObject;
  departureTime?: TimeObject;
  stopId: string;
  stopSequence: number;
  stopHeadsign?: string;
  pickupType?: number;
  dropOffType?: number;
  shapeDistTraveled?: number;
  timepoint?: 0 | 1;
}

/** GTFS Calendar from calendar table */
export interface GtfsCalendar {
  serviceId: string;
  monday: 0 | 1;
  tuesday: 0 | 1;
  wednesday: 0 | 1;
  thursday: 0 | 1;
  friday: 0 | 1;
  saturday: 0 | 1;
  sunday: 0 | 1;
  startDate?: string;
  endDate?: string;
  feedIndex?: number;
}

/** GTFS FareAttribute from fare_attributes table */
export interface GtfsFareAttribute {
  fareId?: string;
  price: number;
  currencyType: string;
  paymentMethod?: number;
  transfers?: number;
  transferDuration?: number;
}

/** GTFS Shape from shapes table */
export interface GtfsShape {
  shapeId: string;
  shapePtLat: number;
  shapePtLon: number;
  shapePtSequence: number;
  shapeDistTraveled?: number;
}

/** GTFS FeedInfo from feed_info table */
export interface GtfsFeedInfo {
  feedPublisherName?: string;
  feedPublisherUrl?: string;
  feedLang?: string;
  feedStartDate?: string;
  feedEndDate?: string;
  feedVersion?: string;
  feedIndex?: number;
}

// =============================================================================
// Extended Types (with relationships)
// =============================================================================

/** Trip with nested stopTimes */
export interface TripWithStopTimes extends GtfsTrip {
  stopTimes: StopTimeWithStop[];
}

/** StopTime with nested stop */
export interface StopTimeWithStop extends GtfsStopTime {
  stop: GtfsStop;
}

/** Route with nested trips */
export interface RouteWithTrips extends GtfsRoute {
  trips?: TripWithStopTimes[];
  longTrips?: TripWithStopTimes[];
}

/** Agency with nested routes and feed info */
export interface AgencyWithRoutes extends GtfsAgency {
  routes?: RouteWithTrips[];
  feedInfo?: GtfsFeedInfoWithCalendars;
  fareAttributes?: GtfsFareAttribute[];
}

/** Feed info with calendars */
export interface GtfsFeedInfoWithCalendars extends GtfsFeedInfo {
  calendarsByFeedIndexList?: GtfsCalendar[];
}

// =============================================================================
// Derived Types
// =============================================================================

/** Service days mapping from getServiceDays() */
export interface ServiceDays {
  weekday: string | null;
  saturday: string | null;
  sunday: null;
}

/** Service day keys */
export type ServiceDayKey = 'weekday' | 'saturday' | 'sunday';

/** Headsigns grouped by direction ID from getHeadsignsByDirectionId() */
export interface HeadsignsByDirectionId {
  [directionId: string]: {
    headsigns: string[];
    description?: string;
  };
}

/** Trips grouped by service day and direction from getTripsByServiceAndDirection() */
export interface TripsByServiceAndDirection {
  weekday: {
    [directionId: string]: TripWithStopTimes[];
  };
  saturday: {
    [directionId: string]: TripWithStopTimes[];
  };
  sunday: {
    [directionId: string]: TripWithStopTimes[];
  };
}

/** Result from sortTripsByFrequentTimepoint() */
export interface SortedTripsResult {
  trips: TripWithStopTimes[];
  timepoints: StopTimeWithStop[];
}

/** Fare attribute with formatted display values */
export interface FormattedFareAttribute extends GtfsFareAttribute {
  formattedPrice?: string;
  formattedTransfers?: string;
}
