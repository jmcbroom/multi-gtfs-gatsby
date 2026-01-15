/**
 * Gatsby Page Context Types
 * Types for pageContext passed to template components
 */

import type { NearbyBikeshare } from './merged';
import type { BikeshareStation } from './BikeshareTypes';

// =============================================================================
// Agency Page Context
// =============================================================================

export type AgencyInitialTab = '' | 'routes' | 'map';

export interface AgencyPageContext {
  /** GTFS agency_id */
  id: string;
  /** GTFS feed index in PostgreSQL */
  feedIndex: number;
  /** Sanity agency slug */
  agencySlug: string;
  /** Initial tab to display */
  initialTab: AgencyInitialTab;
}

// =============================================================================
// Route Page Context
// =============================================================================

export type RouteInitialTab = '' | 'map' | 'schedule' | 'stops';

export interface RoutePageContext {
  /** GTFS route_short_name */
  routeNo: string;
  /** GTFS feed index in PostgreSQL */
  feedIndex: number;
  /** Sanity agency slug */
  agencySlug: string;
  /** Initial tab to display */
  initialTab: RouteInitialTab;
  /** Service IDs from Sanity agency */
  serviceIds: string[];
}

// =============================================================================
// Stop Page Context
// =============================================================================

export interface StopPageContext {
  /** GTFS feed index in PostgreSQL */
  feedIndex: number;
  /** Sanity feed index (usually same as feedIndex) */
  sanityFeedIndex: number;
  /** Sanity agency slug */
  agencySlug: string;
  /** GTFS stop_id */
  stopId: string;
  /** Nearby bikeshare station if within 500m */
  nearbyBikeshare?: NearbyBikeshare;
}

// =============================================================================
// Bikeshare Page Context
// =============================================================================

export type BikeshareInitialTab = 'home' | 'fares';

export interface BikesharePageContext {
  /** Sanity document ID */
  id: string;
  /** GBFS feed base URL */
  feedUrl: string;
  /** Sanity bikeshare slug */
  slug: string;
  /** Station information from GBFS */
  data: BikeshareStation[];
  /** Initial tab to display */
  initialTab: BikeshareInitialTab;
}

// =============================================================================
// Bikeshare Station Page Context
// =============================================================================

export interface BikeshareStationPageContext {
  /** GBFS feed base URL */
  feedUrl: string;
  /** Station data from GBFS */
  station: BikeshareStation;
  /** Sanity bikeshare slug */
  slug: string;
  /** Station latitude */
  lat: number;
  /** Station longitude */
  lon: number;
}

// =============================================================================
// Transit Center Page Context
// =============================================================================

export interface TransitCenterBikeshareFeed {
  feedUrl: string;
  slug: string;
  color?: string;
  stationIds: string[];
  labels: Record<string, string>;
}

export interface TransitCenterPageContext {
  /** Sanity transit center slug */
  slug: string;
  /** Feed indexes for agencies at this transit center */
  feedIndexes: number[];
  /** Stop identifiers (stopId or stopCode depending on agency) */
  stopIdentifiers: string[];
  /** Bikeshare feeds and their stations at this transit center */
  bikeshareFeeds: TransitCenterBikeshareFeed[];
}

// =============================================================================
// Generic Gatsby Page Props
// =============================================================================

/** Generic Gatsby page component props */
export interface GatsbyPageProps<TData = unknown, TContext = unknown> {
  data: TData;
  pageContext: TContext;
  location: Location;
  params?: Record<string, string>;
}

/** Shorthand page props for common templates */
export type AgencyPageProps<TData = unknown> = GatsbyPageProps<TData, AgencyPageContext>;
export type RoutePageProps<TData = unknown> = GatsbyPageProps<TData, RoutePageContext>;
export type StopPageProps<TData = unknown> = GatsbyPageProps<TData, StopPageContext>;
export type BikesharePageProps<TData = unknown> = GatsbyPageProps<TData, BikesharePageContext>;
export type BikeshareStationPageProps<TData = unknown> = GatsbyPageProps<TData, BikeshareStationPageContext>;
export type TransitCenterPageProps<TData = unknown> = GatsbyPageProps<TData, TransitCenterPageContext>;
