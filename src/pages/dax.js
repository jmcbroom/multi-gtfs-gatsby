import { graphql } from "gatsby";
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import RouteHeader from "../components/RouteHeader";
import RouteTimeTable from "../components/RouteTimeTable";
import ServicePicker from "../components/ServicePicker";

import PortableText from "react-portable-text";
import "../styles/tabs.css";
import {
  createAgencyData,
  createRouteData,
  dayOfWeek,
  getHeadsignsByDirectionId,
  getServiceDays,
  getTripsByServiceAndDirection,
  getTripsByServiceDay
} from "../util";

const components = {
  marks: {
    link: ({value, children}) => {
      // Read https://css-tricks.com/use-target_blank/
      const { blank, href } = value
      return blank ?
        <a href={href} target="_blank" rel="noreferrer">{children} something</a>
        : <a href={href} target="_blank" rel="noreferrer">{children} something2</a>
    }
  }
}

const Dax = ({ data }) => {
  let gtfsAgency = data.postgres.agencies[0];
  let sanityAgency = data.agency;
  let agencyData = createAgencyData(gtfsAgency, sanityAgency);

  let gtfsRoute = data.postgres.routes[0];
  let sanityRoute = data.route;

  if (sanityRoute) {
    gtfsRoute.routeLongName = sanityRoute.longName;
    gtfsRoute.routeColor = sanityRoute.color.hex;
    gtfsRoute.routeTextColor = sanityRoute.textColor.hex;
  }

  let { trips, longTrips } = gtfsRoute;
  let { serviceCalendars } = agencyData.feedInfo;

  sanityRoute.directions.forEach((dir, idx) => {
    // get timepoints for each direction
    let timepoints = dir.directionTimepoints;
    // set timepoint = 1 for each stopTime that is a timepoint
    trips.forEach((trip) => {
      trip.stopTimes.forEach((st, idx) => {
          st.timepoint = 1;
      });
    });

    longTrips.forEach((trip) => {
      trip.stopTimes.forEach((st, idx) => {
        st.timepoint = 1;
      });
    });
  });

  let serviceDays = getServiceDays(
    serviceCalendars.filter((sc) =>
      data.agency.serviceIds.includes(sc.serviceId)
    )
  );
  serviceDays = {
    'daily': 'c_70310_b_82262_d_127'
  }

  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays);

  delete tripsByServiceDay['weekday']
  delete tripsByServiceDay['saturday']
  delete tripsByServiceDay['sunday']

  let headsignsByDirectionId = getHeadsignsByDirectionId(trips, sanityRoute);
  let tripsByServiceAndDirection = getTripsByServiceAndDirection(
    trips,
    serviceDays,
    headsignsByDirectionId
  );

  if (sanityRoute) {
    sanityRoute.directions.forEach((dir, idx) => {
      if (dir.directionHeadsign) {
        headsignsByDirectionId[dir.directionId][0] = dir.directionHeadsign;
      }
    });
    sanityRoute.mapPriority = 2;
  }

  let routeData = createRouteData(gtfsRoute, sanityRoute);

  let defaultService = "daily";

  const [service, setService] = useState(defaultService);

  return (
    <div>
      <Helmet>
        <title>{`${agencyData.name} ${routeData.displayShortName}: ${routeData.routeLongName}`}</title>
        <meta property="og:url" content={`https://transit.det.city/dax/`} />
        <meta property="og:type" content={`website`} />
        <meta
          property="og:title"
          content={`Detroit Air Xpress`}
        />
        <meta
          property="og:description"
          content={`Information about the bus service from Detroit Metro airport (DTW), to downtown Detroit. Runs 16 trips per day, every day of the year.`}
        />
      </Helmet>

      <div className="bg-gray-300 dark:bg-zinc-900 mt-4">
        <RouteHeader {...gtfsRoute} agency={null} />
      </div>

      <div id="schedule" className="grayHeader">Schedule</div>
      <div className="bg-gray-100 dark:bg-zinc-700 p-4">
        <ServicePicker
          services={tripsByServiceDay}
          {...{ service, setService }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-4 md:gap-8 mb-4">
        <div>
          <div className="grayHeader -mb-6 z-20 block relative">
            Eastbound to Detroit
          </div>
          <RouteTimeTable
            trips={tripsByServiceAndDirection}
            route={gtfsRoute}
            agency={agencyData}
            service={service}
            direction={0}
          />
        </div>
        <div>
          <div className="grayHeader -mb-6 z-20 block relative text-lg">
            Westbound to DTW
          </div>
          <RouteTimeTable
            trips={tripsByServiceAndDirection}
            route={gtfsRoute}
            agency={agencyData}
            service={service}
            direction={1}
          />
        </div>
      </div>
      <PortableText
        className="mt-2 mb-4 sanityContent"
        content={sanityRoute.description}
        components={components}
      />
    </div>
  );
};

export const query = graphql`
  query DAXQuery {
    route: sanityRoute(
      shortName: { eq: "DAX" }
      agency: { slug: { current: { eq: "d2a2" } } }
    ) {
      color {
        hex
      }
      longName
      routeType
      shortName
      displayShortName
      slug {
        current
      }
      textColor {
        hex
      }
      mapPriority
      description: _rawContent
      directions: extRouteDirections {
        directionHeadsign
        directionDescription
        directionId
        directionTimepoints
        directionShape
      }
    }
    agency: sanityAgency(slug: { current: { eq: "d2a2" } }) {
      name
      color {
        hex
      }
      textColor {
        hex
      }
      currentFeedIndex
      realTimeEnabled
      stopIdentifierField
      serviceIds
      description: _rawDescription
      slug {
        current
      }
    }
    postgres {
      routes: routesList(condition: { feedIndex: 36, routeShortName: "DAX" }) {
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
        trips: tripsByFeedIndexAndRouteIdList(
          filter: {
            serviceId: { in: ["c_70310_b_82262_d_127"] }
          }
        ) {
          serviceId
          directionId
          tripId
          tripHeadsign
          stopTimes: stopTimesByFeedIndexAndTripIdList(
            orderBy: STOP_SEQUENCE_ASC
          ) {
            arrivalTime {
              hours
              minutes
              seconds
            }
            stop: stopByFeedIndexAndStopId {
              stopCode
              stopId
              stopName
              stopLon
              stopLat
            }
            timepoint
          }
        }
        longTrips: longestTripsList {
          tripId
          stopTimes: stopTimesByFeedIndexAndTripIdList(
            orderBy: STOP_SEQUENCE_ASC
          ) {
            stopId
            stop: stopByFeedIndexAndStopId {
              stopCode
              stopId
              stopName
              stopLon
              stopLat
            }
            arrivalTime {
              hours
              minutes
              seconds
            }
            timepoint
            stopSequence
          }
          serviceId
          directionId
          direction
        }
      }
      agencies: agenciesList(condition: { feedIndex: 36 }) {
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
`;

export default Dax;
