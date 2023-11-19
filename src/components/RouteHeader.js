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
const RouteHeader = ({ routeShortName, displayShortName, routeLongName, routeColor='#000', routeTextColor='#fff', agency, className }) => {

  let widths = {
    1: 'w-10',
    2: 'w-10',
    3: 'w-12',
    4: 'w-16'
  }

  let routeNumberClassName = `plex font-extrabold text-center py-2 bg-white ${widths[displayShortName.length]}`
  return (
    <Link to={`/${agency.slug.current}/route/${displayShortName}`}>
      <li className={"flex items-center justify-start gap-2 " + className}>
        <span 
          className={routeNumberClassName}
          style={{background: `${routeColor}`, color: `${routeTextColor}`}}
        >
          {displayShortName}
        </span>
        <span className='plex'>
          {routeLongName}
        </span>
      </li>
    </Link>
  )
}

export default RouteHeader;