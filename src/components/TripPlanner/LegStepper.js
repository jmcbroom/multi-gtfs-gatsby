import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faExchange,
  faPersonWalking,
} from "@fortawesome/free-solid-svg-icons";
import { formatDuration, formatDistance, formatTime } from "../../tripPlannerUtils";
import RouteSlim from "../RouteSlim";

/**
 * Step-by-step navigation through itinerary legs
 */
const LegStepper = ({ itinerary, focusedLegIndex, setFocusedLegIndex }) => {
  if (!itinerary?.legs || itinerary.legs.length === 0) {
    return null;
  }

  const handlePrev = () => {
    if (focusedLegIndex === null) {
      setFocusedLegIndex(0);
    } else if (focusedLegIndex > 0) {
      setFocusedLegIndex(focusedLegIndex - 1);
    }
  };

  const handleNext = () => {
    if (focusedLegIndex === null) {
      setFocusedLegIndex(0);
    } else if (focusedLegIndex < itinerary.legs.length - 1) {
      setFocusedLegIndex(focusedLegIndex + 1);
    }
  };

  const renderLegInfo = () => {
    if (focusedLegIndex === null) {
      return (
        <button
          onClick={() => setFocusedLegIndex(0)}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200"
        >
          Go step-by-step through this trip.
        </button>
      );
    }

    const leg = itinerary.legs[focusedLegIndex];
    const prevLeg = focusedLegIndex > 0 ? itinerary.legs[focusedLegIndex - 1] : null;
    const nextLeg = itinerary.legs[focusedLegIndex + 1];

    const isWalk = leg?.mode === "WALK";
    const isTransit = !isWalk;

    // Check if this is a short walk transfer between two transit legs
    const isShortWalkTransfer =
      isWalk &&
      (leg.distance || 0) < 200 &&
      focusedLegIndex > 0 &&
      prevLeg?.mode !== "WALK" &&
      nextLeg &&
      nextLeg.mode !== "WALK";

    // Check if this is a same-stop transfer
    const isSameStopTransfer =
      isTransit &&
      focusedLegIndex > 0 &&
      prevLeg?.mode !== "WALK";

    // Calculate transfer details
    let transferDetails = "";

    if (isShortWalkTransfer) {
      const arrivalTime = prevLeg?.endTime;
      const departureTime = nextLeg?.startTime;
      const layoverMs =
        arrivalTime && departureTime
          ? new Date(departureTime) - new Date(arrivalTime)
          : 0;
      const layoverMinutes = Math.round(layoverMs / 60000);
      const details = [];
      if (layoverMinutes > 0) details.push(`${layoverMinutes} min`);
      if ((leg.distance || 0) > 0) details.push(`${formatDistance(leg.distance)} walk`);
      transferDetails = details.length > 0 ? ` (${details.join(", ")})` : "";
    } else if (isSameStopTransfer) {
      const arrivalTime = prevLeg?.endTime;
      const departureTime = leg?.startTime;
      const layoverMs =
        arrivalTime && departureTime
          ? new Date(departureTime) - new Date(arrivalTime)
          : 0;
      const layoverMinutes = Math.round(layoverMs / 60000);
      if (layoverMinutes > 0) {
        transferDetails = ` (${layoverMinutes} min wait)`;
      }
    }

    const displayStartTime = isShortWalkTransfer ? prevLeg?.endTime : leg.startTime;
    const displayEndTime = isShortWalkTransfer ? nextLeg?.startTime : leg.endTime;

    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-2">
          {isShortWalkTransfer ? (
            <>
              <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faExchange} className="text-white text-[10px]" />
              </div>
              <span className="text-gray-500 dark:text-zinc-400 text-xs">
                Transfer{transferDetails}
              </span>
            </>
          ) : isSameStopTransfer ? (
            <>
              <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faExchange} className="text-white text-[10px]" />
              </div>
              <span className="text-gray-500 dark:text-zinc-400 text-xs">
                Transfer{transferDetails} to
              </span>
              <RouteSlim
                routeShortName={leg.route?.shortName}
                displayShortName={leg.route?.shortName}
                routeLongName={leg.route?.longName}
                routeColor={`#${leg.route?.color || "666666"}`}
                routeTextColor={`#${leg.route?.textColor || "ffffff"}`}
                direction={
                  leg.sanityDirection || {
                    directionHeadsign: leg.sanityHeadsign || leg.headsign,
                  }
                }
                size="small"
              />
            </>
          ) : isWalk ? (
            <>
              <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faPersonWalking} className="text-white text-[10px]" />
              </div>
              <span className="text-gray-500 dark:text-zinc-400 text-xs">
                Walk {formatDuration(leg.duration)}/{formatDistance(leg.distance)}
              </span>
            </>
          ) : (
            <>
              <RouteSlim
                routeShortName={leg.route?.shortName}
                displayShortName={leg.route?.shortName}
                routeLongName={leg.route?.longName}
                routeColor={`#${leg.route?.color || "666666"}`}
                routeTextColor={`#${leg.route?.textColor || "ffffff"}`}
                direction={
                  leg.sanityDirection || {
                    directionHeadsign: leg.sanityHeadsign || leg.headsign,
                  }
                }
                size="small"
              />
              <span className="text-xs text-gray-400 dark:text-zinc-500">
                {formatDuration(leg.duration)}
              </span>
            </>
          )}
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {focusedLegIndex + 1}/{itinerary.legs.length}
          </span>
          <button
            onClick={() => setFocusedLegIndex(null)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
        <div className="text-[10px] text-gray-400 dark:text-zinc-500">
          {formatTime(displayStartTime)} – {formatTime(displayEndTime)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-zinc-800">
      {focusedLegIndex !== null ? (
        <button
          onClick={handlePrev}
          disabled={focusedLegIndex === 0}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600 dark:text-zinc-400" />
        </button>
      ) : (
        <div className="p-2 w-8" />
      )}
      <div className="flex-1 flex items-center justify-center gap-2 text-sm">
        {renderLegInfo()}
      </div>
      <button
        onClick={handleNext}
        disabled={focusedLegIndex !== null && focusedLegIndex === itinerary.legs.length - 1}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 dark:text-zinc-400" />
      </button>
    </div>
  );
};

export default LegStepper;
