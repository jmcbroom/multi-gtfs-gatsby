import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchange, faPersonWalking } from "@fortawesome/free-solid-svg-icons";
import { formatTime, formatDistance, formatDuration } from "../../tripPlannerUtils";

/**
 * Origin step - green A marker at the start of the timeline
 */
export const OriginStep = ({ name, time }) => {
  return (
    <div className="flex gap-3 relative py-2 -mx-2 px-2 items-center !border-t-0">
      <div className="w-8 flex justify-center relative">
        <div className="absolute top-1/2 bottom-0 w-0.5 bg-green-400 dark:bg-green-500"></div>
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center z-10 relative text-white text-[10px] font-bold">
          A
        </div>
      </div>
      <div className="flex-1 flex justify-between items-center text-xs">
        <div>
          <span className="font-semibold text-gray-700 dark:text-zinc-300">Leave</span>
          <span className="text-gray-500 dark:text-zinc-400"> {name || 'Origin'}</span>
        </div>
        <div className="font-semibold text-gray-900 dark:text-zinc-100">{formatTime(time)}</div>
      </div>
    </div>
  );
};

/**
 * Destination step - red B marker at the end of the timeline
 */
export const DestinationStep = ({ name, time }) => {
  return (
    <div className="flex gap-3 relative py-2 -mx-2 px-2 items-center !border-b-0">
      <div className="w-8 flex justify-center relative">
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center z-10 relative text-white text-[10px] font-bold">
          B
        </div>
      </div>
      <div className="flex-1 flex justify-between items-center text-xs">
        <div>
          <span className="font-semibold text-gray-700 dark:text-zinc-300">Arrive</span>
          <span className="text-gray-500 dark:text-zinc-400"> {name || 'Destination'}</span>
        </div>
        <div className="font-semibold text-gray-900 dark:text-zinc-100">{formatTime(time)}</div>
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
        <div className="text-gray-500 dark:text-zinc-400">
          <span className="font-semibold text-gray-700 dark:text-zinc-300">Transfer</span>{detailsStr}
        </div>
      </div>
    </div>
  );
};

/**
 * Combined walk + endpoint step - shown when trip starts/ends with a walk
 * @param {string} type - 'origin' or 'destination'
 */
export const WalkEndpointStep = ({ name, time, walkLeg, type = 'origin' }) => {
  const isOrigin = type === 'origin';
  const label = isOrigin ? 'from' : 'to';
  const defaultName = isOrigin ? 'Origin' : 'Destination';
  const markerColor = isOrigin ? 'bg-green-500' : 'bg-red-500';
  const markerLetter = isOrigin ? 'A' : 'B';
  const borderClass = isOrigin ? '!border-t-0' : '!border-b-0';

  return (
    <div className={`flex gap-3 relative py-2 -mx-2 px-2 ${borderClass}`}>
      <div className="w-8 flex justify-center items-center relative">
        {isOrigin && (
          <div className="absolute top-1/2 bottom-0 w-0.5 bg-gray-300 dark:bg-zinc-600"></div>
        )}
        <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center z-10 relative">
          <FontAwesomeIcon icon={faPersonWalking} className="text-white text-[10px]" />
        </div>
      </div>
      <div className="flex-1 flex justify-between items-center text-xs">
        <div className="flex flex-col">
          <div>
            <span className="font-semibold text-gray-700 dark:text-zinc-300">Walk</span>
            <span className="text-gray-500 dark:text-zinc-400"> {formatDuration(walkLeg.duration)}/{formatDistance(walkLeg.distance)}</span>
          </div>
          <div className="text-gray-500 dark:text-zinc-400 flex items-center gap-1 min-w-0">
            <span className="truncate">{label} {name || defaultName}</span>
            <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full ${markerColor} text-white text-[8px] font-bold shrink-0`}>{markerLetter}</span>
          </div>
        </div>
        <div className="font-semibold text-gray-900 dark:text-zinc-100">{formatTime(time)}</div>
      </div>
    </div>
  );
};
