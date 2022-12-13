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
const RouteHeader = ({ routeShortName, routeLongName, routeColor='#000', routeTextColor='#fff', agency }) => {

  return (
    <Link to={`/${agency.slug.current}/route/${routeShortName}`}>
      <li className="flex items-center justify-start py-2 md:px-2 bg-gray-200">
        <span 
          className="w-10 font-bold text-center py-2 bg-white mx-2" 
          style={{background: `${routeColor}`, color: `${routeTextColor}`}}
        >
          {routeShortName}
        </span>
        <span className="">
          {routeLongName}
        </span>
      </li>
    </Link>
  )
}

export default RouteHeader;