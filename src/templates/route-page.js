import * as Tabs from "@radix-ui/react-tabs";
import { graphql, Link } from "gatsby";
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import AgencySlimHeader from "../components/AgencySlimHeader";
import DirectionPicker from "../components/DirectionPicker";
import RouteHeader from "../components/RouteHeader";
import RouteIntroduction from "../components/RouteIntroduction";
import RouteMap from "../components/RouteMap";
import RouteStopsList from "../components/RouteStopsList";
import RouteTimeTable from "../components/RouteTimeTable";
import ServicePicker from "../components/ServicePicker";
import RoutePredictions from "../components/RoutePredictions";

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

const createVehicleFc = (vehicles, patterns, route, agency) => {
  // Create a GeoJSON FeatureCollection of vehicles
  // from the BusTime API response and the Sanity route directions
  if (!vehicles || !patterns || !route) return null;

  // create a GeoJSON feature for each vehicle
  let features = vehicles.map((v) => {
    // find the pattern and direction for this vehicle
    let pattern = patterns.find((p) => p.pid === v.pid) || patterns[0]
    let direction = route.directions.find(
      (d) =>
        d.directionDescription
          .toLowerCase()
          .indexOf(pattern.rtdir.toLowerCase()) > -1
    ) || 'unknown';

    // get the next stops from the pattern and distance traveled
    let nextStops = pattern.pt.filter((p) => p.pdist > v.pdist && p.stpid);

    // return a GeoJSON feature
    return {
      type: "Feature",
      properties: {
        ...v,
        ...route,
        agency: agency.slug.current,
        description: direction.directionDescription || `unknown`,
        headsign: direction.directionHeadsign || `unknown`,
        nextStop: nextStops[0],
        nextStops: nextStops,
      },
      geometry: {
        type: "Point",
        coordinates: [parseFloat(v.lon), parseFloat(v.lat)],
      },
    };
  });

  return {
    type: "FeatureCollection",
    features: features,
  };
};

const Route = ({ data, pageContext }) => {
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

  let serviceDays = getServiceDays(serviceCalendars);
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
  }

  sanityRoute.mapPriority = 2;
  let routeData = createRouteData(gtfsRoute, sanityRoute);
  const [direction, setDirection] = useState(
    Object.keys(headsignsByDirectionId)[0]
  );

  let defaultService = "weekday";

  if (dayOfWeek() === "sunday" && tripsByServiceDay.sunday.length > 0) {
    defaultService = "sunday";
  }
  if (dayOfWeek() === "saturday" && tripsByServiceDay.saturday.length > 0) {
    defaultService = "saturday";
  }

  const [service, setService] = useState(defaultService);

  let [now, setNow] = useState(new Date());

  let [patterns, setPatterns] = useState(null);
  let [vehicles, setVehicles] = useState(null);
  let [predictions, setPredictions] = useState(null);
  useEffect(() => {
    if (!sanityAgency.realTimeEnabled) return;
    let tick = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled) return;
    fetch(
      `/.netlify/functions/route?routeId=${sanityRoute.shortName}&agency=${pageContext.agencySlug}`
    )
      .then((r) => r.json())
      .then((d) => {
        setVehicles(d["bustime-response"]["vehicle"]);
      });
  }, [now]);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled || !vehicles) return;
    fetch(
      `/.netlify/functions/predictions?vehicleId=${vehicles.map(v => v.vid).join(",")}&agency=${pageContext.agencySlug}`
    )
      .then((r) => r.json())
      .then((d) => {
        setPredictions(d["bustime-response"]["prd"]);
      });
  }, [vehicles]);

  useEffect(() => {
    if (!sanityAgency.realTimeEnabled) return;
    fetch(
      `/.netlify/functions/patterns?routeId=${sanityRoute.shortName}&agency=${pageContext.agencySlug}`
    )
      .then((r) => r.json())
      .then((d) => {
        setPatterns(d["bustime-response"]["ptr"]);
      });
  }, []);

  let [trackedBus, setTrackedBus] = useState(null);

  return (
    <div>
      <Helmet>
        <title>{`${agencyData.name} ${routeData.routeShortName}: ${routeData.routeLongName}`}</title>
        <meta
          property="og:url"
          content={`https://transit.det.city/${pageContext.agencySlug}/route/${routeData.routeShortName}/`}
        />
        <meta property="og:type" content={`website`} />
        <meta
          property="og:title"
          content={`${agencyData.name} bus route: ${routeData.routeShortName} ${routeData.routeLongName}`}
        />
        <meta
          property="og:description"
          content={`${agencyData.name} bus route ${routeData.routeShortName} ${routeData.routeLongName}`}
        />
      </Helmet>

      <AgencySlimHeader agency={agencyData} />

      <div className="px-2 md:px-0 my-2 md:my-4">
        <RouteHeader {...gtfsRoute} agency={agencyData} />
      </div>

      <Tabs.Root className="tabRoot" defaultValue={pageContext.initialTab}>
        <Tabs.List className="tabList" aria-label="Manage your account">
          <Tabs.Trigger className="tabTrigger" value="">
            <Link
              to={`/${pageContext.agencySlug}/route/${gtfsRoute.routeShortName}/`}
            >
              Home
            </Link>
          </Tabs.Trigger>
          <Tabs.Trigger className="tabTrigger" value="map">
            <Link
              to={`/${pageContext.agencySlug}/route/${gtfsRoute.routeShortName}/map`}
            >
              Map
            </Link>
          </Tabs.Trigger>
          <Tabs.Trigger className="tabTrigger" value="schedule">
            <Link
              to={`/${pageContext.agencySlug}/route/${gtfsRoute.routeShortName}/schedule`}
            >
              Schedule
            </Link>
          </Tabs.Trigger>
          <Tabs.Trigger className="tabTrigger" value="stops">
            <Link
              to={`/${pageContext.agencySlug}/route/${gtfsRoute.routeShortName}/stops`}
            >
              Stops
            </Link>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className="tabContent" value="">
          <div className="md:grid md:grid-cols-2 gap-2">
            {(
              <RoutePredictions
                vehicles={createVehicleFc(
                  vehicles,
                  patterns,
                  routeData,
                  agencyData
                )}
                predictions={predictions}
                setTrackedBus={setTrackedBus}
                now={now}
              />
            )}
            {sanityRoute && (
              <RouteMap
                routeFc={createRouteFc(sanityRoute, gtfsRoute)}
                stopsFc={createStopsFc(sanityRoute, tripsByServiceAndDirection)}
                timepointsFc={createStopsFc(
                  sanityRoute,
                  tripsByServiceAndDirection,
                  true
                )}
                vehicleFc={createVehicleFc(
                  vehicles,
                  patterns,
                  routeData,
                  agencyData
                )}
                agency={agencyData}
                trackedBus={trackedBus}
              />
            )}
          </div>
          <RouteIntroduction
            agency={agencyData}
            route={routeData}
            trips={tripsByServiceAndDirection}
            headsigns={headsignsByDirectionId}
          />
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="map">
          {sanityRoute && (
            <RouteMap
              routeFc={createRouteFc(sanityRoute, gtfsRoute)}
              stopsFc={createStopsFc(sanityRoute, tripsByServiceAndDirection)}
              timepointsFc={createStopsFc(
                sanityRoute,
                tripsByServiceAndDirection,
                true
              )}
              vehicleFc={createVehicleFc(
                vehicles,
                patterns,
                routeData,
                agencyData
              )}
              agency={agencyData}
            />
          )}
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="schedule">
          <div className="bg-gray-100 dark:bg-zinc-900 p-4 md:py-6 flex flex-col gap-4 md:gap-8">
            <DirectionPicker
              directions={headsignsByDirectionId}
              {...{ direction, setDirection }}
            />
            <ServicePicker
              services={tripsByServiceDay}
              {...{ service, setService }}
            />
          </div>
          <RouteTimeTable
            trips={tripsByServiceAndDirection}
            route={gtfsRoute}
            agency={agencyData}
            service={service}
            direction={direction}
          />
        </Tabs.Content>
        <Tabs.Content className="tabContent" value="stops">
          <div className="bg-gray-100 dark:bg-zinc-900 p-4 md:py-6 flex flex-col gap-4 md:gap-8">
            <DirectionPicker
              directions={headsignsByDirectionId}
              {...{ direction, setDirection }}
            />
          </div>
          <div className="px-3 flex flex-col gap-4 md:gap-8">
            <RouteStopsList
              longTrips={longTrips}
              direction={direction}
              routeColor={gtfsRoute.routeColor}
              agency={agencyData}
            />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export const query = graphql`
  query RouteQuery($feedIndex: Int, $routeNo: String, $agencySlug: String) {
    route: sanityRoute(
      shortName: { eq: $routeNo }
      agency: { slug: { current: { eq: $agencySlug } } }
    ) {
      color {
        hex
      }
      longName
      routeType
      shortName
      slug {
        current
      }
      textColor {
        hex
      }
      mapPriority
      directions: extRouteDirections {
        directionHeadsign
        directionDescription
        directionId
        directionTimepoints
        directionShape
      }
    }
    agency: sanityAgency(slug: { current: { eq: $agencySlug } }) {
      name
      color {
        hex
      }
      textColor {
        hex
      }
      currentFeedIndex
      realTimeEnabled
      slug {
        current
      }
    }
    postgres {
      routes: routesList(
        condition: { feedIndex: $feedIndex, routeShortName: $routeNo }
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
        trips: tripsByFeedIndexAndRouteIdList {
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
      agencies: agenciesList(condition: { feedIndex: $feedIndex }) {
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

export default Route;
