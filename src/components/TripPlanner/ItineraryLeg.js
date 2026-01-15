import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonWalking, faBusSimple, faTrain, faShip, faBicycle, faWifi } from "@fortawesome/free-solid-svg-icons";
import { formatDuration, formatDistance, formatTime, formatDelay, shouldShowRealtimeBadge } from "../../tripPlannerUtils";
import { getStopUrlFromOtp, getRouteUrlFromOtp } from "../../stopUtils";
import RouteSlim from "../RouteSlim";

export const getModeIcon = (mode) => {
  const icons = {
    WALK: faPersonWalking,
    BUS: faBusSimple,
    TRAM: faTrain,
    RAIL: faTrain,
    SUBWAY: faTrain,
    FERRY: faShip,
    BICYCLE: faBicycle,
  };
  return icons[mode] || faBusSimple;
};

const ItineraryLeg = ({ leg, index, isLast, onHover }) => {
  const isTransit = leg.mode !== 'WALK';
  const bgColor = isTransit && leg.route?.color ? `#${leg.route.color}` : '#6b7280';

  const fromStopUrl = getStopUrlFromOtp(leg.from?.stop, leg.route);
  const toStopUrl = getStopUrlFromOtp(leg.to?.stop, leg.route);
  const routeUrl = getRouteUrlFromOtp(leg.route);

  if (leg.mode === 'WALK') {
    return (
      <div
        className="flex gap-3 relative py-0 -mx-2 px-2 rounded transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
        onMouseEnter={() => onHover && onHover(index)}
        onMouseLeave={() => onHover && onHover(null)}
      >
        <div className="w-8 flex justify-center items-center relative">
          <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center z-10 relative">
            <FontAwesomeIcon icon={faPersonWalking} className="text-white text-[10px]" />
          </div>
        </div>
        <div className="flex-1 text-xs py-2">
          <div className="font-medium text-gray-500 dark:text-zinc-400">Walk {formatDuration(leg.duration)}/{formatDistance(leg.distance)}</div>
        </div>
      </div>
    );
  }

  // Transit leg
  return (
    <div
      className="flex gap-3 relative py-0 -mx-2 px-2 rounded transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
      onMouseEnter={() => onHover && onHover(index)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      <div className="w-8 flex justify-center items-center relative">
        {!isLast && (
          <div
            className="absolute top-0 bottom-0 w-1"
            style={{ backgroundColor: bgColor }}
          ></div>
        )}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center z-10 relative"
          style={{ backgroundColor: bgColor }}
        >
          <FontAwesomeIcon icon={getModeIcon(leg.mode)} className="text-white text-xs" />
        </div>
      </div>
      <div className="flex-1 text-sm py-3">
        <div className="flex justify-between items-center text-xs mb-2">
          <div className="text-gray-500 dark:text-zinc-400">
            <span className="font-semibold text-gray-700 dark:text-zinc-300">Board</span> at{' '}
            {fromStopUrl ? (
              <a
                href={fromStopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-blue-600 dark:text-blue-400"
                onClick={(e) => e.stopPropagation()}
              >
                {leg.from?.name}
              </a>
            ) : (
              leg.from?.name
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              {shouldShowRealtimeBadge(leg) && (
                <FontAwesomeIcon icon={faWifi} className="text-green-500 text-[8px]" title="Real-time data" />
              )}
              <div className="font-semibold text-gray-900 dark:text-zinc-100">
                {formatTime(leg.startTime)}
              </div>
            </div>
            {formatDelay(leg.startDelay) && (
              <span className="text-[9px] text-gray-500 dark:text-zinc-400 leading-tight">
                {formatDelay(leg.startDelay)}
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mb-2">
          <div>
            {routeUrl ? (
              <a
                href={routeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                <RouteSlim
                  routeShortName={leg.route?.shortName}
                  displayShortName={leg.route?.shortName}
                  routeLongName={leg.route?.longName}
                  routeColor={`#${leg.route?.color || '666666'}`}
                  routeTextColor={`#${leg.route?.textColor || 'ffffff'}`}
                  direction={leg.sanityDirection || { directionHeadsign: leg.sanityHeadsign || leg.headsign }}
                  size="small"
                />
              </a>
            ) : (
              <RouteSlim
                routeShortName={leg.route?.shortName}
                displayShortName={leg.route?.shortName}
                routeLongName={leg.route?.longName}
                routeColor={`#${leg.route?.color || '666666'}`}
                routeTextColor={`#${leg.route?.textColor || 'ffffff'}`}
                direction={leg.sanityDirection || { directionHeadsign: leg.sanityHeadsign || leg.headsign }}
                size="small"
              />
            )}
          </div>
          {leg.mode !== 'WALK' && leg.intermediateStops && (
            <span className="text-[9px] text-gray-500 dark:text-zinc-400">
              {leg.intermediateStops.length + 1} stop{leg.intermediateStops.length + 1 !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center text-xs">
          <div className="text-gray-500 dark:text-zinc-400">
            <span className="font-semibold text-gray-700 dark:text-zinc-300">Exit</span> at{' '}
            {toStopUrl ? (
              <a
                href={toStopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-blue-600 dark:text-blue-400"
                onClick={(e) => e.stopPropagation()}
              >
                {leg.to?.name}
              </a>
            ) : (
              leg.to?.name
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              {shouldShowRealtimeBadge(leg) && (
                <FontAwesomeIcon icon={faWifi} className="text-green-500 text-[8px]" title="Real-time data" />
              )}
              <div className="font-semibold text-gray-900 dark:text-zinc-100">
                {formatTime(leg.endTime)}
              </div>
            </div>
            {formatDelay(leg.endDelay) && (
              <span className="text-[9px] text-gray-500 dark:text-zinc-400 leading-tight">
                {formatDelay(leg.endDelay)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryLeg;
