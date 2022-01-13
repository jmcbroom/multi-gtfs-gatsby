import React from "react"
import { graphql } from "gatsby";
import RouteHeader from '../components/RouteHeader';
import AgencyHeader from '../components/AgencyHeader';

const Agency = ({ data, pageContext }) => {

  let agency = data.postgres.agencies[0]
  let { agencyUrl, routes } = agency

  // let's not display any routes that don't have scheduled trips.
  routes = routes.filter(r => r.trips.totalCount > 0)

  return (
    <div class>
      <AgencyHeader agency={agency} />
      <a href={agencyUrl}>Website</a>
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
        routes: routesByFeedIndexAndAgencyIdList(orderBy: ROUTE_SORT_ORDER_ASC) {
          feedIndex
          routeShortName
          routeLongName
          routeColor
          routeTextColor
          routeSortOrder
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