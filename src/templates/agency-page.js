import React from "react"
import { graphql, Link } from "gatsby";
import FeedInfo from "../components/FeedInfo";
import RouteHeader from '../components/RouteHeader';

const Agency = ({ data, pageContext }) => {

  let agency = data.postgres.agencies[0]
  let { agencyName, agencyUrl, routes } = agency

  // let's not display any routes that don't have scheduled trips.
  routes = routes.filter(r => r.trips.totalCount > 0)

  return (
    <div>
      <Link to={`/`}>Home</Link>
      <h1>Agency: {agencyName}</h1>
      <a href={agencyUrl}>Website</a>
      <FeedInfo agency={agency} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {routes.map(r => <RouteHeader key={r.routeId} {...r} />)}
      </div>
    </div>
  )
}

export const query = graphql`
  query AgencyQuery($feedIndex: Int) {
    postgres {
      agencies: agenciesList(condition: {feedIndex: $feedIndex}) {
        agencyName
        agencyUrl
        agencyTimezone
        agencyLang
        agencyPhone
        agencyFareUrl
        agencyEmail
        bikesPolicyUrl
        feedIndex
        agencyId
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
        feedInfo: feedInfoByFeedIndex {
          serviceCalendars: calendarsByFeedIndexList {
            sunday
            thursday
            tuesday
            wednesday
            monday
            friday
            saturday
            serviceId
          }
        }
      }
    }
  }
`

export default Agency;