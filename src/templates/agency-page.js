import React from "react"
import { graphql, Link } from "gatsby";

const Agency = ({ data, pageContext }) => {

  let feedIndexes = {
    8: `ddot`,
    9: `smart`
  }

  let { agencyName, agencyUrl, routes, feedIndex } = data.postgres.agencies[0]

  return (
    <div>
      <Link to={`/`}>Home</Link>
      <h1>Agency: {agencyName}</h1>
      <a href={agencyUrl}>Website</a>
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
      }
    }
  }
`

export default Agency;