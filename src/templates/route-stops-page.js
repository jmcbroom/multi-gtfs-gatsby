import { graphql } from "gatsby"
import React, { useState } from "react"
import { getServiceDays, getTripsByServiceAndDirection, getHeadsignsByDirectionId } from "../util"
import DirectionPicker from "../components/DirectionPicker"
import RouteHeader from "../components/RouteHeader"
import AgencyHeader from "../components/AgencyHeader"
import StopListItem from "../components/StopListItem"

const RouteStops = ({ data, pageContext }) => {

  let route = data.postgres.routes[0]

  let { trips, routeColor, feedIndex } = route

  let { serviceCalendars } = data.postgres.agencies[0].feedInfo

  let serviceDays = getServiceDays(serviceCalendars)
  let headsignsByDirectionId = getHeadsignsByDirectionId(trips)
  let tripsByServiceAndDirection = getTripsByServiceAndDirection(trips, serviceDays, headsignsByDirectionId)

  const [direction, setDirection] = useState(Object.keys(headsignsByDirectionId)[0])

  let times = tripsByServiceAndDirection.weekday[direction][0].stopTimes

  return (
    <div>
      <AgencyHeader agency={data.postgres.agencies[0]} />
      <RouteHeader {...route} />
      <div className="flex flex-col w-full md:flex-row items-center justify-start gap-2 my-2">
        <DirectionPicker directions={headsignsByDirectionId} {...{ direction, setDirection }} />
      </div>
      <section>
      {times.map((stopTime, i) => (
        <StopListItem key={stopTime.stop.stopCode || stopTime.stop.stopId} {...{ stopTime, feedIndex, routeColor }} />
      ))}
    </section>
      {/* <RouteStopsList /> */}
    </div>
  )
}

export const query = graphql`
  query RouteStopQuery($feedIndex: Int, $routeNo: String) {
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
        trips: tripsByFeedIndexAndRouteIdList {
          serviceId
          directionId
          tripId
          tripHeadsign
          stopTimes: stopTimesByFeedIndexAndTripIdList(
            orderBy: STOP_SEQUENCE_ASC
          ) {
            timepoint
            stop: stopByFeedIndexAndStopId {
              stopName
              stopId
              stopCode
            }
            arrivalTime {
              hours
              minutes
              seconds
            }
          }
        }
      }
      agencies: agenciesList(condition: {feedIndex: $feedIndex}) {
        feedIndex
        agencyName
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

export default RouteStops;