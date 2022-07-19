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
const RouteHeader = ({ feedIndex, routeShortName, routeLongName, routeColor='#000', routeTextColor='#fff', slug }) => {

  return (
    <Link to={`/${slug}/route/${routeShortName}`}>
      <li className="flex items-center justify-start py-2 bg-gray-200">
        <span 
          className="w-10 font-bold text-center py-2 bg-white mx-2" 
          style={{background: `#${routeColor}`, color: `#${routeTextColor}`}}
        >
          {routeShortName}
        </span>
        <span>
          {routeLongName}
        </span>
      </li>
    </Link>
  )
}

export default RouteHeader;