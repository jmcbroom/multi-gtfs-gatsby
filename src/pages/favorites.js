import { graphql, Link } from "gatsby";
import React from "react";
import AgencySlimHeader from "../components/AgencySlimHeader";
import PageHeader from "../components/PageHeader";
import { createRouteData } from "../util";
import { faStar, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLiveQuery } from "dexie-react-hooks";
import { groupBy } from "lodash-es";
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
  const favoriteStops = useLiveQuery(() => db?.stops?.toArray());
  const favoriteRoutes = useLiveQuery(() => db?.routes?.toArray());
  const favoriteBikeshareStops = useLiveQuery(() => db?.bikeshare?.toArray());

  // Check if user has no favorites
  const hasNoFavorites = favoriteStops !== undefined &&
    !favoriteStops?.length &&
    !favoriteRoutes?.length &&
    !favoriteBikeshareStops?.length;

  let merged = sanityAgencies.map((sa) => {
    let filtered = agencies.filter(
      (ag) => ag.feedIndex === sa.currentFeedIndex
    )[0];
    return { ...sa, ...filtered };
  });

  // loop thru agencies
  merged.forEach((a) => {
    // loop thru those agencies' routes (if they exist)
    if (!a.routes) return;
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

  let groupedStops = groupBy(favoriteStops, "agency.agencySlug");
  let groupedRoutes = groupBy(favoriteRoutes, "agency.agencySlug");

  let bikeshareGrouped = groupBy(
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

      {/* Show link to stops-near-me when user has no favorites */}
      {hasNoFavorites && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-zinc-400 mb-3">
            You don't have any favorites yet.
          </p>
          <Link
            to="/stops-near-me"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FontAwesomeIcon icon={faLocationDot} />
            Find stops near me
          </Link>
        </div>
      )}

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
                    <div className="grid grid-cols-1 gap-2 p-2">
                      {groupedRoutes[agencySlug].map((route) => (
                        <RouteCard
                          key={route.id}
                          route={route}
                          agency={agency}
                          variant="card"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Show favorite stops */}
                {hasStops && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 dark:text-zinc-400 px-2 py-1 bg-gray-50 dark:bg-zinc-800">
                      Favorite Stops
                    </div>
                    <div className="grid grid-cols-1 gap-2 p-2">
                      {groupedStops[agencySlug].map((stop) => (
                        <StopCard
                          key={stop.id}
                          stop={stop}
                          agency={agency}
                          routeDirections={stop.tripDirections}
                          variant="card"
                          agencyColor={agency?.color?.hex}
                          isFavorited={true}
                          onToggleFavorite={() => db?.stops?.delete(stop.id)}
                        />
                      ))}
                    </div>
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
                <div className="grid grid-cols-1 gap-2 p-2">
                  {bikeshareGrouped[key].map((station) => (
                    <BikeshareCard
                      key={station.id}
                      station={station}
                      agency={station.agency}
                      variant="card"
                    />
                  ))}
                </div>
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

export const Head = () => {
  const title = "Favorites | transit.det.city";
  const description = "Your saved stops and routes for quick access.";
  const url = "https://transit.det.city/favorites";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href={url} />
    </>
  );
};
