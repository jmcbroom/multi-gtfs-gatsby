import { Link, graphql } from "gatsby";
import React from "react";
import AgencySlimHeader from "../components/AgencySlimHeader";
import { createRouteData } from "../util";

import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import _ from "lodash";
import RouteHeader from "../components/RouteHeader";
import RouteSlim from "../components/RouteSlim";

/**
 * The home page.
 * @param {*} data: GraphQL query
 */
const FavoritesPage = ({ data }) => {
  let { agencies } = data.postgres;
  let sanityAgencies = data.allSanityAgency.edges.map((e) => e.node);

  // get the favorite stops
  const favoriteStops = useLiveQuery(() => db.stops.toArray());

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

  return (
    <>
      <div className="my-4 flex items-center justify-normal">
        <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
        <h2 className="ml-2 mb-0 block">
          favorite bus stops
          </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

      {Object.keys(grouped).map((key) => {
        let agency = merged.filter((a) => a.slug.current === key)[0];
                
        return (
          <div>
            <AgencySlimHeader agency={agency} />
            <div className="grid mt-2">
            {grouped[key]
              .sort((a, b) => b.times.length - a.times.length)
              .map((s) => {
                return (
                  <div key={s.id} className="bg-gray-300 dark:bg-zinc-800">
                    <Link
                      className="plex px-2 font-bold text-sm"
                      to={`/${s.agency.agencySlug}/stop/${s[agency.stopIdentifierField]}`}
                      >
                      {s.stopName}
                    </Link>
                    <div className="bg-gray-200 dark:bg-zinc-600 p-2 flex flex-col gap-2">
                      {s.routes.map((r) => {
                        return (<RouteSlim key={r.routeId} {...r} agency={agency} />);
                        })}
                      </div>
                  </div>
                );
              })}
              </div>
          </div>
        );
      })}
      </div>
    </>
  );
};

//   return (
//     <>
//       <div>
//         {favoriteStops && favoriteStops.length > 0 && (
//           <>
//             <div className="flex items-center gap-2 my-4">
//               <FontAwesomeIcon icon={faStar} className="text-yellow-500" />{" "}
//               <h2 className="text-xl font-bold mb-0">
//                 favorite bus stops
//               </h2>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 list-none ml-0">
//               <div>

//               {favoriteStops.sort((a, b) => (b.times.length - a.times.length)).map((s) => {
//                 let agency = merged.filter(
//                   (a) => a.feedIndex === s.agency.feedIndex
//                   )[0];
//                   return (
//                     <div key={s.id}>
//                     <div className="flex items-center justify-between bg-gray-300 dark:bg-zinc-700">
//                       <Link
//                         className="plex text-base px-2 font-semibold"
//                         to={`/${s.agency.agencySlug}/stop/${
//                           s.agency.agencySlug === "ddot" ? s.stopCode : s.stopId
//                         }`}
//                         >
//                         {s.stopName}
//                       </Link>
//                       <AgencySlimHeader agency={agency} />
//                     </div>
//                     {/* <div className="bg-gray-200 dark:bg-zinc-600 p-2 flex flex-col gap-2">
//                       {s.routes.map((r) => {
//                         console.log(r);
//                         return (
//                           <div>
//                           <RouteHeader
//                           key={r.routeId}
//                           {...r}
//                           agency={agency}
//                           className="text-sm"
//                           />

//                           </div>
//                           );
//                         })}
//                       </div> */}
//                   </div>
//                 );
//               })}
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </>
//   );
// };

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
