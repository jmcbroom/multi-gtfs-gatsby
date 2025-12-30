import { graphql } from "gatsby";
import React from "react";
import AgencySlimHeader from "../components/AgencySlimHeader";
import PageHeader from "../components/PageHeader";
import { createRouteData } from "../util";

import { faStar } from "@fortawesome/free-solid-svg-icons";
import { useLiveQuery } from "dexie-react-hooks";
import _ from "lodash";
import StopCard from "../components/StopCard";
import RouteCard from "../components/RouteCard";
import BikeshareCard from "../components/Bikeshare/BikeshareCard";
import { db } from "../db";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
/**
 * The favorites page.
 * @param {*} data: GraphQL query
 */
const FavoritesPage = ({ data }) => {
  let { agencies } = data.postgres;

  let { sanityAgencies } = useSanityAgencies();
  sanityAgencies = sanityAgencies.edges.map((e) => e.node);
  let { sanityRoutes } = useSanityRoutes();
  sanityRoutes = sanityRoutes.edges.map((e) => e.node);

  // get the favorite stops and routes
  const favoriteStops = useLiveQuery(() => db.stops.toArray());
  const favoriteRoutes = useLiveQuery(() => db.routes.toArray());
  const favoriteBikeshareStops = useLiveQuery(() => db.bikeshare.toArray());

  let merged = sanityAgencies.map((sa) => {
    let filtered = agencies.filter(
      (ag) => ag.feedIndex === sa.currentFeedIndex
    )[0];
    return { ...sa, ...filtered };
  });

  // loop thru agencies
  merged.forEach((a) => {
    // loop thru those agencies' routes
    a.routes.forEach((r) => {
      r.agencyData = a;

      // find the matching sanityRoute
      let matching = sanityRoutes.filter(
        (sr) =>
          sr.agency.currentFeedIndex === r.feedIndex &&
          sr.shortName === r.routeShortName
      );

      // let's override the route attributes with those from Sanity
      if (matching.length === 1) {
        r = createRouteData(r, matching[0]);
      }
    });
  });

  // sort agencies by their `name` property:
  let order = ["ddot", "smart", "the-ride", "transit-windsor", "d2a2"];
  merged.sort((a, b) => {
    return order.indexOf(a.slug.current) - order.indexOf(b.slug.current);
  });

  let groupedStops = _.groupBy(favoriteStops, "agency.agencySlug");
  let groupedRoutes = _.groupBy(favoriteRoutes, "agency.agencySlug");

  let bikeshareGrouped = _.groupBy(
    favoriteBikeshareStops,
    "agency.slug.current"
  );

  // Get all agencies that have either favorite stops or routes
  let allFavoriteAgencies = new Set([
    ...Object.keys(groupedStops),
    ...Object.keys(groupedRoutes),
  ]);

  return (
    <>
      <PageHeader title="Favorite stops & routes" icon={faStar} />
      <p className="text-sm m-0 px-4 text-gray-700 dark:text-zinc-400 mb-4">
        Add stops and routes to your favorites by clicking the star icon on stop and route pages.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

        {Array.from(allFavoriteAgencies).map((agencySlug) => {
          let agency = merged.filter((a) => a.slug.current === agencySlug)[0];
          
          if (!agency) return null;
          
          let hasStops = groupedStops[agencySlug]?.length > 0;
          let hasRoutes = groupedRoutes[agencySlug]?.length > 0;
          
          if (!hasStops && !hasRoutes) return null;

          return (
            <div key={agencySlug}>
              <AgencySlimHeader agency={agency} />
              <div className="grid mt-0">
                {/* Show favorite routes first */}
                {hasRoutes && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 dark:text-zinc-400 px-2 py-1 bg-gray-50 dark:bg-zinc-800">
                      Favorite Routes
                    </div>
                    {groupedRoutes[agencySlug].map((route) => (
                      <RouteCard route={route} agency={agency} key={route.id} />
                    ))}
                  </div>
                )}
                
                {/* Show favorite stops */}
                {hasStops && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 dark:text-zinc-400 px-2 py-1 bg-gray-50 dark:bg-zinc-800">
                      Favorite Stops
                    </div>
                    {groupedStops[agencySlug].map((stop) => (
                      <StopCard stop={stop} agency={agency} key={stop.id} routeDirections={stop.tripDirections} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {Object.keys(bikeshareGrouped).map((key) => {
          return (
            <div key={key}>
              <AgencySlimHeader agency={bikeshareGrouped[key][0].agency} />
              <div>
                <div className="text-sm font-semibold text-gray-600 dark:text-zinc-400 px-2 py-1 bg-gray-50 dark:bg-zinc-800">
                  Favorite Bike Stations
                </div>
                {bikeshareGrouped[key].map((station) => (
                  <BikeshareCard
                    station={station}
                    agency={station.agency}
                    key={station.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export const query = graphql`
  {
    postgres {
      agencies: agenciesList {
        agencyName
        agencyUrl
        agencyTimezone
        agencyLang
        agencyPhone
        agencyFareUrl
        agencyEmail
        bikesPolicyUrl
        feedIndex
        routes: routesByFeedIndexAndAgencyIdList(
          orderBy: ROUTE_SORT_ORDER_ASC
        ) {
          feedIndex
          routeShortName
          routeLongName
          routeColor
          routeTextColor
          implicitSort
          trips: tripsByFeedIndexAndRouteId {
            totalCount
          }
        }
      }
    }
  }
`;

export default FavoritesPage;
