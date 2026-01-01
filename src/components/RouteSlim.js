import React from "react";
import { Link } from "gatsby";
import RouteBadge from "./RouteBadge";

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
  displayShortName='fake',
  routeLongName,
  routeColor = "#000",
  routeTextColor = "#fff",
  direction = {},
  size="medium",
  link
}) => {
  const NameWrapper = link ? Link : React.Fragment;
  const nameProps = link ? { to: link } : {};

  return (
    <div className={"flex items-center justify-start gap-2"}>
      <RouteBadge route={{ displayShortName, routeColor, routeTextColor }} size={size} />
      <div className="flex flex-col items-start justify-around">
        <NameWrapper {...nameProps}>
          <h2 className="text-sm mb-0 font-medium leading-4">{routeLongName}</h2>
        </NameWrapper>
        {(direction?.directionDescription || direction?.directionHeadsign) && (
          <span className="text-xs text-gray-500 dark:text-gray-400 text-left font-medium">
            {direction.directionDescription
              ? `${direction.directionDescription.replace("bound", "")} to ${direction.directionHeadsign}`
              : `to ${direction.directionHeadsign}`}
          </span>
        )}
      </div>
    </div>
  );
};

export default RouteSlim;
