import { graphql } from "gatsby";
import React from "react";
import AgencyHeader from "../components/AgencyHeader";
import RouteHeader from "../components/RouteHeader";

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
          <section className="bg-gray-100 p-4" key={a.feedIndex}>
            <AgencyHeader agency={a} />
            <h3 className="font-semibold text-gray-600 my-1">
              {a.routes.length} bus routes
            </h3>
            <ul className="max-h-80 overflow-y-scroll">
              {a.routes.map(r => r.trips.totalCount > 0 ? <RouteHeader {...r} key={`${a.feedIndex}_${r.routeShortName}`} /> : null)}
            </ul>
          </section>
        ))}
      </div>
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
        routes: routesByFeedIndexAndAgencyIdList {
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
