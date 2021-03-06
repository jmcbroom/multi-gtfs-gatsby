import React from "react"
import { graphql, Link } from "gatsby";
import RouteHeader from '../components/RouteHeader';
import AgencyHeader from '../components/AgencyHeader';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faPhone } from "@fortawesome/free-solid-svg-icons";
import PortableText from "react-portable-text";

const Agency = ({ data, pageContext }) => {

  let agency = data.postgres.agencies[0]
  let sanityAgency = data.sanity.edges[0].node

  let { content } = sanityAgency

  console.log(content)

  let { agencyUrl, agencyPhone, routes } = agency

  // let's not display any routes that don't have scheduled trips.
  routes = routes.filter(r => r.trips.totalCount > 0).sort((a, b) => a.implicitSort - b.implicitSort)

  return (
    <div>
      <AgencyHeader agency={agency} />
      <PortableText content={content} />
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {routes.map(r => <RouteHeader key={r.routeId} {...r} />)}
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
    sanity: allSanityAgency(filter: {slug: {current: {eq: $agencySlug}}}) {
      edges {
        node {
          content: _rawContent
        }
      }
    }
  }
`

export default Agency;