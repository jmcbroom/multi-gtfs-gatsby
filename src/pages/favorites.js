import { graphql } from "gatsby";
import React from "react";
import AgencySlimHeader from "../components/AgencySlimHeader";
import { createRouteData } from "../util";

import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLiveQuery } from "dexie-react-hooks";
import _ from "lodash";
import StopCard from "../components/StopCard";
import BikeshareCard from "../components/Bikeshare/BikeshareCard";
import { db } from "../db";
/**
 * The home page.
 * @param {*} data: GraphQL query
 */
const FavoritesPage = ({ data }) => {
  let { agencies } = data.postgres;
  let sanityAgencies = data.allSanityAgency.edges.map((e) => e.node);

  // get the favorite stops
  const favoriteStops = useLiveQuery(() => db.stops.toArray());
  const favoriteBikeshareStops = useLiveQuery(() => db.bikeshare.toArray());

  let merged = sanityAgencies.map((sa) => {
    let filtered = agencies.filter(
      (ag) => ag.feedIndex === sa.currentFeedIndex
    )[0];
    return { ...sa, ...filtered };
  });

  let sanityRoutes = data.allSanityRoute.edges.map((e) => e.node);
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

  let grouped = _.groupBy(favoriteStops, "agency.agencySlug");

  let bikeshareGrouped = _.groupBy(
    favoriteBikeshareStops,
    "agency.slug.current"
  );

  return (
    <>
      <div className="my-4 flex items-center justify-normal">
        <FontAwesomeIcon
          icon={faStar}
          className="text-yellow-500 ml-2 md:ml-0"
        />
        <h2 className="ml-2 mb-0 block">favorite stops</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {Object.keys(grouped).map((key) => {
          let agency = merged.filter((a) => a.slug.current === key)[0];
          return (
            <div key={key}>
              <AgencySlimHeader agency={agency} />
              <div className="grid mt-0">
                {grouped[key]
                  .sort((a, b) => b.times.length - a.times.length)
                  .map((stop) => (
                    <StopCard stop={stop} agency={agency} key={stop.stopId} />
                  ))}
              </div>
            </div>
          );
        })}
        {Object.keys(bikeshareGrouped).map((key) => {
          return (
            <div key={key}>
              <AgencySlimHeader agency={bikeshareGrouped[key][0].agency} />
              <div>
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
    allSanityAgency(sort: { fields: name }) {
      edges {
        node {
          currentFeedIndex
          name
          fullName
          color {
            hex
          }
          textColor {
            hex
          }
          description: _rawDescription
          stopIdentifierField
          slug {
            current
          }
        }
      }
    }
    allSanityRoute {
      edges {
        node {
          longName
          shortName
          routeColor: color {
            hex
          }
          routeTextColor: textColor {
            hex
          }
          agency {
            currentFeedIndex
            slug {
              current
            }
          }
        }
      }
    }
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
