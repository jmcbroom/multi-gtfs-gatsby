import React, { useState, useEffect, useMemo } from "react";
import { graphql, Link } from "gatsby";
import {
  BikeshareStation,
  BikeshareStationStatus,
} from "../types/BikeshareTypes";
import BikeshareMap from "../components/Bikeshare/BikeshareMap";
import AgencySlimHeader from "../components/AgencySlimHeader";
import * as Tabs from "@radix-ui/react-tabs";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import PortableText from "react-portable-text";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBicycle, faBolt, faParking } from "@fortawesome/free-solid-svg-icons";

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
  let [mapBounds, setMapBounds] = useState<[number, number, number, number] | null>(null);
  let [filters, setFilters] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${feedUrl}/station_status`)
      .then((response) => response.json())
      .then(
        (data) => setStationStatus(data.data.stations))
      .catch((error) => console.error("Error fetching station status:", error));
  }, []);

  let bikeshare = data.allSanityBikeshare.edges[0].node;

  // Create the full feature collection once
  const stationsFc = useMemo(() => {
    if (!stationStatus) return null;
    return createStationsFc(stations, stationStatus);
  }, [stations, stationStatus]);

  // Helper to get e-bike count
  const getEbikeCount = (status: any) => {
    return status?.vehicle_types_available
      ?.filter((v: any) => v.vehicle_type_id !== 'ICONIC')
      .reduce((sum: number, v: any) => sum + v.count, 0) || 0;
  };

  // Filter stations based on bounds and availability filters
  const filteredStations = useMemo(() => {
    if (!stationsFc) return [];

    return stationsFc.features
      .filter((station: any) => {
        const [lon, lat] = station.geometry.coordinates;
        const status = station.properties.status;

        // Filter by map bounds if set
        if (mapBounds) {
          const [west, south, east, north] = mapBounds;
          if (lon < west || lon > east || lat < south || lat > north) {
            return false;
          }
        }

        // Filter by availability
        if (filters.includes('hasBikes') && status.num_bikes_available === 0) {
          return false;
        }
        if (filters.includes('hasEbikes') && getEbikeCount(status) === 0) {
          return false;
        }

        return true;
      })
      .sort((a: any, b: any) =>
        b.properties.status.num_bikes_available - a.properties.status.num_bikes_available
      );
  }, [stationsFc, mapBounds, filters]);

  return (
    <>
      <AgencySlimHeader agency={bikeshare} />

      <Tabs.Root className="tabRoot" defaultValue={pageContext.initialTab}>
        <Tabs.List className="tabList" aria-label="Home">
          <Link to={`/${bikeshare.slug.current}`}>
            <Tabs.Trigger className="tabTrigger" value="home">
              Home
            </Tabs.Trigger>
          </Link>
          <Link to={`/${bikeshare.slug.current}/fares`}>
            <Tabs.Trigger className="tabTrigger" value="fares">
              Fares
            </Tabs.Trigger>
          </Link>
        </Tabs.List>

        <Tabs.Content className="tabContent" value="home">
          <PortableText
            content={bikeshare.description}
            className="pb-2 pt-1 px-2"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
            {/* Map */}
            <div>
              {stationsFc && (
                <BikeshareMap
                  stationsFc={stationsFc}
                  showLegend={true}
                  legendText="Pan/zoom to filter the station list"
                  onBoundsChange={setMapBounds}
                  bikeshareSlug={bikeshare.slug.current}
                />
              )}
            </div>
            {/* Station List */}
            <div className="flex flex-col">
              {/* Filter toggles */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 dark:text-zinc-400">Filter:</span>
                <ToggleGroup.Root
                  type="multiple"
                  value={filters}
                  onValueChange={setFilters}
                  className="flex gap-1"
                >
                  <ToggleGroup.Item
                    value="hasBikes"
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-zinc-600 data-[state=on]:bg-red-600 data-[state=on]:text-white data-[state=on]:border-red-600 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  >
                    <FontAwesomeIcon icon={faBicycle} className="mr-1" />
                    Has bikes
                  </ToggleGroup.Item>
                  <ToggleGroup.Item
                    value="hasEbikes"
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-zinc-600 data-[state=on]:bg-yellow-500 data-[state=on]:text-white data-[state=on]:border-yellow-500 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  >
                    <FontAwesomeIcon icon={faBolt} className="mr-1" />
                    Has e-bikes
                  </ToggleGroup.Item>
                </ToggleGroup.Root>
              </div>

              {/* Station count */}
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-2">
                {stationStatus
                  ? `${filteredStations.length} of ${stations.length} stations`
                  : "Loading stations..."}
              </p>

              {/* Station list */}
              <ul className="list-none m-0 max-h-[420px] overflow-y-auto border-t border-gray-200 dark:border-zinc-700">
                {filteredStations.map((station: any) => {
                  const status = station.properties.status;
                  const bikesAvailable = status.num_bikes_available;
                  const ebikesAvailable = getEbikeCount(status);
                  const docksAvailable = status.num_docks_available;

                  return (
                    <li
                      key={station.id}
                      className="flex items-center gap-3 py-3 px-3 border-b border-gray-200 dark:border-zinc-700 last:border-none hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                        <FontAwesomeIcon icon={faBicycle} className="text-white text-xs" />
                      </div>
                      <Link
                        to={`/${bikeshare.slug.current}/station/${station.id}`}
                        className="flex-1 min-w-0 truncate hover:underline text-sm font-medium"
                      >
                        {station.properties.name}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-300 flex-shrink-0">
                        <span className="flex items-center gap-1" title="Bikes available">
                          <FontAwesomeIcon icon={faBicycle} className="text-xs" />
                          <span className="font-semibold tabular-nums">{bikesAvailable}</span>
                        </span>
                        <span className="flex items-center gap-1" title="E-bikes available">
                          <FontAwesomeIcon icon={faBolt} className="text-xs text-yellow-500" />
                          <span className="font-semibold tabular-nums">{ebikesAvailable}</span>
                        </span>
                        <span className="flex items-center gap-1" title="Docks available">
                          <FontAwesomeIcon icon={faParking} className="text-xs" />
                          <span className="font-semibold tabular-nums">{docksAvailable}</span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content className="tabContent" value="fares">
          <h2>Fares</h2>
          <PortableText content={bikeshare.fareContent} />
        </Tabs.Content>
      </Tabs.Root>
    </>
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

export const Head = ({ data, pageContext }) => {
  const bikeshare = data.allSanityBikeshare?.edges?.[0]?.node;
  const name = bikeshare?.name || "Bikeshare";
  const fullName = bikeshare?.fullName || name;
  const stationCount = pageContext.data?.length || 0;

  const title = `${name} | transit.det.city`;
  const description = `${fullName} bikeshare system. ${stationCount} stations with real-time bike and e-bike availability.`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:url" content={`https://transit.det.city/${bikeshare?.slug?.current}/`} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href={`https://transit.det.city/${bikeshare?.slug?.current}/`} />
    </>
  );
};
