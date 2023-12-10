import { graphql } from "gatsby";
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import PortableText from "react-portable-text";
import RouteHeader from "../components/RouteHeader";
import RouteTimepoints from "../components/RouteTimepoints";
import RouteMap from "../components/RouteMap";
import "../styles/tabs.css";
import {
  createAgencyData,
  createRouteData,
  createRouteFc,
  createStopsFc,
  dayOfWeek,
  getHeadsignsByDirectionId,
  getServiceDays,
  getTripsByServiceAndDirection,
  getTripsByServiceDay
} from "../util";

const PeopleMover = ({ data }) => {
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
      trip.stopTimes[0].timepoint = 1;
      trip.stopTimes.forEach((st, idx) => {
        st.timepoint = 1;
      });
      trip.stopTimes[trip.stopTimes.length - 1].timepoint = 1;
      // remove "Southbound/Northbound" from stop names
      trip.stopTimes.forEach((st) => {
        if (st.stop.stopName.includes("Southbound")) {
          st.stop.stopName = st.stop.stopName
            .replace(" - Southbound", "")
            .trim();
        }
        if (st.stop.stopName.includes("Northbound")) {
          st.stop.stopName = st.stop.stopName
            .replace(" - Northbound", "")
            .trim();
        }
        st.stop.stopName = st.stop.stopName.replace("St", "").trim();
        st.stop.stopName = st.stop.stopName.replace("Ave", "").trim();
      });
    });

    // same for longTrips
    longTrips.forEach((trip) => {
      trip.stopTimes[0].timepoint = 1;
      trip.stopTimes.forEach((st, idx) => {
        st.timepoint = 1;
      });
      trip.stopTimes[trip.stopTimes.length - 1].timepoint = 1;
      // remove "Southbound/Northbound" from stop names
      trip.stopTimes.forEach((st) => {
        if (st.stop.stopName.includes("Southbound")) {
          st.stop.stopName = st.stop.stopName
            .replace(" - Southbound", "")
            .trim();
        }
        if (st.stop.stopName.includes("Northbound")) {
          st.stop.stopName = st.stop.stopName
            .replace(" - Northbound", "")
            .trim();
        }
        st.stop.stopName = st.stop.stopName.replace("St", "").trim();
        st.stop.stopName = st.stop.stopName.replace("Ave", "").trim();
      });
    });
  });

  let serviceDays = getServiceDays(
    serviceCalendars.filter((sc) =>
      data.agency.serviceIds.includes(sc.serviceId)
    )
  );
  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays);
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

  tripsByServiceDay = {
    weekday: tripsByServiceDay.weekday,
    weekend: tripsByServiceDay.saturday,
  };
  tripsByServiceAndDirection = {
    weekday: tripsByServiceAndDirection.weekday,
    weekend: tripsByServiceAndDirection.saturday,
  };

  let defaultService = "weekday";

  if (dayOfWeek() === "sunday" || dayOfWeek() === "saturday") {
    defaultService = "weekend";
  }

  const [service, setService] = useState(defaultService);

  return (
    <div>
      <Helmet>
        <title>{`${agencyData.name} ${routeData.displayShortName}: ${routeData.routeLongName}`}</title>
        <meta property="og:url" content={`https://transit.det.city/qline/`} />
        <meta property="og:type" content={`website`} />
        <meta
          property="og:title"
          content={`${agencyData.name} bus route: ${routeData.displayShortName} ${routeData.routeLongName}`}
        />
        <meta
          property="og:description"
          content={`${agencyData.name} bus route ${routeData.displayShortName} ${routeData.routeLongName}`}
        />
      </Helmet>

      <div className="bg-gray-300 dark:bg-zinc-900 mt-4">
        <RouteHeader {...gtfsRoute} agency={null} />
      </div>

      <PortableText
        className="prose prose-lg dark:prose-dark p-2"
        content={sanityAgency.description}
      />

      <RouteMap
        routeFc={createRouteFc(sanityRoute, gtfsRoute)}
        stopsFc={createStopsFc(sanityRoute, tripsByServiceAndDirection)}
        timepointsFc={createStopsFc(
          sanityRoute,
          tripsByServiceAndDirection,
          true
        )}
        vehicleFc={null}
        agency={agencyData}
        trackedBus={null}
        clickStops={false}
        mapHeight={450}
        mapBearing={-30}
        mapPadding={15}
      />

      <div className="grid grid-cols-1 md:grid-cols-2">
      <div>

      <h4 className="underline-title grayHeader mt-4">
        Where does the People Mover stop?
      </h4>
      <p className="py-2">
        The People Mover travels in a counterclockwise loop around downtown Detroit.
      </p>
      <p className="py-2">
        Trains arrive at stops every 5 (minutes).
      </p>
        <PortableText
          content={sanityRoute.description}
          />
      </div>
      <div>

      <div className="p-4">
      <RouteTimepoints
        agency={agencyData}
        route={routeData} 
        trips={tripsByServiceAndDirection}
        headsigns={headsignsByDirectionId}
        link={false}
        />
        </div>
        </div>
        </div>
    </div>
  );
};

export const query = graphql`
  query PeopleMoverQuery {
    route: sanityRoute(
      shortName: { eq: "DPM" }
      agency: { slug: { current: { eq: "people-mover" } } }
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
    agency: sanityAgency(slug: { current: { eq: "people-mover" } }) {
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
      routes: routesList(
        condition: { feedIndex: 32, routeShortName: "DPM" }
      ) {
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
            serviceId: { in: ["friday", "saturday", "sunday", "weekday"] }
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
      agencies: agenciesList(condition: { feedIndex: 32 }) {
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

export default PeopleMover;
