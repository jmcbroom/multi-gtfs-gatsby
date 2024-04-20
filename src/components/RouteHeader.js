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
    4: 'w-16',
    5: 'w-20',
  }

  let url = `/${displayShortName.toLowerCase()}`

  if(agency && agency?.slug.current !== 'd2a2'){
    url = `/${agency.slug.current}/route/${displayShortName}`
  }

  if (displayShortName === 'DPM'){
    url = '/people-mover'
  }

  let routeNumberClassName = `font-bold text-center py-2 text-lg bg-white ${widths[displayShortName.length]}`
  return (
    <Link to={url}>
      <li className={"flex items-center justify-start gap-2 " + className}>
        <span 
          className={routeNumberClassName}
          style={{background: `${routeColor}`, color: `${routeTextColor}`}}
        >
          {displayShortName}
        </span>
        <span className='font-semibold'>
          {routeLongName}
        </span>
      </li>
    </Link>
  )
}

export default RouteHeader;