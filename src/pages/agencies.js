import { graphql } from "gatsby";
import React from "react";
import AgencyHeader from "../components/AgencyHeader";
import AgencySlimHeader from "../components/AgencySlimHeader";
import PortableText from "react-portable-text";
import { createRouteData } from "../util";

/**
 * The home page.
 * @param {*} data: GraphQL query
 */
const AllAgenciesPage = ({ data }) => {
  let { agencies } = data.postgres;
  let sanityAgencies = data.allSanityAgency.edges.map((e) => e.node);

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
  let order = [
    "DDOT",
    "SMART",
    "TheRide",
    "Transit Windsor",
    "D2A2"
  ]

  merged.sort((a, b) => {
    return order.indexOf(a.name) - order.indexOf(b.name)
  })

  return (
    <>
      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-2 md:mb-6 mt-4">
          {merged.map((a) => (
            <div
              className="bg-zinc-100 dark:bg-zinc-900 border-b-2 border-zinc-500 dark:border-zinc-800"
              key={a.feedIndex}
            >
              <AgencySlimHeader agency={a} />
              <div className="px-4 pb-4 md:pb-8 pt-2">
                <AgencyHeader agency={a} />
                {a.description && <PortableText content={a.description} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export const query = graphql`
  {
    indexPage: sanityIndexPage(_id: { eq: "index-page-content" }) {
      indexPageContent: _rawHomepageContent
    }
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

export default AllAgenciesPage;
