import React from "react";
import { Link } from "gatsby";
import RouteSlim from "./RouteSlim";
import StopBadge from "./StopBadge";
import { getStopIdentifier } from "../stopUtils";
import { shortenHeadsign, shortenStopName } from "../util";

const StopTransfers = ({ stop, nearbyStops, routes, agencies }) => {
  // Get trip directions already served at this stop
  const currentTripDirections = new Set(
    stop.tripDirections?.map((td) => `${td.routeId}-${td.directionId}`) || []
  );

  // Build a map of route -> directions -> stops
  const routeMap = new Map();

  for (const nearbyStop of nearbyStops) {
    const agency = agencies.find(
      (a) => a.currentFeedIndex === nearbyStop.feedIndex
    );
    if (!agency) continue;

    for (const td of nearbyStop.tripDirections) {
      const key = `${td.routeId}-${td.directionId}`;

      // Skip if this direction is already at the current stop
      if (currentTripDirections.has(key)) continue;

      // Find the matching route from Sanity
      const matchingRoute = routes.find(
        (rt) =>
          rt.shortName === td.routeId &&
          rt.agency.currentFeedIndex === nearbyStop.feedIndex
      );
      if (!matchingRoute) continue;

      // Find direction info
      const directionInfo = matchingRoute.directions?.find(
        (d) => d.directionId === td.directionId
      );

      const routeKey = `${nearbyStop.feedIndex}-${td.routeId}`;

      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          route: {
            displayShortName:
              matchingRoute.displayShortName || matchingRoute.shortName,
            routeShortName: matchingRoute.shortName,
            routeLongName: matchingRoute.longName,
            routeColor: matchingRoute.color?.hex || "#666",
            routeTextColor: matchingRoute.textColor?.hex || "#fff",
          },
          mapPriority: matchingRoute.mapPriority ?? 999,
          agency,
          directions: new Map(),
        });
      }

      const routeEntry = routeMap.get(routeKey);
      const dirKey = `${td.directionId}`;

      // Only add if we haven't seen this direction yet (first stop wins)
      if (!routeEntry.directions.has(dirKey)) {
        routeEntry.directions.set(dirKey, {
          directionId: td.directionId,
          directionDescription: directionInfo?.directionDescription,
          directionHeadsign: directionInfo?.directionHeadsign,
          tripCount: td.tripCount,
          stop: {
            stopId: nearbyStop.stopId,
            stopCode: nearbyStop.stopCode,
            stopName: nearbyStop.stopName,
            agencySlug: agency.slug?.current,
          },
        });
      }
    }
  }

  // Convert to array and sort by mapPriority, then route name
  const routeEntries = Array.from(routeMap.values()).sort((a, b) => {
    // Sort by mapPriority first (lower = higher priority)
    if (a.mapPriority !== b.mapPriority) {
      return a.mapPriority - b.mapPriority;
    }
    // Fall back to route short name
    const aNum = parseInt(a.route.routeShortName) || 999;
    const bNum = parseInt(b.route.routeShortName) || 999;
    return aNum - bNum;
  });

  if (routeEntries.length === 0) {
    return null;
  }

  return (
    <div>
      <h4>Transfer to other routes nearby</h4>
      <div className="max-h-96 overflow-auto">
        {routeEntries.map((entry) => {
          const directions = Array.from(entry.directions.values()).sort(
            (a, b) => (b.tripCount || 0) - (a.tripCount || 0)
          );

          // Check if all directions use the same stop
          const stopIds = new Set(
            directions.map((d) => getStopIdentifier(d.stop, entry.agency))
          );
          const sameStop = stopIds.size === 1 && directions.length > 1;

          // Special case: DDOT stop 8946 should trigger grouping, but use the other stop
          const hasSpecialStop = directions.some(
            (d) =>
              entry.agency.slug?.current === "ddot" &&
              getStopIdentifier(d.stop, entry.agency) === "8946"
          );
          const shouldGroup = sameStop || hasSpecialStop;

          if (shouldGroup) {
            // Show RouteSlim and stop on same line
            // If special case, use the non-8946 stop; otherwise use first
            const dir = hasSpecialStop
              ? directions.find(
                  (d) => getStopIdentifier(d.stop, entry.agency) !== "8946"
                ) || directions[0]
              : directions[0];
            const stopIdentifier = getStopIdentifier(dir.stop, entry.agency);
            return (
              <div
                key={`${entry.agency.currentFeedIndex}-${entry.route.routeShortName}`}
                className="bg-gray-100 dark:bg-zinc-900 border-b border-gray-400 dark:border-zinc-700 last:border-b-0 p-2 border-l-4"
                style={{ borderLeftColor: entry.agency.color?.hex || "#666" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <RouteSlim
                      {...entry.route}
                      size="xs"
                      link={`/${entry.agency.slug?.current}/route/${entry.route.displayShortName}`}
                    />
                  </div>
                  <Link
                    to={`/${dir.stop.agencySlug}/stop/${stopIdentifier}`}
                    className="inline-flex items-stretch hover:text-blue-500 rounded overflow-hidden"
                  >
                    <span className="font-medium text-xs text-gray-700 dark:text-zinc-300 truncate max-w-[120px] px-2 flex items-center bg-gray-200 dark:bg-zinc-800">
                      {shortenStopName(dir.stop.stopName)}
                    </span>
                    <div className="hidden sm:flex">
                      <StopBadge
                        stopId={stopIdentifier}
                        size="xs"
                        borderColor={entry.agency.color?.hex}
                      />
                    </div>
                  </Link>
                </div>
              </div>
            );
          }

          // Different stops per direction - show with direction info below
          return (
            <div
              key={`${entry.agency.currentFeedIndex}-${entry.route.routeShortName}`}
              className="bg-gray-100 dark:bg-zinc-900 border-b border-gray-400 dark:border-zinc-700 last:border-b-0 p-2 border-l-4"
              style={{ borderLeftColor: entry.agency.color?.hex || "#666" }}
            >
              <div className="mb-1.5 flex-shrink-0">
                <RouteSlim
                  {...entry.route}
                  size="xs"
                  link={`/${entry.agency.slug?.current}/route/${entry.route.displayShortName}`}
                />
              </div>
              <div className="ml-1">
                {directions.map((dir, idx) => {
                  const stopIdentifier = getStopIdentifier(
                    dir.stop,
                    entry.agency
                  );

                  return (
                    <React.Fragment key={dir.directionId}>
                      {idx > 0 && (
                        <hr className="border-gray-300 dark:border-zinc-700 ml-0 mr-12 my-1" />
                      )}
                      <div className="flex items-center justify-between gap-2 py-1 w-full">
                        <div className="text-xs text-gray-500 dark:text-zinc-500 w-[40%] sm:w-[40%] flex-shrink-0 leading-tight">
                          {dir.directionDescription && (
                            <div className="text-xs">
                              <span className="font-semibold">
                                {dir.directionDescription}
                              </span>
                            </div>
                          )}
                          {dir.directionHeadsign && (
                            <div>
                              to{" "}
                              <span className="font-regular">
                                {shortenHeadsign(dir.directionHeadsign)}
                              </span>
                            </div>
                          )}
                          {!dir.directionDescription &&
                            !dir.directionHeadsign && (
                              <div>Direction {dir.directionId}</div>
                            )}
                        </div>
                        <Link
                          to={`/${dir.stop.agencySlug}/stop/${stopIdentifier}`}
                          className="flex items-stretch hover:text-blue-500 rounded overflow-hidden"
                        >
                          <span className="font-medium text-xs text-gray-700 dark:text-zinc-300 px-2 flex items-center bg-gray-200 dark:bg-zinc-800">
                            {shortenStopName(dir.stop.stopName)}
                          </span>
                          <div className="hidden sm:flex">
                            <StopBadge
                              stopId={stopIdentifier}
                              size="xs"
                              borderColor={entry.agency.color?.hex}
                            />
                          </div>
                        </Link>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StopTransfers;
