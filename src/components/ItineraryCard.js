import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonWalking, faBusSimple, faTrain, faShip, faBicycle, faArrowRight, faChevronDown, faChevronUp, faExchange, faMapMarkerAlt, faFlag } from "@fortawesome/free-solid-svg-icons";
import { formatDuration, formatTime, formatDistance, getModeDisplay } from "../tripPlannerUtils";
import RouteBadge from "./RouteBadge";
import RouteSlim from "./RouteSlim";

const getModeIcon = (mode) => {
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

const LegSummary = ({ leg }) => {
  const isTransit = leg.mode !== 'WALK';

  if (isTransit) {
    const route = leg.route;
    return (
      <div className="flex items-center">
        <RouteBadge
          route={{
            displayShortName: route?.shortName,
            routeColor: route?.color ? `#${route.color}` : undefined,
            routeTextColor: route?.textColor ? `#${route.textColor}` : undefined
          }}
          size="small"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300">
      <FontAwesomeIcon icon={getModeIcon(leg.mode)} className="text-sm" />
    </div>
  );
};

// Build URL for a stop on transit.det.city
// Uses stopIdentifierField from the route's agency (stopId or stopCode)
const getStopUrl = (stop, route) => {
  if (!stop?.gtfsId) return null;

  const agencySlug = route?.agencySlug;
  if (!agencySlug) return null;

  // Get the correct stop identifier based on agency preference
  // gtfsId format is "feedIndex:stopId"
  const stopIdentifierField = route?.stopIdentifierField || "stopId";

  // For stopId, extract from gtfsId (after the colon)
  // For stopCode, we'd need it passed in the stop object
  const stopId = stop.gtfsId.split(':')[1];
  if (!stopId) return null;

  // Use stopCode (stop.code from OTP) if available and agency prefers it, otherwise use stopId from gtfsId
  const stopIdentifier = stopIdentifierField === "stopCode" && stop.code
    ? stop.code
    : stopId;

  return `https://transit.det.city/${agencySlug}/stop/${stopIdentifier}`;
};

// Build URL for a route on transit.det.city
const getRouteUrl = (route) => {
  if (!route?.shortName || !route?.agencySlug) return null;
  return `https://transit.det.city/${route.agencySlug}/route/${route.shortName}`;
};

// Origin step - even less emphasized, A label
const OriginStep = ({ name, time }) => {
  return (
    <div className="flex gap-3 relative py-2 -mx-2 px-2 items-center">
      <div className="w-8 flex justify-center relative">
        <div className="absolute top-1/2 bottom-0 w-0.5 bg-green-400 dark:bg-green-500"></div>
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center z-10 relative text-white text-[10px] font-bold">
          A
        </div>
      </div>
      <div className="flex-1 flex justify-between items-center text-xs text-gray-400 dark:text-zinc-500 pt-0.5">
        <div>{name || 'Origin'}</div>
        <div className="font-semibold">{formatTime(time)}</div>
      </div>
    </div>
  );
};

// Destination step - even less emphasized, B label
const DestinationStep = ({ name, time }) => {
  return (
    <div className="flex gap-3 relative py-0 my-0 -mx-2 px-2 items-center">
      <div className="w-8 flex justify-center relative">
        <div className="absolute top-0 h-4 w-0.5 bg-gray-300 dark:bg-zinc-600"></div>
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center z-10 relative text-white text-[10px] font-bold">
          B
        </div>
      </div>
      <div className="flex-1 flex justify-between items-center text-xs text-gray-400 dark:text-zinc-500 pt-0.5">
        <div>{name || 'Destination'}</div>
        <div className="font-semibold">{formatTime(time)}</div>
      </div>
    </div>
  );
};

// Transfer step display for when changing between transit routes
const TransferStep = ({ fromLeg, toLeg, walkLeg, isLast, index, onHover }) => {
  // Calculate layover time (time between arriving on fromLeg and departing on toLeg)
  const arrivalTime = fromLeg?.endTime;
  const departureTime = toLeg?.startTime;
  const layoverMs = arrivalTime && departureTime ? departureTime - arrivalTime : 0;
  const layoverMinutes = Math.round(layoverMs / 60000);

  // Get walk distance from the walk leg
  const walkDistance = walkLeg?.distance || 0;

  return (
    <div
      className="flex gap-3 relative py-0 -mx-2 px-2 rounded transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
      onMouseEnter={() => onHover && onHover(index)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      <div className="w-8 flex justify-center items-center relative">
        {!isLast && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 dark:bg-yellow-600"></div>
        )}
        <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center z-10 relative">
          <FontAwesomeIcon icon={faExchange} className="text-white text-xs" />
        </div>
      </div>
      <div className="flex-1 text-sm py-2">
        <div className="font-medium text-yellow-700 dark:text-yellow-400">Transfer</div>
        <div className="text-gray-500 dark:text-zinc-400 text-xs mt-0.5">
          at {fromLeg.to?.name || 'stop'}
          {layoverMinutes > 0 && ` • ${layoverMinutes} min wait`}
          {walkDistance > 0 && ` • ${formatDistance(walkDistance)} walk`}
        </div>
      </div>
    </div>
  );
};

// Detailed leg display for expanded view
const LegDetail = ({ leg, index, isLast, onHover }) => {
  const isTransit = leg.mode !== 'WALK';
  const bgColor = isTransit && leg.route?.color ? `#${leg.route.color}` : '#6b7280';

  const fromStopUrl = getStopUrl(leg.from?.stop, leg.route);
  const toStopUrl = getStopUrl(leg.to?.stop, leg.route);
  const routeUrl = getRouteUrl(leg.route);

  if (leg.mode === 'WALK') {
    return (
      <div
        className="flex gap-3 relative py-0 -mx-2 px-2 rounded transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
        onMouseEnter={() => onHover && onHover(index)}
        onMouseLeave={() => onHover && onHover(null)}
      >
        {/* Timeline column with icon and line */}
        <div className="w-8 flex justify-center items-center relative">
          {/* Vertical line - extends down unless last item */}
          {!isLast && (
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-zinc-600"></div>
          )}
          {/* Icon - centered with content */}
          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center z-10 relative">
            <FontAwesomeIcon icon={faPersonWalking} className="text-white text-xs" />
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 text-sm py-2">
          <div className="font-medium">Walk {formatDuration(leg.duration)}</div>
          <div className="text-gray-500 dark:text-zinc-400 text-xs mt-0.5">
            {formatDistance(leg.distance)} to {leg.to?.name || 'destination'}
          </div>
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
      {/* Timeline column with icon and line */}
      <div className="w-8 flex justify-center items-center relative">
        {/* Vertical line - extends from icon center to bottom */}
        {!isLast && (
          <div
            className="absolute top-0 bottom-0 w-1"
            style={{ backgroundColor: bgColor }}
          ></div>
        )}
        {/* Icon - centered with content */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center z-10 relative"
          style={{ backgroundColor: bgColor }}
        >
          <FontAwesomeIcon icon={getModeIcon(leg.mode)} className="text-white text-xs" />
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 text-sm py-2">
        {/* Route info using RouteSlim */}
        <div className="mb-1">
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
        <div className="text-gray-500 dark:text-zinc-400 text-xs mt-1">
          {formatTime(leg.startTime)} at{' '}
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
        <div className="text-gray-500 dark:text-zinc-400 text-xs mt-1">
          {formatTime(leg.endTime)} exit at{' '}
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
      </div>
    </div>
  );
};

const ItineraryCard = ({ itinerary, isSelected, isExpanded, onClick, onMouseEnter, onMouseLeave, index, onLegHover, originName, destinationName }) => {
  const { duration, walkDistance, numberOfTransfers, legs, start, end } = itinerary;
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
        {/* Left: Duration and Transfers */}
        <div>
          <div className="text-xl font-bold leading-tight">{formatDuration(duration)}</div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {numberOfTransfers === 0
              ? 'No transfers'
              : `${numberOfTransfers} transfer${numberOfTransfers > 1 ? 's' : ''}`}
            {totalWalkDuration > 0 && `, ${formatDuration(totalWalkDuration)} walking`}
          </div>
        </div>

        {/* Right: Times and Chevron */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="text-gray-500 dark:text-zinc-500">Leave</span>
              <span className="font-semibold text-gray-900 dark:text-zinc-100">{formatTime(start)}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-gray-500 dark:text-zinc-500">Arrive</span>
              <span className="font-semibold text-gray-900 dark:text-zinc-100">{formatTime(end)}</span>
            </div>
          </div>
          <FontAwesomeIcon
            icon={isExpanded ? faChevronUp : faChevronDown}
            className="text-gray-400 dark:text-zinc-500 text-xs"
          />
        </div>
      </div>

      {/* Leg summary pills - filter out short walks (<200m) for cleaner transfer display */}
      <div className="flex items-center gap-1 flex-wrap">
        {legs
          .filter((leg) => leg.mode !== 'WALK' || leg.distance >= 200)
          .map((leg, idx, filteredLegs) => (
            <React.Fragment key={idx}>
              <LegSummary leg={leg} />
              {idx < filteredLegs.length - 1 && (
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="text-gray-400 dark:text-zinc-500 text-xs mx-1"
                />
              )}
            </React.Fragment>
          ))}
      </div>



      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
          {/* Origin step - use passed name or fall back to first leg's from name */}
          <OriginStep name={originName || legs[0]?.from?.name} time={start} />

          {legs.map((leg, idx) => {
            const nextLeg = legs[idx + 1];
            const isLastLeg = idx === legs.length - 1;

            // Check if this is a short walk between two transit legs (transfer)
            const isShortWalkTransfer = leg.mode === 'WALK' &&
              leg.distance < 200 &&
              idx > 0 &&
              legs[idx - 1]?.mode !== 'WALK' &&
              nextLeg && nextLeg.mode !== 'WALK';

            // Skip short walk transfers - we'll show a Transfer step instead
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
              <LegDetail key={idx} leg={leg} index={idx} isLast={false} onHover={onLegHover} />
            );
          })}

          {/* Destination step - use passed name or fall back to last leg's to name */}
          <DestinationStep name={destinationName || legs[legs.length - 1]?.to?.name} time={end} />
        </div>
      )}
    </div>
  );
};

export default ItineraryCard;
