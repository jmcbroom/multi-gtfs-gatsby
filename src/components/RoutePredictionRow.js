import dayjs from "dayjs";
import React from "react";
import RouteSlim from "./RouteSlim";
import { uniqBy } from "lodash-es";
import VehicleBadge from "./VehicleBadge";
import nearestPoint from "@turf/nearest-point";
import { shortenHeadsign } from "../util";

const RoutePredictionRow = ({
  vehicle,
  predictions,
  vehicleType,
  isActive,
  onClick,
  showSeparator,
}) => {
  if (!vehicle) {
    return null;
  }

  let {
    routeColor,
    routeTextColor,
    routeShortName,
    routeLongName,
    displayShortName,
    headsign,
    nextStop,
    vid,
    pdist,
    patternMaxDist,
  } = vehicle.properties;

  // Calculate progress percentage along the route
  const progress = patternMaxDist > 0 ? Math.min((pdist / patternMaxDist) * 100, 100) : 0;

  let timepoints = new Set(
    Array.from(
      vehicle.properties.trips
        .map((t) =>
          t.stopTimes
            .filter((st) => st.timepoint === 1)
            .map((st) => st.stop.stopCode)
        )
        .flat()
    )
  );

  let nearest = null;

  if (!predictions) {
    // Use directionId for reliable matching
    let direction = vehicle.properties.directions.find(
      (d) => d.directionId === vehicle.properties.directionId
    );
    if (!direction) {
      console.log('RoutePredictionRow: No direction match for vehicle:', {
        vid,
        directionId: vehicle.properties.directionId,
        headsign: vehicle.properties.headsign,
        availableDirections: vehicle.properties.directions?.map(d => ({
          id: d.directionId,
          headsign: d.directionHeadsign
        }))
      });
      return null;
    }
    let stopsFromTrips = vehicle.properties.trips
      .filter((t) => t.directionId === direction.directionId)
      .map((trip) => trip.stopTimes.map((st) => st.stop))
      .flat();

    let uniqueStops = uniqBy(stopsFromTrips, "stopId");

    let featureCollection = {
      type: "FeatureCollection",
      features: uniqueStops.map((stop) => {
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [stop.stopLon, stop.stopLat],
          },
          properties: {
            stopCode: stop.stopCode,
            stopName: stop.stopName,
          },
        };
      }),
    };

    nearest = nearestPoint(vehicle, featureCollection);
  }

  // Filter predictions to timepoints for the current trip only
  const currentTripId = predictions?.[0]?.tatripid;
  const timepointPredictions = predictions
    ?.filter((prd) =>
      [...timepoints].indexOf(prd.stpid) > -1 &&
      (!currentTripId || prd.tatripid === currentTripId)
    )
    .slice(0, 5) || [];

  return (
    <li
      onClick={onClick}
      className={`relative flex flex-col gap-1 py-3 px-2 md:px-3 cursor-pointer transition-colors ${
        isActive
          ? "bg-blue-50 dark:bg-blue-900/30"
          : "hover:bg-gray-50 dark:hover:bg-zinc-800"
      }`}
    >
      {/* Separator line */}
      {showSeparator && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-zinc-700" />
      )}

      {/* Main row: route info + next stop + vehicle badge */}
      <div className="flex items-center gap-2 md:gap-4">

        {/* Route and destination */}
        <div className="flex-1 min-w-0">
          <RouteSlim
            displayShortName={displayShortName}
            routeShortName={routeShortName}
            routeLongName={routeLongName}
            routeColor={routeColor}
            routeTextColor={routeTextColor}
            direction={{ directionHeadsign: shortenHeadsign(headsign) }}
            size="small"
          />
          {/* Next stop name or nearest stop */}
          <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
            {nextStop ? (
              <>next: {shortenHeadsign(nextStop.stpnm)}</>
            ) : nearest && vehicle.properties.agency === 'transit-windsor' ? (
              <>near: {nearest.properties.stopName}</>
            ) : vehicle.properties.agency === 'qline' && vehicle.properties.status ? (
              <>{vehicle.properties.status}</>
            ) : null}
          </div>
        </div>

        {/* Vehicle badge */}
        <div className="flex-shrink-0">
          <VehicleBadge vehicleType={vehicleType} vehicleId={vid} size="xs" active={isActive} />
        </div>
      </div>

      {/* Progress bar along route (only when expanded) */}
      {isActive && progress > 0 && (
        <div className="mt-1.5 h-[2px] bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: routeColor || '#666',
              opacity: 0.5,
            }}
          />
        </div>
      )}

      {/* Expanded: next major stops (only when active) */}
      {isActive && timepointPredictions.length > 0 && (
        <div className="mt-2 pl-2 md:pl-2 dark:border-zinc-700">
          <span className="font-semibold text-[10px] text-gray-500 dark:text-zinc-500 block mb-1">
            Next major stops:
          </span>
          <div className="flex flex-col gap-1">
            {timepointPredictions.map((prediction, idx) => (
              <div
                key={`${prediction.stpid}-${idx}`}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate mr-2">{shortenHeadsign(prediction.stpnm)}</span>
                <span className="flex-shrink-0 text-gray-500 dark:text-zinc-400 tabular-nums">
                  {prediction.prdctdn === "DUE" ? (
                    "now"
                  ) : (
                    <>
                      {prediction.prdctdn}m
                      <span className="text-gray-400 dark:text-zinc-600 ml-1">
                        ({dayjs(prediction.prdtm, "YYYYMMDD HH:mm").format("h:mm")})
                      </span>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

export default RoutePredictionRow;
