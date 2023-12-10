import { Link } from "gatsby";
import React from "react";

const StopListItem = ({ stopTime, feedIndex, routeColor, agency, small = false, link=true }) => {
  let liStyle = {
    borderColor: `${routeColor}`
  };

  let normalStopStyle = {
    borderColor: `${routeColor}`,
    backgroundColor: `white`,
  };

  let timepointStyle = {
    borderColor: `black`,
    backgroundColor: `black`,
  };
  
  const normalStopClass = `bg-white dark:bg-black border-black dark:border-gray-200`;
  const timepointClass = `border-black dark:border-white bg-gray-800 dark:bg-white`;

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
      to={`/${agency.slug.current}/stop/${
        stopTime.stop[agency.stopIdentifierField]
      }`}
      aria-label={`Stop page for stop ${stopTime.stop.stopName}`}
      >
        <span className="ml-2 text-opacity-100">{stopTime.stop.stopName}</span>
        <span className="font-mono text-xs text-gray-700 dark:text-neutral-400 bg-gray-200 dark:bg-zinc-900 p-1 mx-3">
          #{stopTime.stop[agency.stopIdentifierField]}
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
