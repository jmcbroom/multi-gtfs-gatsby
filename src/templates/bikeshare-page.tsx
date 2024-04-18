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
import MapLegend from "../components/MapLegend";

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
    fetch(`${feedUrl}/en/station_status`)
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
          <h2>Stations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {stationStatus && createStationsFc(stations, stationStatus).features.map((station: any) => {
              return (
                <div key={station.id} className="bg-gray-100 dark:bg-zinc-700">
                  <Link
                    to={`/${bikeshare.slug.current}/station/${station.id}`}
                  >
                    <h4 className="m-0">{station.properties.name.replace("*", "")}</h4>
                  </Link>
                  <div className="flex justify-evenly gap-1 py-1">
                    <div className="bg-gray-100 dark:bg-zinc-600 flex justify-start px-2 gap-2 items-center py-1">
                      <FontAwesomeIcon icon={faBicycle} className="text-slate-500 dark:text-zinc-300" />
                      <span className="font-semibold text-xs dark:text-zinc-300">{station.properties.status.num_bikes_available} bikes</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-zinc-600 flex justify-start px-2 gap-2 items-center py-1">
                      <FontAwesomeIcon icon={faBolt} className="text-slate-500 dark:text-zinc-300" />
                      <span className="font-semibold text-xs dark:text-zinc-300">{station.properties.status.vehicle_types_available.filter(v => v.vehicle_type_id !== 'ICONIC').map(v => v.count).reduce((a,b) => a + b)} e-bikes</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-zinc-600 flex justify-start px-2 gap-2 items-center py-1">
                      <FontAwesomeIcon icon={faSignInAlt} className="text-slate-400 dark:text-zinc-400" />
                      <span className="font-regular text-xs text-gray-500 dark:text-zinc-400">{station.properties.status.num_docks_available} open docks</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
            />
          )}
          <MapLegend
            marks={[
              {
                color: "red",
                text: "MoGo station",
                size: "w-4 h-4",
              }
            ]}
            text={`Zoom in to see station details. Tap on a station to go to the station page.`}
          />
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
