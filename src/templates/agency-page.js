import React from "react"
import { graphql, Link } from "gatsby";
import RouteHeader from '../components/RouteHeader';
import AgencyHeader from '../components/AgencyHeader';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faPhone } from "@fortawesome/free-solid-svg-icons";
import PortableText from "react-portable-text";
import {createAgencyData} from '../util'

const Agency = ({ data, pageContext }) => {

  let gtfsAgency = data.postgres.agencies[0]
  let sanityAgency = data.allSanityAgency.edges[0].node
  console.log(sanityAgency)
  let agencyData = createAgencyData(gtfsAgency, sanityAgency)
  console.log(agencyData)

  let { agencyUrl, agencyPhone, routes, description } = agencyData

  // let's not display any routes that don't have scheduled trips.
  let sanityRoutes = data.allSanityRoute.edges.map(e => e.node)
  routes = routes.filter(r => r.trips.totalCount > 0).sort((a, b) => a.implicitSort - b.implicitSort)

  routes.forEach(r => {

    // find the matching sanityRoute
    let matching = sanityRoutes.filter(sr => sr.agency.currentFeedIndex == r.feedIndex && sr.shortName == r.routeShortName)

    // let's override the route attributes with those from Sanity
    if (matching.length == 1) {
      r.routeLongName = matching[0].longName
      r.routeColor = matching[0].routeColor.hex
      r.routeTextColor = matching[0].routeTextColor.hex
    }

  })

  return (
    <div>
      <AgencyHeader agency={agencyData} />
      <PortableText content={description} />
      <section className="flex flex-col sm:flex-row items-center justify-start gap-4 mb-4">
        <div className="flex items-center justify-between">
          <Link to={agencyUrl}>
            <FontAwesomeIcon icon={faLink} />
            <span className="ml-2">Website</span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <a href={`tel:+1${agencyPhone}`}>
            <FontAwesomeIcon icon={faPhone} />
            <span className="ml-2">Phone: {agencyPhone}</span>
          </a>
        </div>
      </section>
      <h3>Fare information</h3>
      <p>...</p>
      <h3>Bus routes</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {routes.map(r => <RouteHeader key={r.routeId} {...r} agency={agencyData} />)}
      </div>
    </div>
  )
}

export const query = graphql`
  query AgencyQuery($feedIndex: Int, $agencySlug: String) {
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
          implicitSort
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
    allSanityRoute(filter: {agency: {slug: {current: {eq: $agencySlug}}}}) {
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
    allSanityAgency(filter: {slug: {current: {eq: $agencySlug}}}) {
      edges {
        node {
          name
          currentFeedIndex
          slug {
            current
          }
          description: _rawDescription
        }
      }
    }
  }
`

export default Agency;