import { graphql } from "gatsby";
import React from "react";
import AgencyHeader from "../components/AgencyHeader";
import RouteHeader from "../components/RouteHeader";
import { Link } from "gatsby";

/**
 * The home page.
 * @param {*} data: GraphQL query
 */
const IndexPage = ({ data }) => {
  let { agencies } = data.postgres;
  let sanityAgencies = data.allSanityAgency.edges.map((e) => e.node);

  let merged = sanityAgencies.map(sa => {
    let filtered = agencies.filter(ag => ag.feedIndex === sa.currentFeedIndex)[0]
    return {...sa, ...filtered}
  })

  let sanityRoutes = data.allSanityRoute.edges.map((e) => e.node);
  // loop thru agencies
  agencies.forEach(a => {
    // loop thru those agencies' routes
    a.routes.forEach(r => {

      // find the matching sanityRoute
      let matching = sanityRoutes.filter(sr => sr.agency.currentFeedIndex == r.feedIndex && sr.shortName == r.routeShortName)

      // let's override the route attributes with those from Sanity
      if (matching.length == 1) {
        r.routeLongName = matching[0].longName
        r.routeColor = matching[0].routeColor.hex
        r.routeTextColor = matching[0].routeTextColor.hex
      }

    })
  })


  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100">
        {merged.map((a) => (
          <section key={a.feedIndex}>
            <AgencyHeader agency={a} />
            <h3>{a.routes.length} bus routes</h3>
            <ul className="max-h-80 overflow-y-scroll">
              {a.routes
                .sort((a, b) => a.implicitSort - b.implicitSort)
                .map((r) =>
                  r.trips.totalCount > 0 ? (
                    <RouteHeader
                      {...r}
                      slug={a.slug.current}
                      key={`${a.feedIndex}_${r.routeShortName}`}
                    />
                  ) : null
                )}
            </ul>
          </section>
        ))}
        <section>
          <Link to={`/d2a2`}>
            <h3>Detroit-Ann Arbor (D2A2) bus</h3>
          </Link>
          <p>The D2A2 bus travels between Blake Transit Center and Grand Circus Park.</p>
        </section>
        <section>
          <Link to={`/qline`}>
            <h3>QLine</h3>
          </Link>
          <p>The QLine streetcar runs between Congress St and Grand Boulevard along Woodward.</p>
        </section>
        <section>
          <Link to={`/people-mover`}>
            <h3>People Mover</h3>
          </Link>
          <p>The People Mover is not currently operating.</p>
        </section>
      </div>
      <section className="mt-4">
        <h1>Getting other places</h1>
        <ul>
          <li>
            <Link to={`/destinations/toronto`}>Toronto</Link>
          </li>
          <li>
            <Link to={`/destinations/chicago`}>Chicago</Link>
          </li>
        </ul>
      </section>
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
