import React from "react";
import { Link } from "gatsby";
import RouteBadge from "./RouteBadge";
import { shortenHeadsign } from "../util";

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

  const sizes = {
    xs: {
      gap: "gap-2",
      name: "text-sm mb-0 font-medium leading-3",
      direction: "text-xs text-gray-500 dark:text-gray-400 text-left font-medium",
    },
    small: {
      gap: "gap-2",
      name: "text-sm mb-0 font-medium leading-4",
      direction: "text-xs text-gray-500 dark:text-gray-400 text-left font-medium",
    },
    medium: {
      gap: "gap-2",
      name: "text-sm mb-0 font-medium leading-4",
      direction: "text-xs text-gray-500 dark:text-gray-400 text-left font-medium",
    },
  };

  const sizeConfig = sizes[size] || sizes.medium;

  // For small sizes, truncate route name at dash to save space
  const isSmallSize = size === "small" || size === "xs" || size === "medium";
  const displayName = isSmallSize && routeLongName?.includes("-") && routeLongName?.includes("FAST")
    ? routeLongName.split("-")[0].trim()
    : routeLongName;

  const getDirectionText = (direction) => {
    if (!direction?.directionDescription && !direction?.directionHeadsign) {
      return null;
    }
    
    const headsign = shortenHeadsign(direction.directionHeadsign);
    
    if (direction.directionDescription) {
      return `${direction.directionDescription.replace("bound", "")} to ${headsign}`;
    }
    
    return `to ${headsign}`;
  };

  return (
    <div className={`flex items-center justify-start ${sizeConfig.gap}`}>
      <RouteBadge route={{ displayShortName, routeColor, routeTextColor }} size={size} />
      <div className="flex flex-col items-start justify-around">
        <NameWrapper {...nameProps}>
          <h2 className={sizeConfig.name}>{displayName}</h2>
        </NameWrapper>
        {getDirectionText(direction) && (
          <span className={sizeConfig.direction}>
            {getDirectionText(direction)}
          </span>
        )}
      </div>
    </div>
  );
};

export default RouteSlim;
