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
const RouteSlim = ({ routeShortName, routeLongName, routeColor='#000', routeTextColor='#fff' }) => {
  console.log(routeShortName)
  
  let widths = {
    1: 'w-5',
    2: 'w-6',
    3: 'w-8',
    4: 'w-10'
  }

  let routeNumberClassName = `plex font-base text-sm text-center bg-white ${widths[routeShortName.length]}`
  return (
      <li className={"flex items-center justify-start gap-2"}>

        <span 
          className={routeNumberClassName}
          style={{background: `${routeColor}`, color: `${routeTextColor}`}}
        >
          {routeShortName}
        </span>

        <h2 className="text-sm mb-0">
          {routeLongName}
        </h2>
      </li>
  )
}

export default RouteSlim;