import React from "react"
import { graphql, Link } from "gatsby";
import FeedInfo from "../components/FeedInfo";

const Agency = ({ data, pageContext }) => {

  let feedIndexes = {
    8: `ddot`,
    9: `smart`
  }

  let agency = data.postgres.agencies[0]
  let { agencyName, agencyUrl, routes, feedIndex } = agency

  return (
    <div>
      <Link to={`/`}>Home</Link>
      <h1>Agency: {agencyName}</h1>
      <a href={agencyUrl}>Website</a>
      <FeedInfo agency={agency} />
      <ul>
        {routes.map(r => (
          <Link to={`/${feedIndexes[feedIndex]}/route/${r.routeShortName}`}>
            <li>{r.routeShortName} -- {r.routeLongName}</li>
          </Link>
        ))}
      </ul>
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
          routeShortName
          routeLongName
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