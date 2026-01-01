import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchange } from "@fortawesome/free-solid-svg-icons";
import { formatTime, formatDistance } from "../../tripPlannerUtils";

/**
 * Origin step - green A marker at the start of the timeline
 */
export const OriginStep = ({ name, time }) => {
  return (
    <div className="flex gap-3 relative py-2 -mx-2 px-2 items-center">
      <div className="w-8 flex justify-center relative">
        <div className="absolute top-1/2 bottom-0 w-0.5 bg-green-400 dark:bg-green-500"></div>
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center z-10 relative text-white text-[10px] font-bold">
          A
        </div>
      </div>
      <div className="flex-1 flex justify-between items-center text-xs text-gray-500 dark:text-zinc-400 pt-0.5">
        <div>{name || 'Origin'}</div>
        <div className="font-semibold">{formatTime(time)}</div>
      </div>
    </div>
  );
};

/**
 * Destination step - red B marker at the end of the timeline
 */
export const DestinationStep = ({ name, time }) => {
  return (
    <div className="flex gap-3 relative py-0 my-0 -mx-2 px-2 items-center">
      <div className="w-8 flex justify-center relative">
        <div className="absolute top-0 h-4 w-0.5 bg-gray-300 dark:bg-zinc-600"></div>
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center z-10 relative text-white text-[10px] font-bold">
          B
        </div>
      </div>
      <div className="flex-1 flex justify-between items-center text-xs text-gray-500 dark:text-zinc-400 pt-0.5">
        <div>{name || 'Destination'}</div>
        <div className="font-semibold">{formatTime(time)}</div>
      </div>
    </div>
  );
};

/**
 * Transfer step - shown when changing between transit routes
 */
export const TransferStep = ({ fromLeg, toLeg, walkLeg, isLast, index, onHover }) => {
  const arrivalTime = fromLeg?.endTime;
  const departureTime = toLeg?.startTime;
  const layoverMs = arrivalTime && departureTime ? departureTime - arrivalTime : 0;
  const layoverMinutes = Math.round(layoverMs / 60000);

  const walkDistance = walkLeg?.distance || 0;

  const details = [];
  if (layoverMinutes > 0) details.push(`${layoverMinutes} min`);
  if (walkDistance > 0) details.push(`${formatDistance(walkDistance)} walk`);
  const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';

  return (
    <div
      className="flex gap-3 relative py-0 -mx-2 px-2 rounded transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
      onMouseEnter={() => onHover && onHover(index)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      <div className="w-8 flex justify-center items-center relative">
        {!isLast && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-zinc-600"></div>
        )}
        <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center z-10 relative">
          <FontAwesomeIcon icon={faExchange} className="text-white text-[10px]" />
        </div>
      </div>
      <div className="flex-1 text-xs py-2">
        <div className="font-medium text-gray-500 dark:text-zinc-400">Transfer{detailsStr}</div>
      </div>
    </div>
  );
};
