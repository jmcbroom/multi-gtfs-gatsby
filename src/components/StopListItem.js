import { Link } from "gatsby";
import React from "react";
import { getStopIdentifier } from "../stopUtils";
import StopBadge from "./StopBadge";

const StopListItem = ({ stopTime, feedIndex, routeColor, agency, small = false, link = true }) => {
  const stopIdentifier = getStopIdentifier(stopTime.stop, agency);

  const liStyle = {
    borderColor: `${routeColor}`
  };

  const normalStopClass = `border-3 bg-white dark:bg-black border-black dark:border-gray-200`;
  const timepointClass = `border-black border-3 bg-gray-800 dark:border-gray-300 dark:bg-gray-700`;

  return (
    <div
      className={`flex items-center border-l-4 py-2 ml-2 text-xs sm:text-sm md:text-base`}
      style={liStyle}
      key={stopTime.stop.stopCode}
    >
      <span
        className={
          `${(small ? `w-3 h-3 -ml-2` : `w-5 h-5 -ml-3`)} rounded-full border-2 ${(stopTime.timepoint ? timepointClass : normalStopClass)}`
        }
      ></span>
      {link ?
      <Link
        to={`/${agency.slug.current}/stop/${stopIdentifier}`}
        aria-label={`Stop page for stop ${stopTime.stop.stopName}`}
      >
        <span className="ml-2 text-opacity-100">{stopTime.stop.stopName}</span>
        <span className="ml-2">
          <StopBadge stopId={stopIdentifier} size="xs" borderColor={routeColor} />
        </span>
      </Link>
      :
      <>
        <span className="ml-2 text-opacity-100">{stopTime.stop.stopName}</span>
      </>}
    </div>
  );
};

export default StopListItem;
