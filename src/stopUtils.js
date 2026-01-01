/**
 * Utilities for handling stop identifiers across different agencies.
 *
 * Each agency can use either `stopId` or `stopCode` as their primary identifier,
 * configured via `stopIdentifierField` in Sanity.
 */

/**
 * Get the stop identifier value based on agency preference.
 * This is used for user-facing contexts like URLs and display.
 *
 * Handles various stop object structures:
 * - GTFS standard: { stopId, stopCode }
 * - OTP/nearby: { stopId, code }
 *
 * @param {Object} stop - Stop object with stopId and/or stopCode/code properties
 * @param {Object} agency - Agency object with stopIdentifierField
 * @returns {string|null} The appropriate stop identifier
 *
 * @example
 * // For an agency using stopCode:
 * getStopIdentifier({ stopId: "123", stopCode: "A456" }, { stopIdentifierField: "stopCode" })
 * // Returns: "A456"
 */
export function getStopIdentifier(stop, agency) {
  if (!stop) return null;

  const field = agency?.stopIdentifierField;

  // Handle both naming conventions: stopCode (GTFS) and code (OTP)
  if (field === "stopCode") {
    return stop.stopCode || stop.code || null;
  }

  // Default to stopId
  return stop.stopId || null;
}

/**
 * Get the stop identifier for API calls (BusTime API).
 * Some agencies use different identifiers for API vs public URLs.
 * Configured via `apiStopIdentifierField` in Sanity (falls back to `stopIdentifierField`).
 *
 * @param {Object} stop - Stop object with stopId and/or stopCode properties
 * @param {Object} agency - Agency object with apiStopIdentifierField and stopIdentifierField
 * @returns {string|null} The stop identifier for API calls
 */
export function getApiStopIdentifier(stop, agency) {
  if (!stop) return null;

  // Use apiStopIdentifierField if set, otherwise fall back to stopIdentifierField
  const field = agency?.apiStopIdentifierField || agency?.stopIdentifierField;

  if (field === "stopCode") {
    return stop.stopCode || stop.code || null;
  }

  // Default to stopId
  return stop.stopId || null;
}

/**
 * Build a stop page URL for a given stop and agency.
 *
 * @param {Object} stop - Stop object
 * @param {Object} agency - Agency object with slug and stopIdentifierField
 * @param {Object} options - Optional settings
 * @param {boolean} options.absolute - If true, returns absolute URL with domain
 * @returns {string|null} The stop page URL
 *
 * @example
 * getStopPageUrl({ stopCode: "1234" }, { slug: { current: "ddot" }, stopIdentifierField: "stopCode" })
 * // Returns: "/ddot/stop/1234"
 */
export function getStopPageUrl(stop, agency, options = {}) {
  const identifier = getStopIdentifier(stop, agency);
  if (!identifier) return null;

  const slug = agency?.slug?.current;
  if (!slug) return null;

  const path = `/${slug}/stop/${identifier}`;

  if (options.absolute) {
    return `https://transit.det.city${path}`;
  }

  return path;
}

/**
 * Build a stop page URL from OTP stop data (used in trip planner).
 * OTP stops have gtfsId format "feedIndex:stopId" and optional code property.
 *
 * @param {Object} otpStop - OTP stop object with gtfsId and optional code
 * @param {Object} route - Route object with agencySlug and stopIdentifierField
 * @returns {string|null} Absolute URL to the stop page
 */
export function getStopUrlFromOtp(otpStop, route) {
  if (!otpStop?.gtfsId) return null;

  const agencySlug = route?.agencySlug;
  if (!agencySlug) return null;

  const stopIdentifierField = route?.stopIdentifierField || "stopId";
  const stopIdFromGtfs = otpStop.gtfsId.split(':')[1];
  if (!stopIdFromGtfs) return null;

  // Use stopCode if agency prefers it and it's available, otherwise use stopId
  const identifier = stopIdentifierField === "stopCode" && otpStop.code
    ? otpStop.code
    : stopIdFromGtfs;

  return `https://transit.det.city/${agencySlug}/stop/${identifier}`;
}

// Route URL overrides for special cases
const ROUTE_URL_OVERRIDES = {
  'd2a2/d2a2': '/d2a2',
};

/**
 * Build a route page URL.
 *
 * @param {Object} route - Route object with shortName
 * @param {Object} agency - Agency object with slug
 * @param {Object} options - Optional settings
 * @param {boolean} options.absolute - If true, returns absolute URL with domain
 * @returns {string|null} The route page URL
 */
export function getRoutePageUrl(route, agency, options = {}) {
  const shortName = route?.shortName || route?.routeShortName;
  if (!shortName) return null;

  const slug = agency?.slug?.current || agency?.agencySlug || route?.agencySlug;
  if (!slug) return null;

  // Check for overrides
  const key = `${slug}/${shortName}`.toLowerCase();
  if (ROUTE_URL_OVERRIDES[key]) {
    const path = ROUTE_URL_OVERRIDES[key];
    return options.absolute ? `https://transit.det.city${path}` : path;
  }

  const path = `/${slug}/route/${shortName}`;

  if (options.absolute) {
    return `https://transit.det.city${path}`;
  }

  return path;
}

/**
 * Build a route page URL from OTP route data (used in trip planner).
 *
 * @param {Object} otpRoute - OTP route object with shortName and agencySlug
 * @returns {string|null} Absolute URL to the route page
 */
export function getRouteUrlFromOtp(otpRoute) {
  if (!otpRoute?.shortName || !otpRoute?.agencySlug) return null;

  const key = `${otpRoute.agencySlug}/${otpRoute.shortName}`.toLowerCase();
  if (ROUTE_URL_OVERRIDES[key]) {
    return `https://transit.det.city${ROUTE_URL_OVERRIDES[key]}`;
  }

  return `https://transit.det.city/${otpRoute.agencySlug}/route/${otpRoute.shortName}`;
}
