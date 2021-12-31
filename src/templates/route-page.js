import { graphql, Link } from "gatsby"
import React from "react"

const Route = ({ data, pageContext }) => {

  console.log(data, pageContext)

  let { routeShortName, routeLongName, routeColor, feedIndex } = data.postgres.routes[0]

  let style = {
    borderBottomStyle: `solid`, 
    borderBottomWidth: 3, 
    borderBottomColor: `#${routeColor}`
  }

  let feedIndexes = {
    8: `ddot`,
    9: `smart`
  }

  return (
    <div>
      <Link to={`/`}>Home</Link>
      <Link to={`/${feedIndexes[feedIndex]}/route/${routeShortName}`}>
        <h1 style={style}>
          {routeShortName} -- {routeLongName}
        </h1>
      </Link>
    </div>
  )
}

export const query = graphql`
  query RouteQuery($feedIndex: Int, $routeNo: String) {
    postgres {
      routes: routesList(condition: {feedIndex: $feedIndex, routeShortName: $routeNo}) {
        agencyId
        routeShortName
        routeLongName
        routeDesc
        routeType
        routeUrl
        routeColor
        routeTextColor
        routeSortOrder
        feedIndex
      }
    }
  }
`

export default Route;