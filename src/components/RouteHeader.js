import React from 'react';
import {Link} from 'gatsby';
import RouteBadge from './RouteBadge';

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

  let url = `/${displayShortName.toLowerCase()}`

  if(agency && agency?.slug.current !== 'd2a2'){
    url = `/${agency.slug.current}/route/${displayShortName}`
  }

  if (displayShortName === 'DPM'){
    url = '/people-mover'
  }

  let route = {
    displayShortName,
    routeColor,
    routeTextColor,
    agency
  }

  return (
    <Link to={url}>
      <li className={"flex items-center justify-start gap-2 " + className}>
        <RouteBadge route={route} size='large' />
        <span className='font-semibold'>
          {routeLongName}
        </span>
      </li>
    </Link>
  )
}

export default RouteHeader;