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
const IndexPage = ({ data }) => {
  let { agencies } = data.postgres;
  let sanityAgencies = data.allSanityAgency.edges.map((e) => e.node);
  let { indexPageContent } = data.indexPage;

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
        (sr) => sr.agency.currentFeedIndex === r.feedIndex && sr.shortName === r.routeShortName
      );

      // let's override the route attributes with those from Sanity
      if (matching.length === 1) {
        r = createRouteData(r, matching[0])
      }
    });
  });

  return (
    <div className="">
      <PortableText content={indexPageContent} className="my-4 md:my-6 px-2 md:px-0" />
      <h2 className="underline-title">Local bus systems</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-2 md:mb-6">
        {merged.map((a) => (
          <div className="bg-gray-100 border-b-2 border-gray-500" key={a.feedIndex}>
            <AgencySlimHeader agency={a} />
            <div className="px-4 pb-4 md:pb-8 pt-2">
              <AgencyHeader agency={a} />
              {a.description && <PortableText content={a.description} />}
            </div>
          </div>
        ))}
      </div>
    </div>
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
