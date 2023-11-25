import React from 'react';
import {Link} from 'gatsby';

/**
 * Displays the number badge and name of a route.
 * Pass a spread `route` GraphQL object with the following parameters:
 * @param {Number} feedIndex 
 * @param {String} shortName 
 * @param {String} longName 
 * @param {Number} routeColor 
 * @param {Number} routeTextColor 
 */
const RouteSlim = ({ routeShortName, displayShortName, routeLongName, routeColor='#000', routeTextColor='#fff' }) => {
  
  let widths = {
    1: 'w-6',
    2: 'w-6',
    3: 'w-9',
    4: 'w-10'
  }

  let routeNumberClassName = `plex flex items-center justify-around text-xs bg-white ${widths[displayShortName.length]} h-6`
  return (
      <li className={"flex items-center justify-start gap-1.5"}>
        <span 
          className={routeNumberClassName}
          style={{background: `${routeColor}`, color: `${routeTextColor}`}}
          >
          {displayShortName}
        </span>

        <h2 className="text-sm mb-0">
          {routeLongName}
        </h2>
      </li>
  )
}

export default RouteSlim;