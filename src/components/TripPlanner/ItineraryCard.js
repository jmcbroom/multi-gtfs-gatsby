import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { formatDuration, formatTime } from "../../tripPlannerUtils";
import ItinerarySummary from "./ItinerarySummary";

const ItineraryCard = ({
  itinerary,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { duration, numberOfTransfers, legs, start, end } = itinerary;
  const totalWalkDuration = legs.reduce(
    (acc, leg) => (leg.mode === "WALK" ? acc + leg.duration : acc),
    0
  );

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        bg-gray-100 dark:bg-zinc-900
        border-2 rounded-lg p-2 cursor-pointer
        transition-all
        ${
          isSelected
            ? "border-blue-500 dark:border-blue-400"
            : "border-transparent hover:border-gray-300 dark:hover:border-zinc-600"
        }
      `}
    >
      {/* Summary row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col w-36 md:w-40">
          <div className="font-semibold leading-tight">
            {formatDuration(duration)}
          </div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 leading-tight">
            {formatTime(start)} – {formatTime(end)}
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-[4px]">
          {legs
            .filter((leg) => leg.mode !== "WALK" || leg.distance >= 200)
            .map((leg, idx, filteredLegs) => (
              <React.Fragment key={idx}>
                <ItinerarySummary leg={leg} />
                {idx < filteredLegs.length - 1 && (
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-gray-500 dark:text-zinc-400 text-[8px]"
                  />
                )}
              </React.Fragment>
            ))}
        </div>
      </div>

      {/* Leg summary pills */}
    </div>
  );
};

export default ItineraryCard;
