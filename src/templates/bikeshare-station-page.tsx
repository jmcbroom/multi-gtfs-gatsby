import React, { useEffect, useState } from "react";
import BikeshareMap from "../components/Bikeshare/BikeshareMap";
import AgencySlimHeader from "../components/AgencySlimHeader";
import StopHeader from "../components/StopHeader";
import { graphql } from "gatsby";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import _ from "lodash";
import MapLegend from "../components/MapLegend";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faBicycle,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";
import StopTransfers from '../components/StopTransfers';

const BikeshareStationPage = ({ data, pageContext }) => {
  let bikeTypes = {
    ICONIC: "Normal",
    BOOST: "Electric (1st gen)",
    EFIT: "Electric (2nd gen)",
  };

  let { station, feedUrl } = pageContext;

  station.name = station.name.replace("*", "");

  const favoriteBikeshareStops = useLiveQuery(() => db.bikeshare.toArray());

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

  let stationFc = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: station.station_id,
        geometry: {
          type: "Point",
          coordinates: [station.lon, station.lat],
        },
        properties: {
          ...station,
        },
      },
    ],
  };

  const [stationStatus, setStationStatus] = useState(null);

  let sanityAgencies = data.agency.edges.map((e) => e.node);

  let nearbyStops = data.postgres.nearbyStops;

  let nearbyStopsFc = {
    type: "FeatureCollection",
    features: nearbyStops.map((stop: any) => {
      return {
        type: "Feature",
        id: stop.stopId,
        geometry: {
          type: "Point",
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
          agency: sanityAgencies.find(sa => sa.currentFeedIndex === stop.feedIndex).slug.current,
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
          <StopTransfers stop={indexedStop} nearbyStops={nearbyStops} routes={data.sanityRoutes.edges.map(e => e.node)} agencies={data.agency.edges.map(e => e.node)} />
        </div>
        <div>
          <BikeshareMap stationsFc={stationFc} nearbyStopsFc={nearbyStopsFc} />
          <MapLegend
            marks={[
              {
                color: "red",
                text: "MoGo station",
                size: "w-4 h-4",
              },
              {
                color: "white",
                text: "Nearby bus stop",
                size: "w-3 h-3",
              },
            ]}
            text={`Tap a bus stop on the map to jump to that stop's schedule page.`}
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
    agency: allSanityAgency {
      edges {
        node {
          name
          fullName
          id
          realTimeEnabled
          stopIdentifierField
          currentFeedIndex
          color {
            hex
          }
          textColor {
            hex
          }
          slug {
            current
          }
        }
      }
    }
    sanityRoutes: allSanityRoute{
      edges {
        node {
          agency {
            currentFeedIndex
          }
          longName
          shortName
          displayShortName: shortName
          color {
            hex
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
