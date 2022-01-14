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

  let { agencies } = data.postgres

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2">Public transit agencies</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agencies.map(a => (
          <section key={a.feedIndex}>
            <AgencyHeader agency={a} />
            <h3>
              {a.routes.length} bus routes
            </h3>
            <ul className="max-h-80 overflow-y-scroll">
              {a.routes.map(r => r.trips.totalCount > 0 ? <RouteHeader {...r} key={`${a.feedIndex}_${r.routeShortName}`} /> : null)}
            </ul>
          </section>
        ))}
        <section>
          <Link to={`/people-mover`}>
            <h3>People Mover</h3>
          </Link>
          <p>The People Mover is not currently operating.</p>
        </section>
        <section>
          <Link to={`/d2a2`}>
            <h3>Detroit-Ann Arbor (D2A2) bus</h3>
          </Link>
          <p>The D2A2 bus travels between Blake Transit Center and Grand Circus Park.</p>
        </section>
      </div>
      <section className="mt-4">
      <h2>Getting to other cities</h2>
        <ul>
          <li><Link to={`/destinations/toronto`}>Toronto</Link></li>
          <li><Link to={`/destinations/chicago`}>Chicago</Link></li>
        </ul>
      </section>
    </>
  )
}

export const query = graphql`
  {
    postgres {
      agencies: agenciesList(filter: {feedIndex: {greaterThan: 7, lessThan: 12}}) {
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
          trips: tripsByFeedIndexAndRouteId {
            totalCount
          }
        }
      }
    }
  }
`;

export default IndexPage
