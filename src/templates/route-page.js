import { graphql, Link } from "gatsby";
import React from "react";
import AgencyHeader from "../components/AgencyHeader";
import RouteDirectionsTable from "../components/RouteDirectionsTable";
import RouteHeader from "../components/RouteHeader";
import {
  getHeadsignsByDirectionId,
  getServiceDays,
  getTripsByServiceAndDirection,
  getTripsByServiceDay,
} from "../util";

const Route = ({ data, pageContext }) => {

  let gtfsRoute = data.postgres.routes[0];
  let gtfsAgency = data.postgres.agencies[0];
  let sanityRoute = data.route;
  let sanityAgency = data.agency;
  
  if(sanityRoute) {
    gtfsRoute.routeLongName = sanityRoute.longName
    gtfsRoute.routeColor = sanityRoute.color.hex
    gtfsRoute.routeTextColor = sanityRoute.textColor.hex
  }

  let { trips } = gtfsRoute;
  let { serviceCalendars } = gtfsAgency.feedInfo;

  let serviceDays = getServiceDays(serviceCalendars);
  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays);
  let headsignsByDirectionId = getHeadsignsByDirectionId(trips);
  let tripsByServiceAndDirection = getTripsByServiceAndDirection(
    trips,
    serviceDays,
    headsignsByDirectionId
  );

  const pages = {
    Overview: `./`,
    "Route timetable": `./timetable`,
    Stops: `./stops`,
  };

  return (
    <div>
      <AgencyHeader agency={gtfsAgency} />
      <RouteHeader {...gtfsRoute} />
      <div className="flex items-center justify-start gap-2 my-2">
        {Object.keys(pages).map((p) => (
          <div key={p} className="bg-gray-300 py-2 px-6 text-center text-semibold">
            <Link to={pages[p]}>
              <span>{p}</span>
            </Link>
          </div>
        ))}
      </div>
      <RouteDirectionsTable trips={tripsByServiceAndDirection} headsigns={headsignsByDirectionId} />
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
    }
    agency: sanityAgency(slug: { current: { eq: $agencySlug } }) {
      name
      currentFeedIndex
      slug {
        current
      }
    }
    postgres {
      routes: routesList(condition: { feedIndex: $feedIndex, routeShortName: $routeNo }) {
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
            condition: { timepoint: 1 }
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
            }
          }
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
