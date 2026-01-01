import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { formatDuration, formatTime } from "../../tripPlannerUtils";
import ItinerarySummary from "./ItinerarySummary";
import ItineraryLeg from "./ItineraryLeg";
import { OriginStep, DestinationStep, TransferStep } from "./ItineraryTimeline";

const ItineraryCard = ({
  itinerary,
  isSelected,
  isExpanded,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onLegHover,
  originName,
  destinationName
}) => {
  const { duration, numberOfTransfers, legs, start, end } = itinerary;
  const totalWalkDuration = legs.reduce((acc, leg) => leg.mode === 'WALK' ? acc + leg.duration : acc, 0);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        bg-gray-100 dark:bg-zinc-900
        border-2 rounded-lg p-3 mb-2 cursor-pointer
        transition-all
        ${isSelected
          ? 'border-blue-500 dark:border-blue-400'
          : 'border-transparent hover:border-gray-300 dark:hover:border-zinc-600'}
      `}
    >
      {/* Summary row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xl font-bold leading-tight">{formatDuration(duration)}</div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {numberOfTransfers === 0
              ? 'No transfers'
              : `${numberOfTransfers} transfer${numberOfTransfers > 1 ? 's' : ''}`}
            {totalWalkDuration > 0 && `, ${formatDuration(totalWalkDuration)} walking`}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="text-gray-500 dark:text-zinc-400">Leave</span>
              <span className="font-semibold text-gray-900 dark:text-zinc-100">{formatTime(start)}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-gray-500 dark:text-zinc-400">Arrive</span>
              <span className="font-semibold text-gray-900 dark:text-zinc-100">{formatTime(end)}</span>
            </div>
          </div>
          <FontAwesomeIcon
            icon={isExpanded ? faChevronUp : faChevronDown}
            className="text-gray-500 dark:text-zinc-400 text-xs"
          />
        </div>
      </div>

      {/* Leg summary pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {legs
          .filter((leg) => leg.mode !== 'WALK' || leg.distance >= 200)
          .map((leg, idx, filteredLegs) => (
            <React.Fragment key={idx}>
              <ItinerarySummary leg={leg} />
              {idx < filteredLegs.length - 1 && (
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="text-gray-500 dark:text-zinc-400 text-xs mx-1"
                />
              )}
            </React.Fragment>
          ))}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
          <OriginStep name={originName || legs[0]?.from?.name} time={start} />

          {legs.map((leg, idx) => {
            const nextLeg = legs[idx + 1];

            const isShortWalkTransfer = leg.mode === 'WALK' &&
              leg.distance < 200 &&
              idx > 0 &&
              legs[idx - 1]?.mode !== 'WALK' &&
              nextLeg && nextLeg.mode !== 'WALK';

            if (isShortWalkTransfer) {
              return (
                <TransferStep
                  key={`transfer-${idx}`}
                  fromLeg={legs[idx - 1]}
                  toLeg={nextLeg}
                  walkLeg={leg}
                  isLast={false}
                  index={idx}
                  onHover={onLegHover}
                />
              );
            }

            return (
              <ItineraryLeg key={idx} leg={leg} index={idx} isLast={false} onHover={onLegHover} />
            );
          })}

          <DestinationStep name={destinationName || legs[legs.length - 1]?.to?.name} time={end} />
        </div>
      )}
    </div>
  );
};

export default ItineraryCard;
