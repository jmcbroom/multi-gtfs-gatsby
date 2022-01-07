import React from "react"
import { graphql, Link } from "gatsby";

// markup
const IndexPage = ({ data }) => {

  let { agencies } = data.postgres

  let feedIndexes = {
    8: `ddot`,
    9: `smart`
  }

  return (
    <main>
      <h1>All transit</h1>
      {agencies.map(a => (
        <>
          <Link to={`/${feedIndexes[a.feedIndex]}/`}>
            <h2>
              {a.agencyName}
            </h2>
          </Link>
          <ul>
            {a.routes.map(r => (
              <Link to={`/${feedIndexes[a.feedIndex]}/route/${r.routeShortName}`}>
                <li>{r.routeShortName} -- {r.routeLongName}</li>
              </Link>
            ))}
          </ul>
        </>
      ))}
    </main>
  )
}

export const query = graphql`
  {
    postgres {
      agencies: agenciesList(filter: {feedIndex: {greaterThan: 7}}) {
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
          routeShortName
          routeLongName
        }
      }
    }
  }
`;

export default IndexPage
