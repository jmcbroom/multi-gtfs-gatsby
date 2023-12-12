import { graphql } from "gatsby";
import React, { useState, useEffect } from "react";
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
  getTripsByServiceDay,
} from "../util";
import supabase from "../supabaseClient";
import RoutePredictions from "../components/RoutePredictions";
import { set } from "lodash";

const Qline = ({ data }) => {
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

  let [realtime, setRealtime] = useState(null);

  const realtimeChannel = supabase
    .channel("qline_vehicle_position")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "gtfsrt",
      },
      (payload) => {
        setRealtime(payload.new);
      }
    )
    .subscribe();

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

  const [vehicles, setVehicles] = useState(null);

  useEffect(() => {
    // Function to fetch data from the public table
    const fetchData = async () => {
      try {
        // Replace 'YOUR_TABLE_NAME' with the actual name of your public table
        const { data, error } = await supabase
          .from("last_qline_vehicle_position")
          .select("*");

        if (error) {
          throw error;
        }

        setRealtime(data[0]);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchData();
  }, []);
  
  useEffect(() => {
    if (!realtime) {
      return;
    }
    let vehicleFc = {
      type: "FeatureCollection",
      features: realtime?.data.entity
        ?.filter((e) => e.vehicle.trip)
        .map((v) => {
          let trip = trips.find((t) => t.tripId === v.vehicle.trip?.tripId);

          let direction = sanityRoute.directions.find(
            (d) => d.directionId === trip.directionId
          );

          const statuses = {
            IN_TRANSIT_TO: `moving at ${v.vehicle.position.speed.toFixed(
              0
            )} mph`,
            STOPPED_AT: `stopped`,
          };

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                v.vehicle.position.longitude,
                v.vehicle.position.latitude,
              ],
            },
            properties: {
              agency: "qline",
              hdg: v.vehicle.position.bearing,
              bearing: v.vehicle.position.bearing,
              vid: v.vehicle.vehicle.id,
              feedIndex: 32,
              routeColor: "#EF4D2E",
              routeTextColor: "#ffffff",
              trips: [trip],
              directions: [direction],
              routeShortName: `QLINE`,
              displayShortName: `QLINE`,
              vehicleIcon: "rail-light",
              description: direction.directionDescription,
              headsign: direction.directionHeadsign,
              nextStop: {
                stpnm:
                  trip.stopTimes[v.vehicle.currentStopSequence - 1]?.stop
                    ?.stopName || null,
              },
              status: statuses[v.vehicle.currentStatus],
            },
          };
        }),
    };
    setVehicles(vehicleFc);
  }, [realtime]);

  const [trackedBus, setTrackedBus] = useState(null);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <PortableText
            className="prose prose-lg dark:prose-dark sanityContent"
            content={sanityRoute.description}
          />
        </div>
        <div>

        <RouteMap
          routeFc={createRouteFc(sanityRoute, gtfsRoute)}
          stopsFc={createStopsFc(sanityRoute, tripsByServiceAndDirection)}
          timepointsFc={createStopsFc(
            sanityRoute,
            tripsByServiceAndDirection,
            true,
            true,
            true
            )}
            vehicleFc={vehicles}
            agency={agencyData}
            trackedBus={trackedBus}
            clickStops={false}
            mapHeight={425}
            mapBearing={0}
            mapPadding={30}
            />
            <RoutePredictions
              vehicles={vehicles}
              predictions={null}
              setTrackedBus={setTrackedBus}
              routeType={gtfsRoute.routeType}
              />
              </div>
      </div>

      <div className="sanityContent mt-4">
        <h4>Where does the streetcar stop?</h4>
        <p>
          The streetcar travels north and south between Congress St and Grand
          Blvd.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <RouteTimepoints
          agency={agencyData}
          route={routeData}
          trips={tripsByServiceAndDirection}
          headsigns={headsignsByDirectionId}
          link={false}
        />
      </div>
    </div>
  );
};

export const query = graphql`
  query QlineQuery {
    route: sanityRoute(
      shortName: { eq: "QLINE" }
      agency: { slug: { current: { eq: "qline" } } }
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
    agency: sanityAgency(slug: { current: { eq: "qline" } }) {
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
        condition: { feedIndex: 30, routeShortName: "QLINE" }
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
            serviceId: { in: ["c_45772_b_55794_d_63", "c_45772_b_55794_d_64"] }
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
      agencies: agenciesList(condition: { feedIndex: 30 }) {
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

export default Qline;
