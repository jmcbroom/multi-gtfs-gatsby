import React from "react";

/**
 * Displays the number badge and name of a route.
 * Pass a spread `route` GraphQL object with the following parameters:
 * @param {Number} feedIndex
 * @param {String} shortName
 * @param {String} longName
 * @param {Number} routeColor
 * @param {Number} routeTextColor
 */
const RouteSlim = ({
  routeShortName,
  displayShortName,
  routeLongName,
  routeColor = "#000",
  routeTextColor = "#fff",
  direction = {},
}) => {

  let widths = {
    1: "w-8",
    2: "w-8",
    3: "w-9",
    4: "w-10",
    5: "w-12",
  };

  let routeNumberClassName = `plex flex items-center justify-around text-sm font-semibold bg-white ${
    widths[displayShortName.length]
  } h-8`;
  return (
    <div className={"flex items-center justify-start gap-2"}>
      <span
        className={routeNumberClassName}
        style={{ background: `${routeColor}`, color: `${routeTextColor}` }}
      >
        {displayShortName}
      </span>

      <div className="flex flex-col items-start">
        <h2 className="text-sm mb-0 font-medium leading-4">{routeLongName}</h2>
        {direction?.directionDescription && (
          <span className="text-xs text-gray-600 dark:text-gray-400 text-left">
            to {direction.directionHeadsign}
          </span>
        )}
      </div>
    </div>
  );
};

export default RouteSlim;
