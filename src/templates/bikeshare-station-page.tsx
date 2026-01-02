import React, { useEffect, useState } from "react";
import BikeshareMap from "../components/Bikeshare/BikeshareMap";
import AgencySlimHeader from "../components/AgencySlimHeader";
import { BikeshareStationStatus } from "../types/BikeshareTypes";
import StopHeader from "../components/StopHeader";
import { graphql } from "gatsby";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import _ from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import {
  faBolt,
  faBicycle,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";
import StopTransfers from '../components/StopTransfers';

const BikeshareStationPage = ({ data, pageContext }) => {

  let { sanityAgencies } = useSanityAgencies();
  let { sanityRoutes } = useSanityRoutes();

  sanityAgencies = sanityAgencies.edges.map(e => e.node);
  sanityRoutes = sanityRoutes.edges.map(e => e.node);

  let bikeTypes = {
    ICONIC: "Normal",
    BOOST: "Electric (1st gen)",
    EFIT: "Electric (2nd gen)",
  };

  let { station, feedUrl } = pageContext;

  station.name = station.name.replace("*", "");

  const favoriteBikeshareStops = useLiveQuery(() => db?.bikeshare?.toArray());

  let agencyData = data.allSanityBikeshare.edges.map((e) => e.node)[0];

  let indexedStop = station;

  indexedStop.agency = {
    slug: {
      current: agencyData.slug.current,
    },
    name: agencyData.name,
    feedIndex: agencyData.feedIndex,
    color: agencyData.color,
    textColor: agencyData.textColor,
  };

  let isFavoriteStop =
    favoriteBikeshareStops?.filter(
      (stop: any) =>
        stop.station_id === station.station_id &&
        stop.agency?.slug.current === pageContext.slug
    ).length > 0;



  const [stationStatus, setStationStatus] = useState<BikeshareStationStatus | null>(null);

  let nearbyStops = data.postgres.nearbyStops;

  // Filter to only stops that have routes matching in Sanity (same logic as StopTransfers)
  const filteredNearbyStops = nearbyStops.filter((stop: any) => {
    const agency = sanityAgencies.find((a: any) => a.currentFeedIndex === stop.feedIndex);
    if (!agency) return false;

    // Check if any of this stop's trip directions have a matching route in Sanity
    return stop.tripDirections?.some((td: any) => {
      return sanityRoutes.some((rt: any) =>
        rt.shortName === td.routeId &&
        rt.agency.currentFeedIndex === stop.feedIndex
      );
    });
  });

  let nearbyStopsFc = {
    type: "FeatureCollection" as const,
    features: filteredNearbyStops.map((stop: any) => {
      const agency = sanityAgencies.find((sa: any) => sa.currentFeedIndex === stop.feedIndex);
      return {
        type: "Feature" as const,
        id: stop.stopId,
        geometry: {
          type: "Point" as const,
          coordinates: [stop.stopLon, stop.stopLat],
        },
        properties: {
          stopId: stop.stopId,
          stopName: stop.stopName,
          stopCode: stop.stopCode,
          feedIndex: stop.feedIndex,
          offset: [1, 0],
          anchor: "left",
          justify: "left",
          agency: agency?.slug?.current,
        },
      };
    }),
  };

  useEffect(() => {
    fetch(`${feedUrl}/station_status`)
      .then((response) => response.json())
      .then((data) => {
        let matchingStation = data.data.stations.find(
          (s: any) => s.station_id === station.station_id
        );
        setStationStatus(matchingStation);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  let stationFc = {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        id: station.station_id,
        geometry: {
          type: "Point" as const,
          coordinates: [station.lon, station.lat],
        },
        properties: {
          ...station,
          status: stationStatus
        },
      },
    ],
  };

  let statusBadgeStyle = `h-10 w-10 bg-gray-300 dark:bg-zinc-600 text-lg font-semibold flex items-center justify-around`;

  return (
    <div className="mt-4">
      <AgencySlimHeader agency={agencyData} />
      <StopHeader
        favoriteStops={favoriteBikeshareStops}
        agency={agencyData}
        indexedStop={indexedStop}
        isFavoriteStop={isFavoriteStop}
        stopName={station.name}
        stopIdentifier={station.station_id}
        stopType={"bikeshare"}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {stationStatus ? (
            <>
              <h4 className="m-0">Station status</h4>

              <div className="flex flex-col gap-4 py-2 px-2 bg-gray-100 dark:bg-zinc-700">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faBicycle}
                    className="text-slate-500 dark:text-zinc-300 text-2xl w-12"
                  />
                  <span className="font-semibold dark:text-zinc-300">
                    {stationStatus.num_bikes_available} bikes
                  </span>
                </div>

                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faBolt}
                    className="text-slate-500 dark:text-zinc-300 text-2xl w-12"
                  />
                  <span className="font-semibold dark:text-zinc-300">
                    {stationStatus.vehicle_types_available
                      .filter((v) => v.vehicle_type_id !== "ICONIC")
                      .map((v) => v.count)
                      .reduce((a, b) => a + b)}{" "}
                    e-bikes
                  </span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faSignInAlt}
                    className="text-slate-400 dark:text-zinc-400 text-2xl w-12"
                  />
                  <span className="font-regular text-gray-500 dark:text-zinc-400">
                    {stationStatus.num_docks_available} open docks
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-4 rounded-md shadow-md">
              <p>Loading station status..</p>
            </div>
          )}
          <StopTransfers stop={indexedStop} nearbyStops={filteredNearbyStops} routes={sanityRoutes} agencies={sanityAgencies} />
        </div>
        <div>
          <BikeshareMap 
            stationsFc={stationFc} 
            nearbyStopsFc={nearbyStopsFc}
            showLegend={false}
            legendText="Station color indicates bike availability. Tap a bus stop on the map to jump to that stop's schedule page."
            includeNearbyStops={true}
          />
          

          </div>
      </div>
    </div>
  );
};

export const query = graphql`
  query ($slug: String!, $lat: Float!, $lon: Float!) {
    allSanityBikeshare(filter: { slug: { current: { eq: $slug } } }) {
      edges {
        node {
          name
          fullName
          description: _rawDescription
          fareContent: _rawFareContent
          slug {
            current
          }
          color {
            hex
          }
          textColor {
            hex
          }
        }
      }
    }
    postgres {
      nearbyStops: nearbyStopsList(lat: $lat, lon: $lon) {
        feedIndex
        stopId
        stopCode
        stopName
        stopLat
        stopLon
        tripDirections: tripDirectionsList {
          routeId
          directionId
          tripCount
        }
      }
    }
  }
`;

export default BikeshareStationPage;
