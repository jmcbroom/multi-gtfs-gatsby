import React from "react";
import { Link } from "gatsby";
import { getStopIdentifier } from "../stopUtils";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import RouteSlim from "./RouteSlim";
import StopBadge from "./StopBadge";
import FavoriteButton from "./FavoriteButton";

/**
 * StopCard - A reusable card component for displaying transit stops
 *
 * Used in:
 * - favorites.js: Shows saved stops
 * - NearbyStopsList.js: Shows nearby stops with favorite toggle and selection
 *
 * @param {Object} stop - Stop data (stopName, stopId, routes, etc.)
 * @param {Object} agency - Agency data
 * @param {Array} routeDirections - Route directions to display (favorites mode)
 * @param {Array} routes - Pre-enriched routes to display (nearby mode)
 * @param {Boolean} isFavorited - Whether stop is favorited (nearby mode)
 * @param {Function} onToggleFavorite - Toggle favorite handler (nearby mode)
 * @param {Boolean} isSelected - Whether stop is selected (nearby mode)
 * @param {Function} onClick - Click handler (nearby mode)
 * @param {String} walkTime - Walk time string (nearby mode)
 * @param {String} agencyColor - Agency color for left border
 * @param {Number} maxRoutes - Maximum routes to display (default: 4)
 * @param {String} variant - "default" (old style) or "card" (new rounded style)
 */
const StopCard = ({
  stop,
  agency,
  routeDirections,
  routes: propRoutes,
  isFavorited,
  onToggleFavorite,
  isSelected,
  onClick,
  walkTime,
  agencyColor,
  maxRoutes = 4,
  variant = "default",
}) => {
  const stopIdentifier = getStopIdentifier(stop, agency);
  const agencySlug = stop.agency?.agencySlug || agency?.slug?.current;
  const feedIndex = stop.agency?.feedIndex || agency?.currentFeedIndex;

  // Get Sanity routes for enrichment
  const { sanityRoutes } = useSanityRoutes();
  const allSanityRoutes = sanityRoutes?.edges?.map((e) => e.node) || [];

  // Normalize stop name - handles both structures (stop-page vs NearbyStopsList)
  const normalizedStopName = stop.stopName || stop.name;

  // Determine which routes to display
  // In nearby mode: use propRoutes directly (already enriched with Sanity data)
  // In favorites mode: derive from routeDirections, enriched with Sanity data
  const displayRoutes = propRoutes || (routeDirections
    ? routeDirections
        .sort((a, b) => (b.tripCount || 0) - (a.tripCount || 0))
        .slice(0, maxRoutes)
        .map((rd) => {
          const shortName = rd.routeId;

          // Find matching Sanity route for colors and direction info
          const sanityRoute = allSanityRoutes.find(
            (sr) =>
              (sr.agency?.slug?.current === agencySlug ||
               sr.agency?.currentFeedIndex === feedIndex) &&
              sr.shortName === shortName
          );

          // Find matching direction from Sanity
          const sanityDirection = sanityRoute?.directions?.find(
            (d) => d.directionId === rd.directionId
          );

          // Build direction object from best available source
          const direction = sanityDirection
            ? {
                directionId: sanityDirection.directionId,
                directionHeadsign: sanityDirection.directionHeadsign,
                directionDescription: sanityDirection.directionDescription,
              }
            : rd.directionHeadsign
            ? {
                directionId: rd.directionId,
                directionHeadsign: rd.directionHeadsign,
              }
            : null;

          return {
            key: `${shortName}-${rd.directionId}`,
            routeShortName: shortName,
            displayShortName: shortName,
            routeLongName: sanityRoute?.longName || rd.routeLongName || "",
            routeColor: sanityRoute?.color?.hex || rd.routeColor || "#666",
            routeTextColor: sanityRoute?.textColor?.hex || rd.routeTextColor || "#fff",
            direction,
          };
        })
    : []);

  // Interactive mode (nearby stops) vs static mode (favorites)
  const isInteractive = Boolean(onClick);
  const showFavoriteButton = typeof isFavorited === "boolean" && onToggleFavorite;
  const useCardStyle = variant === "card" || isInteractive;

  const cardClasses = `
    block rounded-lg transition-all overflow-hidden
    ${isInteractive ? "cursor-pointer" : ""}
    ${isSelected
      ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
      : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:shadow-sm"
    }
    ${agencyColor ? "border-l-4" : ""}
  `;

  const cardStyle = agencyColor ? { borderLeftColor: agencyColor } : {};

  const handleCardClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(stop);
    }
  };

  // For favorites mode with default variant, keep original styling
  const favoritesClasses = "bg-gray-100 dark:bg-zinc-900 border-b border-dotted border-gray-400 dark:border-zinc-700 last:border-none";

  if (!useCardStyle) {
    // Favorites mode with default variant - original layout
    return (
      <div className={favoritesClasses}>
        <div className="flex items-center justify-between px-2 py-1">
          <Link
            to={`/${agencySlug}/stop/${stopIdentifier}`}
            className="flex items-center gap-2"
          >
            <span className="plex font-semibold">{normalizedStopName}</span>
          </Link>
          <StopBadge stopId={stopIdentifier} size="xs" />
        </div>
        <div className="bg-gray-100 dark:bg-zinc-900 p-2 grid cols-1 md:grid-cols-2 gap-2">
          {displayRoutes.map((route) => (
            <RouteSlim
              key={route.key}
              routeShortName={route.routeShortName}
              displayShortName={route.displayShortName}
              routeLongName={route.routeLongName}
              routeColor={route.routeColor}
              routeTextColor={route.routeTextColor}
              direction={route.direction}
              size="small"
            />
          ))}
        </div>
      </div>
    );
  }

  // Card style mode (interactive or variant="card")
  return (
    <div className={cardClasses} style={cardStyle} onClick={isInteractive ? handleCardClick : undefined}>
      {/* Header row: star + name + stop badge */}
      <div className="flex items-start justify-between gap-2 p-3 pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showFavoriteButton && (
            <FavoriteButton
              isFavorited={isFavorited}
              onClick={() => onToggleFavorite(stop)}
            />
          )}
          <Link
            to={`/${agencySlug}/stop/${stopIdentifier}`}
            onClick={(e) => isInteractive && e.stopPropagation()}
            className={`font-medium truncate hover:underline ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-zinc-200"}`}
          >
            {normalizedStopName}
          </Link>
        </div>
        <StopBadge stopId={stop.code || stop.stopId || stopIdentifier} size="xs" />
      </div>

      {/* Routes section */}
      {displayRoutes.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {displayRoutes.slice(0, maxRoutes).map((route, idx) => (
              <RouteSlim
                key={route.key || route.routeDirectionKey || `${route.routeShortName}-${idx}`}
                routeShortName={route.routeShortName || route.shortName}
                displayShortName={route.displayShortName || route.shortName}
                routeLongName={route.routeLongName || route.longName}
                routeColor={route.routeColor || (route.color ? `#${route.color}` : "#666")}
                routeTextColor={route.routeTextColor || (route.textColor ? `#${route.textColor}` : "#fff")}
                direction={route.direction}
                size="xs"
              />
            ))}
            {displayRoutes.length > maxRoutes && (
              <span className="text-xs text-gray-400 dark:text-zinc-500 self-center">
                +{displayRoutes.length - maxRoutes} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Walk time */}
      {walkTime && (
        <div className="px-3 pb-2">
          <span className="text-[11px] text-gray-400 dark:text-zinc-500">
            {walkTime}
          </span>
        </div>
      )}
    </div>
  );
};

export default StopCard;
