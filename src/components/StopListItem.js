import { Link } from "gatsby";
import React from "react";

const StopListItem = ({ stopTime, feedIndex, routeColor, agency, small = false }) => {
  let liStyle = {
    borderColor: `#${routeColor}`,
  };

  let normalStopStyle = {
    borderColor: `#${routeColor}`,
    backgroundColor: `white`,
  };

  let timepointStyle = {
    borderColor: `black`,
    backgroundColor: `black`,
  };
  
  const commonBorderClass = `border-gray-200 dark:border-neutral-800`;
  const normalStopClass = `bg-white dark:bg-black ${commonBorderClass}`;
  const timepointClass = `border-black dark:border-white bg-black dark:bg-white`;

  return (
    <div
      className={`flex items-center border-l-4 ${commonBorderClass} py-2 ml-2`}
      style={liStyle}
      key={stopTime.stop.stopCode}
    >
      <span
        className={
          `${(small ? `w-3 h-3 -ml-2` : `w-5 h-5 -ml-3`)} rounded-full border-4 ${(stopTime.timepoint ? timepointClass : normalStopClass)}`
        }
      ></span>
      <Link
        to={`/${agency.slug.current}/stop/${
          agency.slug.current === "ddot" ? stopTime.stop.stopCode : stopTime.stop.stopId
        }`}
        aria-label={`Stop page for stop ${stopTime.stop.stopName}`}
      >
        <span className="ml-2 text-opacity-100">{stopTime.stop.stopName}</span>
        <span className="text-xs text-gray-700 dark:text-neutral-400 bg-gray-200 dark:bg-zinc-900 p-1 mx-3">
          #{agency.slug.current === "ddot" ? stopTime.stop.stopCode : stopTime.stop.stopId}
        </span>
      </Link>
    </div>
  );
};

export default StopListItem;
