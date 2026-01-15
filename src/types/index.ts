/**
 * Type Definitions Barrel Export
 *
 * Import types from this file for clean imports:
 *   import type { AgencyData, RouteData, Prediction } from '../types';
 *
 * Or use in JSDoc for JavaScript files:
 *   /** @typedef {import('../types').AgencyData} AgencyData *\/
 */

// API Types (Netlify Functions)
export type {
  BustimeAgency,
  TransitWindsorAgency,
  RealTimeAgency,
  BustimeResponse,
  BustimePredictionsData,
  BustimeVehiclesData,
  BustimePatternsData,
  BustimeError,
  BustimePrediction,
  BustimeVehicle,
  BustimePattern,
  BustimePatternPoint,
  TransitWindsorPrediction,
  GtfsRtVehiclesResponse,
  GtfsRtVehicle,
  VehicleStopStatus,
  CongestionLevel,
  OccupancyStatus,
  PredictionsQueryParams,
  StopPredictionsQueryParams,
  VehicleQueryParams,
  PatternsQueryParams,
  GtfsRtQueryParams,
} from './api';

// GTFS Types
export type {
  TimeObject,
  GtfsAgency,
  GtfsRoute,
  GtfsStop,
  GtfsTrip,
  GtfsStopTime,
  GtfsCalendar,
  GtfsFareAttribute,
  GtfsShape,
  GtfsFeedInfo,
  TripWithStopTimes,
  StopTimeWithStop,
  RouteWithTrips,
  AgencyWithRoutes,
  GtfsFeedInfoWithCalendars,
  ServiceDays,
  ServiceDayKey,
  HeadsignsByDirectionId,
  TripsByServiceAndDirection,
  SortedTripsResult,
  FormattedFareAttribute,
} from './gtfs';

// Sanity Types
export type {
  SanityDocument,
  SanitySlug,
  SanityColor,
  SanityReference,
  PortableTextBlock,
  PortableTextSpan,
  PortableTextMarkDef,
  AgencyType,
  StopIdentifierField,
  FareCurrency,
  SanityAgency,
  SanityRoute,
  ExtRouteDirection,
  DirectionDescription,
  SanityFareAttribute,
  SanityBikeshare,
  SanityTransitCenter,
  TransitCenterStop,
  TransitCenterBikeshare,
  AgencySlug,
  Color,
  AgencyTypeSimple,
} from './sanity';

// Merged Types (GTFS + Sanity)
export type {
  AgencyData,
  RouteData,
  RoutePageData,
  FavoriteStop,
  FavoriteStopTripDirection,
  FavoriteStopRoute,
  FavoriteStopAgency,
  FavoriteBikeshare,
  FavoriteRoute,
  StopWithAgency,
  NearbyBikeshare,
} from './merged';

// GeoJSON Types
export type {
  RouteFeatureProperties,
  RouteFeature,
  RouteFeatureCollection,
  StopFeatureProperties,
  StopFeature,
  StopsFeatureCollection,
  VehicleFeatureProperties,
  VehicleFeature,
  VehicleFeatureCollection,
  GtfsRtVehicleFeatureProperties,
  GtfsRtVehicleFeature,
  GtfsRtVehicleFeatureCollection,
  BikeshareStationFeatureProperties,
  BikeshareStationFeature,
  BikeshareStationFeatureCollection,
  TransitCenterBoundaryFeature,
} from './geojson';

// Page Context Types
export type {
  AgencyInitialTab,
  AgencyPageContext,
  RouteInitialTab,
  RoutePageContext,
  StopPageContext,
  BikeshareInitialTab,
  BikesharePageContext,
  BikeshareStationPageContext,
  TransitCenterBikeshareFeed,
  TransitCenterPageContext,
  GatsbyPageProps,
  AgencyPageProps,
  RoutePageProps,
  StopPageProps,
  BikesharePageProps,
  BikeshareStationPageProps,
  TransitCenterPageProps,
} from './context';

// Re-export existing types for backwards compatibility
export type {
  BikeshareStation,
  BikeshareStationStatus,
  VehicleDockAvailable,
  VehicleTypeAvailable,
} from './BikeshareTypes';
