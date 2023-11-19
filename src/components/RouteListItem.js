import React from "react";
import { Link } from "gatsby";

/**
 * Displays the number badge and name of a route.
 * Pass a spread `route` GraphQL object with the following parameters:
 * @param {Number} feedIndex
 * @param {String} shortName
 * @param {String} longName
 * @param {Number} routeColor
 * @param {Number} routeTextColor
 */
const RouteListItem = ({
  routeShortName,
  routeLongName,
  displayShortName,
  routeColor = "#000",
  routeTextColor = "#fff",
  agency,
}) => {

  let widths = {
    1: 'w-10',
    2: 'w-10',
    3: 'w-12',
    4: 'w-14'
  }

  return (
    <Link to={`/${agency.slug.current}/route/${displayShortName}`}>
      <div className="inline-block mr-2">
        <div className="flex items-center justify-start gap-2 text-sm">
          <span
            className={`${widths[displayShortName.length]} h-8 font-extrabold text-center justify-center items-center flex bg-white`}
            style={{ background: `${routeColor}`, color: `${routeTextColor}` }}
          >
            {displayShortName}
          </span>
          <span className="text-base font-medium">{routeLongName}</span>
        </div>
      </div>
    </Link>
  );
};

export default RouteListItem;
