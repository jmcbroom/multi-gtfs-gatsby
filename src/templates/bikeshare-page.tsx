import React, { useState, useEffect } from "react";
import { graphql, Link } from "gatsby";
import {
  BikeshareStation,
  BikeshareStationStatus,
} from "../types/BikeshareTypes";
import BikeshareMap from "../components/Bikeshare/BikeshareMap";
import AgencySlimHeader from "../components/AgencySlimHeader";
import * as Tabs from "@radix-ui/react-tabs";
import PortableText from "react-portable-text";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBicycle, faBolt, faLockOpen, faSignInAlt } from "@fortawesome/free-solid-svg-icons";

const createStationsFc = (
  stations: BikeshareStation[],
  statuses: BikeshareStationStatus[]
) => {
  // combine stations and statuses
  stations.forEach((station) => {
    let status = statuses.find(
      (status) => status.station_id === station.station_id
    );
    if (status) {
      station.status = status;
      station.status = status;
    }
  });

  let fc: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      id: station.station_id,
      geometry: {
        type: "Point",
        coordinates: [station.lon, station.lat],
      },
      properties: {
        name: station.name.replace("*", ""),
        address: station.address,
        capacity: station.capacity,
        status: station.status,
      },
    })),
  };

  return fc;
};

const Bikeshare = ({ data, pageContext, location }) => {
  let { feedUrl, data: stations, initialTab } = pageContext;

  if (initialTab === undefined) {
    initialTab = "home";
  }

  let [stationStatus, setStationStatus] = useState<
    BikeshareStationStatus[] | null
  >(null);

  useEffect(() => {
    fetch(`${feedUrl}/station_status`)
      .then((response) => response.json())
      .then(
        (data) => setStationStatus(data.data.stations))
      .catch((error) => console.error("Error fetching station status:", error));
  }, []);

  let bikeshare = data.allSanityBikeshare.edges[0].node;

  return (
    <div className="mt-4">
      <AgencySlimHeader agency={bikeshare} />

      <Tabs.Root className="tabRoot" defaultValue={pageContext.initialTab}>
        <Tabs.List className="tabList" aria-label="Home">
          <Link to={`/${bikeshare.slug.current}`}>
            <Tabs.Trigger className="tabTrigger" value="home">
              Home
            </Tabs.Trigger>
          </Link>
          <Link to={`/${bikeshare.slug.current}/stations`}>
            <Tabs.Trigger className="tabTrigger" value="stations">
              Stations
            </Tabs.Trigger>
          </Link>
          <Link to={`/${bikeshare.slug.current}/fares`}>
            <Tabs.Trigger className="tabTrigger" value="fares">
              Fares
            </Tabs.Trigger>
          </Link>
          <Link to={`/${bikeshare.slug.current}/map`}>
            <Tabs.Trigger className="tabTrigger" value="map">
              Map
            </Tabs.Trigger>
          </Link>
        </Tabs.List>

        <Tabs.Content className="tabContent" value="home">
          <PortableText
            content={bikeshare.description}
            className="pb-2 pt-1 px-2"
          />
        </Tabs.Content>

        <Tabs.Content className="tabContent" value="stations">
          <div className="px-3 py-2">
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
              {stationStatus ? `${stations.length} stations` : "Loading stations..."}
            </p>
            <div className="flex flex-col gap-2">
              {stationStatus && createStationsFc(stations, stationStatus).features
                ?.sort((a: any, b: any) => b.properties.status.num_bikes_available - a.properties.status.num_bikes_available)
                .map((station: any) => {
                  const bikesAvailable = station.properties.status.num_bikes_available;
                  const ebikesAvailable = station.properties.status.vehicle_types_available
                    .filter((v: any) => v.vehicle_type_id !== 'ICONIC')
                    .map((v: any) => v.count)
                    .reduce((a: number, b: number) => a + b, 0);
                  const docksAvailable = station.properties.status.num_docks_available;

                  // Color indicator based on availability
                  const availabilityColor = bikesAvailable === 0
                    ? "bg-red-400 dark:bg-red-600"
                    : bikesAvailable <= 3
                      ? "bg-yellow-400 dark:bg-yellow-600"
                      : "bg-green-400 dark:bg-green-600";

                  return (
                    <Link
                      key={station.id}
                      to={`/${bikeshare.slug.current}/station/${station.id}`}
                      className="flex items-center gap-3 py-2 px-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 hover:shadow-sm transition-all"
                    >
                      <div className={`w-2 h-8 rounded-full ${availabilityColor} flex-shrink-0`} />
                      <div className="flex-grow min-w-0">
                        <h4 className="m-0 text-sm font-medium truncate">{station.properties.name.replace("*", "")}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-xs flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faBicycle} className="text-gray-400 dark:text-zinc-500" />
                          <span className="font-semibold tabular-nums">{bikesAvailable}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faBolt} className="text-yellow-500 dark:text-yellow-400" />
                          <span className="font-semibold tabular-nums">{ebikesAvailable}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 dark:text-zinc-500">
                          <FontAwesomeIcon icon={faLockOpen} />
                          <span className="tabular-nums">{docksAvailable}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content className="tabContent" value="fares">
          <h2>Fares</h2>
          <PortableText content={bikeshare.fareContent} />
        </Tabs.Content>

        <Tabs.Content className="tabContent" value="map">
          <p className="grayHeader">System map</p>
          {stationStatus && (
            <BikeshareMap
              stationsFc={createStationsFc(stations, stationStatus)}
              showLegend={true}
              legendText="Station colors indicate bike availability. Zoom in to see exact bike counts. Tap on a station to go to the station page."
            />
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export const query = graphql`
  query ($slug: String!) {
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
  }
`;

export default Bikeshare;
