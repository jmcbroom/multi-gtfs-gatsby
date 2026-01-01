import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonWalking, faBusSimple, faTrain, faShip, faBicycle } from "@fortawesome/free-solid-svg-icons";
import { formatDuration, formatDistance, formatTime } from "../../tripPlannerUtils";
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
          {!isLast && (
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-zinc-600"></div>
          )}
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
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-zinc-400 mb-2">
          <div>
            Board at{' '}
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
          <div className="font-semibold">{formatTime(leg.startTime)}</div>
        </div>
        <div className="mb-2">
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
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-zinc-400">
          <div>
            Exit at{' '}
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
          <div className="font-semibold">{formatTime(leg.endTime)}</div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryLeg;
