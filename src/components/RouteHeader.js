import React from 'react';
import {Link} from 'gatsby';
import RouteBadge from './RouteBadge';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

const addFavoriteRoute = (route) => {
  db.routes.add(route);
};

const removeFavoriteRoute = (routeToRemove, favoriteRoutes) => {
  let routeIdsToRemove = favoriteRoutes
    .filter(
      (route) =>
        route.routeShortName === routeToRemove.routeShortName &&
        route.agency.agencySlug === routeToRemove.agency.agencySlug
    )
    .map((r) => r.id);
  routeIdsToRemove.forEach((id) => {
    db.routes.delete(id);
  });
};

/**
 * Displays the number badge and name of a route.
 * Pass a spread `route` GraphQL object with the following parameters:
 * @param {Number} feedIndex 
 * @param {String} shortName 
 * @param {String} longName 
 * @param {Number} routeColor 
 * @param {Number} routeTextColor 
 */
const RouteHeader = ({ 
  routeShortName, 
  displayShortName, 
  routeLongName, 
  routeColor='#000', 
  routeTextColor='#fff', 
  agency, 
  className,
  showFavorite = false,
  feedIndex 
}) => {
  const favoriteRoutes = useLiveQuery(() => db.routes.toArray());

  let url = `/${displayShortName.toLowerCase()}`

  if(agency && agency?.slug.current !== 'd2a2'){
    url = `/${agency.slug.current}/route/${displayShortName}`
  }

  if (displayShortName === 'DPM'){
    url = '/people-mover'
  }

  let route = {
    displayShortName,
    routeShortName,
    routeLongName,
    routeColor,
    routeTextColor,
    feedIndex,
    agency
  }

  // Create indexed route for favorites
  let indexedRoute = {
    routeShortName,
    displayShortName,
    routeLongName,
    routeColor,
    routeTextColor,
    feedIndex,
    agency: {
      agencySlug: agency?.slug?.current,
      agencyName: agency?.name,
      feedIndex: agency?.currentFeedIndex || feedIndex,
    }
  };

  let isFavoriteRoute = favoriteRoutes?.filter(
    (route) =>
      route.routeShortName === routeShortName &&
      route.agency?.agencySlug === agency?.slug?.current
  ).length > 0;

  if (showFavorite) {
    return (
      <div className="mb-2 bg-gray-200 dark:bg-zinc-900 flex items-center justify-between">
        <Link to={url} className="flex items-center justify-start gap-2 flex-grow py-3 px-4">
          <RouteBadge route={route} size='large' />
          <span className='font-semibold'>
            {routeLongName}
          </span>
        </Link>
        <div className="flex items-center justify-between gap-2 px-4">
          <FontAwesomeIcon
            icon={faStar}
            size="lg"
            className={
              isFavoriteRoute
                ? "text-yellow-500 dark:text-yellow-600 cursor-pointer"
                : "text-gray-400 dark:text-zinc-600 cursor-pointer"
            }
            onClick={() => {
              if (isFavoriteRoute === false) {
                addFavoriteRoute(indexedRoute);
              } else {
                removeFavoriteRoute(indexedRoute, favoriteRoutes);
              }
            }}
          />
        </div>
      </div>
    );
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