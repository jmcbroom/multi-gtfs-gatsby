import { graphql } from "gatsby";
import React from "react";
import AgencyHeader from "../components/AgencyHeader";
import RouteHeader from "../components/RouteHeader";
import { Link } from "gatsby";
import PortableText from "react-portable-text";

/**
 * The home page.
 * @param {*} data: GraphQL query
 */
const IndexPage = ({ data }) => {
  let { agencies } = data.postgres;
  let sanityAgencies = data.allSanityAgency.edges.map((e) => e.node);

  let merged = sanityAgencies.map((sa) => {
    let filtered = agencies.filter((ag) => ag.feedIndex === sa.currentFeedIndex)[0];
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
        (sr) => sr.agency.currentFeedIndex == r.feedIndex && sr.shortName == r.routeShortName
      );

      // let's override the route attributes with those from Sanity
      if (matching.length == 1) {
        r.routeLongName = matching[0].longName;
        r.routeColor = matching[0].routeColor.hex;
        r.routeTextColor = matching[0].routeTextColor.hex;
      }
    });
  });

  console.log(merged)
  return (
    <>
      <h2>Local bus systems</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 mb-2 md:mb-6">
        {merged.map((a) => (
          <section className="bg-gray-100" key={a.feedIndex}>
            <AgencyHeader agency={a} />
            {a.description && <PortableText content={a.description} />}
            {/* <ul className="max-h-80 overflow-y-scroll">
              {a.routes
                .sort((a, b) => a.implicitSort - b.implicitSort)
                .map((r) =>
                  r.trips.totalCount > 0 ? (
                    <RouteHeader
                      {...r}
                      agency={r.agencyData}
                      key={`${a.feedIndex}_${r.routeShortName}`}
                    />
                  ) : null
                )}
            </ul> */}
          </section>
        ))}
      </div>
      <h2>
        Other transportation services
      </h2>
    </>
  );
};

export const query = graphql`
  {
    allSanityAgency {
      edges {
        node {
          currentFeedIndex
          name
          fullName
          description: _rawDescription
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
        routes: routesByFeedIndexAndAgencyIdList(orderBy: ROUTE_SORT_ORDER_ASC) {
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

export default IndexPage;
