import React, { useMemo, useState } from "react";
import { faLocationDot, faLocationCrosshairs, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLiveQuery } from "dexie-react-hooks";
import { SearchBox } from "@mapbox/search-js-react";
import PageHeader from "../components/PageHeader";
import NearbyStopsList from "../components/NearbyStopsList";
import { db } from "../db";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
import { DETROIT_BBOX } from "../components/TripPlanner/TripInputs";

const StopsNearMePage = () => {
  const { sanityAgencies } = useSanityAgencies();
  const agencies = useMemo(
    () => sanityAgencies.edges.map((e) => e.node),
    [sanityAgencies]
  );

  const favoriteStops = useLiveQuery(() => db?.stops?.toArray());

  const [searchMode, setSearchMode] = useState("location"); // "location" or "address"
  const [searchLocation, setSearchLocation] = useState(null);

  const handleAddressRetrieve = (result) => {
    const feature = result.features?.[0];
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      const name = feature.properties.name || feature.properties.place_formatted || feature.properties.full_address;
      setSearchLocation({
        lat: parseFloat(lat.toFixed(6)),
        lon: parseFloat(lon.toFixed(6)),
        name: name?.replace(/, United States$/, ""),
      });
    }
  };

  const clearSearch = () => {
    setSearchLocation(null);
  };

  return (
    <>
      <PageHeader title="Stops near me" icon={faLocationDot} />

      {/* Search mode toggle and address search */}
      <div className="px-2 py-3 space-y-2">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSearchMode("location");
              setSearchLocation(null);
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchMode === "location"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
            }`}
          >
            <FontAwesomeIcon icon={faLocationCrosshairs} className="mr-2" />
            My Location
          </button>
          <button
            onClick={() => setSearchMode("address")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchMode === "address"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
            }`}
          >
            <FontAwesomeIcon icon={faSearch} className="mr-2" />
            Search Address
          </button>
        </div>

        {/* Address search input */}
        {searchMode === "address" && (
          <div className="flex items-center gap-2">
            {searchLocation ? (
              <>
                <div className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-sm">
                  {searchLocation.name}
                </div>
                <button
                  onClick={clearSearch}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Clear
                </button>
              </>
            ) : (
              SearchBox && (
                <SearchBox
                  accessToken={process.env.MAPBOX_ACCESS_TOKEN}
                  options={{
                    bbox: DETROIT_BBOX,
                    proximity: { lng: -83.05, lat: 42.35 },
                    types: "address,place,poi,neighborhood,locality",
                    poi_category_exclusions: "brand",
                  }}
                  placeholder="Search for an address..."
                  onRetrieve={handleAddressRetrieve}
                  theme={{ variables: { boxShadow: "none" } }}
                />
              )
            )}
          </div>
        )}
      </div>

      <NearbyStopsList
        sanityAgencies={agencies}
        favoriteStops={favoriteStops || []}
        customLocation={searchMode === "address" ? searchLocation : null}
      />
    </>
  );
};

export default StopsNearMePage;

export const Head = () => {
  const title = "Stops Near Me | transit.det.city";
  const description = "Find transit stops near your current location.";
  const url = "https://transit.det.city/stops-near-me";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href={url} />
    </>
  );
};
