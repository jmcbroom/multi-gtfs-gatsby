import React from "react";
import RouteSlim from "./RouteSlim";
import { useSanityRoutes } from "../hooks/useSanityRoutes";

/**
 * RouteCard - A card component for displaying favorite routes
 *
 * @param {Object} route - Route data from favorites db
 * @param {Object} agency - Agency data
 * @param {String} variant - "default" (old style) or "card" (new rounded style)
 */
const RouteCard = ({ route, agency, variant = "default" }) => {
  // Get Sanity routes for direction info
  const { sanityRoutes } = useSanityRoutes();
  const allSanityRoutes = sanityRoutes?.edges?.map((e) => e.node) || [];

  // Find matching Sanity route for headsigns
  const sanityRoute = allSanityRoutes.find(
    (sr) =>
      (sr.agency?.slug?.current === agency?.slug?.current ||
       sr.agency?.currentFeedIndex === agency?.currentFeedIndex) &&
      sr.shortName === route.displayShortName
  );

  // Get directions/headsigns from Sanity
  const directions = sanityRoute?.directions || [];

  let url = `/${route.displayShortName.toLowerCase()}`;

  if (agency && agency?.slug?.current !== "d2a2") {
    url = `/${agency.slug.current}/route/${route.displayShortName}`;
  }

  if (route.displayShortName === "DPM") {
    url = "/people-mover";
  }

  const routeColor = sanityRoute?.color?.hex || route.routeColor || "#666";
  const routeTextColor = sanityRoute?.textColor?.hex || route.routeTextColor || "#fff";
  const routeLongName = sanityRoute?.longName || route.routeLongName;

  // Default variant - original styling
  if (variant === "default") {
    return (
      <div
        key={route.id}
        className="bg-gray-100 dark:bg-zinc-900 border-b border-dotted border-gray-400 dark:border-zinc-700 last:border-none"
      >
        <div className="px-2 py-3">
          <RouteSlim
            routeShortName={route.displayShortName}
            displayShortName={route.displayShortName}
            routeLongName={routeLongName}
            routeColor={routeColor}
            routeTextColor={routeTextColor}
            link={url}
            size="medium"
          />
        </div>
      </div>
    );
  }

  // Card variant - new rounded styling with headsigns
  return (
    <div
      className="block rounded-lg border border-l-4 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:shadow-sm transition-all overflow-hidden"
      style={{ borderLeftColor: routeColor }}
    >
      {/* Route info */}
      <div className="p-3">
        <RouteSlim
          routeShortName={route.displayShortName}
          displayShortName={route.displayShortName}
          routeLongName={routeLongName}
          routeColor={routeColor}
          routeTextColor={routeTextColor}
          link={url}
          size="small"
        />
      </div>

      {/* Headsigns/destinations */}
      {directions.length > 0 && (
        <div className="px-3 pb-3 -mt-1">
          <div className="flex flex-wrap gap-1.5 ml-7">
            {directions.map((dir) => (
              <span
                key={dir.directionId}
                className="text-xs text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 rounded"
              >
                {dir.directionDescription && (
                  <span className="font-medium">
                    {dir.directionDescription.replace("bound", "")}:{" "}
                  </span>
                )}
                {dir.directionHeadsign}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteCard;
