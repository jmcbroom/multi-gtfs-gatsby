import React, { useState, useEffect, useMemo, useRef } from "react";
import { graphql, Link } from "gatsby";
import PortableText from "react-portable-text";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Mapbox, { NavigationControl } from "react-map-gl";
import bbox from "@turf/bbox";
import _ from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBicycle,
  faBolt,
  faParking,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../hooks/ThemeContext";
import { useTick } from "../hooks/useTick";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import mapboxStyles from "../styles/styleFactory";
import PredictionsList from "../components/PredictionsList";
import RouteBadge from "../components/RouteBadge";
import RouteSlim from "../components/RouteSlim";
import { getApiStopIdentifier } from "../stopUtils";

const REFRESH_INTERVAL = 30000;

const TransitCenterPage = ({ data, pageContext }) => {
  const transitCenter = data.sanityTransitCenter;
  const { theme } = useTheme();
  const { sanityRoutes } = useSanityRoutes();
  const map = useRef();

  const [predictions, setPredictions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bikeshareStations, setBikeshareStations] = useState([]);

  // Check if any agency has real-time enabled
  const hasRealTime = useMemo(() => {
    return (
      transitCenter?.stops?.some((s) => s.agency?.realTimeEnabled) ?? false
    );
  }, [transitCenter]);

  const now = useTick(hasRealTime, REFRESH_INTERVAL);
  const countdown = REFRESH_INTERVAL / 1000;

  // Build stop info from pageContext and PostgreSQL data
  const stopsWithData = useMemo(() => {
    if (!transitCenter?.stops) return [];
    const pgStops = data?.postgres?.stops || [];

    return transitCenter.stops
      .map((tcStop) => {
        const agency = tcStop.agency;
        // Find the matching PostgreSQL stop data
        const pgStop = pgStops.find(
          (s) =>
            s.feedIndex === agency.currentFeedIndex &&
            (s.stopId === tcStop.stopId || s.stopCode === tcStop.stopId)
        );

        return {
          ...tcStop,
          stopName: pgStop?.stopName || `Stop ${tcStop.stopId}`,
          stopLat: pgStop?.stopLat,
          stopLon: pgStop?.stopLon,
          stopCode: pgStop?.stopCode,
          stopIdActual: pgStop?.stopId,
          routes: pgStop?.routes || [],
          agency: {
            ...agency,
            agencySlug: agency.slug?.current,
          },
        };
      })
      .filter((s) => s.stopLat && s.stopLon); // Only keep stops we found in GTFS
  }, [transitCenter, data?.postgres?.stops]);

  // Build agencies lookup
  const agenciesLookup = useMemo(() => {
    const lookup = {};
    transitCenter?.stops?.forEach((stop) => {
      const agency = stop.agency;
      if (agency?.slug?.current) {
        lookup[agency.slug.current] = agency;
      }
    });
    return lookup;
  }, [transitCenter]);

  const allRoutes = useMemo(
    () => sanityRoutes?.edges?.map((e) => e.node) || [],
    [sanityRoutes]
  );

  // Parse boundary polygon from Sanity
  const boundaryFeatures = useMemo(() => {
    if (!transitCenter?.boundary) return null;
    try {
      return JSON.parse(transitCenter.boundary);
    } catch {
      return null;
    }
  }, [transitCenter?.boundary]);

  // Build map feature collections
  const { mapStyle, mapBounds } = useMemo(() => {
    if (!theme) return { mapStyle: null, mapBounds: null };
    // Allow map even with just bikeshare (added dynamically)
    const hasBikeshareFeeds = (pageContext.bikeshareFeeds || []).length > 0;
    if (stopsWithData.length === 0 && !boundaryFeatures && !hasBikeshareFeeds) {
      return { mapStyle: null, mapBounds: null };
    }

    const style = _.cloneDeep(mapboxStyles[theme]);

    // Stops feature collection
    const stopsFc = {
      type: "FeatureCollection",
      features: stopsWithData.map((stop) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(stop.stopLon), parseFloat(stop.stopLat)],
        },
        properties: {
          name: stop.stopName,
          displayLabel: stop.label || "",
          code: stop.stopId,
          offset: [0, 1.8],
          anchor: "top",
          justify: "center",
        },
      })),
    };

    style.sources.stop = { type: "geojson", data: stopsFc };

    // Override stop-point layer style
    const stopPointIdx = style.layers.findIndex((l) => l.id === "stop-point");
    if (stopPointIdx !== -1) {
      style.layers[stopPointIdx] = {
        ...style.layers[stopPointIdx],
        minzoom: 0,
        paint: {
          "circle-color": "#fff",
          "circle-opacity": 0.9,
          "circle-stroke-color": "#333",
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.8,
          "circle-radius": 10,
        },
      };
    }

    // Remove stop-label layer
    const stopLabelIdx = style.layers.findIndex((l) => l.id === "stop-label");
    if (stopLabelIdx !== -1) {
      style.layers.splice(stopLabelIdx, 1);
    }

    // Add display label layer (inside the circle marker)
    style.layers.push({
      id: "stop-display-label",
      type: "symbol",
      source: "stop",
      filter: ["!=", ["get", "displayLabel"], ""],
      layout: {
        "text-field": ["get", "displayLabel"],
        "text-font": ["Inter Bold"],
        "text-size": 9,
        "text-offset": [0, 0],
        "text-anchor": "center",
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#000",
      },
    });

    // Add boundary polygon if present
    if (boundaryFeatures && boundaryFeatures.length > 0) {
      const boundaryFc = {
        type: "FeatureCollection",
        features: boundaryFeatures,
      };
      style.sources.boundary = { type: "geojson", data: boundaryFc };

      // Add boundary fill layer
      style.layers.push({
        id: "boundary-fill",
        type: "fill",
        source: "boundary",
        paint: {
          "fill-color": theme === "light" ? "#3b82f6" : "#60a5fa",
          "fill-opacity": 0.1,
        },
      });

      // Add boundary line layer
      style.layers.push({
        id: "boundary-line",
        type: "line",
        source: "boundary",
        paint: {
          "line-color": theme === "light" ? "#3b82f6" : "#60a5fa",
          "line-width": 1,
          "line-dasharray": [1, 1],
        },
      });
    }

    // Calculate bounds from boundary, stops, or bikeshare stations
    // Note: Bikeshare markers are added dynamically via useEffect after data loads
    let bounds;
    if (boundaryFeatures && boundaryFeatures.length > 0) {
      const boundaryFc = {
        type: "FeatureCollection",
        features: boundaryFeatures,
      };
      bounds = bbox(boundaryFc);
    } else {
      // Combine stops and bikeshare for bounds
      const allFeatures = [...stopsFc.features];
      if (bikeshareStations.length > 0) {
        bikeshareStations.forEach((station) => {
          allFeatures.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [station.lon, station.lat],
            },
          });
        });
      }
      if (allFeatures.length > 0) {
        bounds = bbox({ type: "FeatureCollection", features: allFeatures });
      }
    }

    return { mapStyle: style, mapBounds: bounds };
  }, [theme, stopsWithData, boundaryFeatures, bikeshareStations]);

  // Fetch predictions
  useEffect(() => {
    if (stopsWithData.length === 0) {
      setLoading(false);
      return;
    }

    const fetchPredictions = async () => {
      const allPredictions = [];

      // Group stops by agency
      const stopsByAgency = _.groupBy(stopsWithData, "agency.agencySlug");

      for (const [agencySlug, stops] of Object.entries(stopsByAgency)) {
        const agency = agenciesLookup[agencySlug];
        if (!agency?.realTimeEnabled) continue;

        const stopMap = {};
        const apiStopIdentifiers = [];

        for (const stop of stops) {
          const apiStopId = getApiStopIdentifier(
            { stopId: stop.stopIdActual, stopCode: stop.stopCode },
            agency
          );
          if (!apiStopId) continue;
          apiStopIdentifiers.push(apiStopId);
          stopMap[apiStopId] = stop;
        }

        // Batch into groups of 10
        const batches = _.chunk(apiStopIdentifiers, 10);

        for (const batch of batches) {
          try {
            const response = await fetch(
              `/.netlify/functions/stop?stopId=${batch.join(
                ","
              )}&agency=${agencySlug}`
            );
            const responseData = await response.json();

            if (responseData["bustime-response"]?.prd) {
              const preds = responseData["bustime-response"].prd.map((p) => {
                const stopInfo = stopMap[p.stpid] || {};
                const displayStopName = stopInfo.label || stopInfo.stopName || p.stpnm;
                return {
                  ...p,
                  stpnm: displayStopName,
                  stopName: displayStopName,
                  stopLabel: stopInfo.label || null,
                  stopId: stopInfo.stopIdActual,
                  stopCode: stopInfo.stopCode,
                  stopIdentifier: stopInfo.stopId || p.stpid,
                  agencySlug,
                  agency,
                };
              });
              allPredictions.push(...preds);
            }
          } catch (err) {
            console.error(`Error fetching predictions for ${agencySlug}:`, err);
          }
        }
      }

      // Sort by arrival time first
      allPredictions.sort((a, b) => {
        const aMin = a.prdctdn === "DUE" ? 0 : parseInt(a.prdctdn);
        const bMin = b.prdctdn === "DUE" ? 0 : parseInt(b.prdctdn);
        return aMin - bMin;
      });

      // Dedupe by trip ID - keep only the earliest stop in the journey
      const seenTrips = new Set();
      const dedupedPredictions = allPredictions.filter((p) => {
        const tripId = p.tatripid || p.tripid || `${p.vid}-${p.rt}-${p.rtdir}`;
        if (seenTrips.has(tripId)) {
          return false;
        }
        seenTrips.add(tripId);
        return true;
      });

      setPredictions(dedupedPredictions);

      // Fetch vehicles for predictions
      const allVehicles = [];
      const predictionsByAgency = _.groupBy(allPredictions, "agencySlug");

      for (const [agencySlug, agencyPredictions] of Object.entries(
        predictionsByAgency
      )) {
        const vehicleIds = [
          ...new Set(agencyPredictions.map((p) => p.vid).filter(Boolean)),
        ];
        if (vehicleIds.length === 0) continue;

        try {
          const response = await fetch(
            `/.netlify/functions/vehicle?vehicleIds=${vehicleIds.join(
              ","
            )}&agency=${agencySlug}`
          );
          const vehicleData = await response.json();

          if (vehicleData["bustime-response"]?.vehicle) {
            const vehiclesWithAgency = vehicleData[
              "bustime-response"
            ].vehicle.map((v) => ({
              ...v,
              agencySlug,
            }));
            allVehicles.push(...vehiclesWithAgency);
          }
        } catch (err) {
          console.error(`Error fetching vehicles for ${agencySlug}:`, err);
        }
      }

      setVehicles(allVehicles);
      setLoading(false);
    };

    fetchPredictions();
  }, [stopsWithData, agenciesLookup, now]);

  // Fetch bikeshare station data
  useEffect(() => {
    const bikeshareFeeds = pageContext.bikeshareFeeds || [];
    if (bikeshareFeeds.length === 0) return;

    const fetchBikeshareData = async () => {
      const allStations = [];

      for (const feed of bikeshareFeeds) {
        try {
          // Fetch station information
          const infoResponse = await fetch(
            `${feed.feedUrl}/station_information.json`
          );
          const infoData = await infoResponse.json();
          const stationInfo = infoData.data.stations;

          // Fetch station status
          const statusResponse = await fetch(
            `${feed.feedUrl}/station_status.json`
          );
          const statusData = await statusResponse.json();
          const stationStatuses = statusData.data.stations;

          // Filter to only the stations we want and combine info + status
          for (const stationId of feed.stationIds) {
            const info = stationInfo.find((s) => s.station_id === stationId);
            const status = stationStatuses.find(
              (s) => s.station_id === stationId
            );

            if (info) {
              allStations.push({
                ...info,
                status,
                bikeshareSlug: feed.slug,
                bikeshareColor: feed.color,
                label: feed.labels[stationId] || null,
              });
            }
          }
        } catch (err) {
          console.error(
            `Error fetching bikeshare data from ${feed.feedUrl}:`,
            err
          );
        }
      }

      setBikeshareStations(allStations);
    };

    fetchBikeshareData();
  }, [pageContext.bikeshareFeeds, now]);

  // Helper to get e-bike count
  const getEbikeCount = (status) => {
    return (
      status?.vehicle_types_available
        ?.filter((v) => v.vehicle_type_id !== "ICONIC")
        .reduce((sum, v) => sum + v.count, 0) || 0
    );
  };

  // Get route data for a prediction
  const getRouteForPrediction = (prediction) => {
    const route = allRoutes.find(
      (r) =>
        r.agency?.slug?.current === prediction.agencySlug &&
        r.shortName === prediction.rt
    );
    if (route) {
      const rtdirLower = prediction.rtdir?.toLowerCase() || "";
      const direction = route.directions?.find((d) => {
        const descLower = d.directionDescription?.toLowerCase() || "";
        return (
          descLower === rtdirLower ||
          descLower.includes(rtdirLower) ||
          rtdirLower.includes(descLower.replace("bound", ""))
        );
      });

      return {
        displayShortName: route.shortName,
        routeShortName: route.shortName,
        routeLongName: route.longName,
        routeColor: route.color?.hex || "#000",
        routeTextColor: route.textColor?.hex || "#fff",
        direction: direction
          ? {
              directionHeadsign: direction.directionHeadsign,
              directionDescription: direction.directionDescription,
            }
          : { directionHeadsign: prediction.rtdir },
      };
    }
    return {
      displayShortName: prediction.rt,
      routeShortName: prediction.rt,
      routeLongName: "",
      routeColor: "#666",
      routeTextColor: "#fff",
      direction: { directionHeadsign: prediction.rtdir },
    };
  };

  // Update bikeshare source dynamically when data arrives
  useEffect(() => {
    if (!map.current || bikeshareStations.length === 0) return;

    const mapInstance = map.current.getMap();
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;

    const bikeshareFc = {
      type: "FeatureCollection",
      features: bikeshareStations.map((station) => ({
        type: "Feature",
        id: station.station_id,
        geometry: {
          type: "Point",
          coordinates: [station.lon, station.lat],
        },
        properties: {
          name: station.name?.replace("*", "") || "",
          stationId: station.station_id,
          bikeshareSlug: station.bikeshareSlug,
          label: station.label || "",
        },
      })),
    };

    // Add or update source
    if (mapInstance.getSource("bikeshare")) {
      mapInstance.getSource("bikeshare").setData(bikeshareFc);
    } else {
      mapInstance.addSource("bikeshare", {
        type: "geojson",
        data: bikeshareFc,
      });

      // Add layers
      mapInstance.addLayer({
        id: "bikeshare-point",
        type: "circle",
        source: "bikeshare",
        paint: {
          "circle-color": "#dc2626",
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });

      mapInstance.addLayer({
        id: "bikeshare-icon",
        type: "symbol",
        source: "bikeshare",
        layout: {
          "text-field": "🚲",
          "text-size": 10,
          "text-allow-overlap": true,
        },
      });
    }
  }, [bikeshareStations]);

  if (!mapStyle) {
    return <div className="p-4">Loading...</div>;
  }

  const initialViewState = mapBounds
    ? {
        bounds: mapBounds,
        fitBoundsOptions: { padding: 30, linear: true },
      }
    : {
        longitude: -83.05,
        latitude: 42.35,
        zoom: 16,
      };

  const handleMapLoad = (evt) => {
    const mapInstance = evt.target;
    if (mapBounds) {
      mapInstance.fitBounds(
        [
          [mapBounds[0], mapBounds[1]],
          [mapBounds[2], mapBounds[3]],
        ],
        { padding: 30, duration: 0, linear: true }
      );
    }
  };

  // Header for predictions list
  const predictionsHeader = (
    <div className="grayHeader flex items-center justify-between">
      <span>Departures</span>
      <span className="text-xs text-gray-400 dark:text-zinc-500">
        updates in {countdown}s
      </span>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-2 md:p-4">
      {/* Main content: Name/Departures and Map side by side */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* Left: Name + Departures */}
        <div className="md:col-span-2 flex flex-col min-h-0">
          <div className="mb-2 px-2 flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold">
              {transitCenter.name}
            </h1>
            {transitCenter.description && (
              <PortableText
                content={transitCenter.description}
                className="text-sm text-gray-600 dark:text-gray-400"
              />
            )}
          </div>
          <div className="px-2 min-h-0 flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto min-h-0">
              <PredictionsList
                predictions={predictions}
                vehicles={vehicles}
                loading={loading}
                header={predictionsHeader}
                getRouteData={getRouteForPrediction}
                showStopName={true}
                countdown={countdown}
              />
            </div>
            {/* Bikeshare availability - always visible */}
            {bikeshareStations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-zinc-700 flex-shrink-0">
                <div className="grayHeader">Bikeshare</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bikeshareStations.map((station) => {
                    const status = station.status;
                    const bikesAvailable = status?.num_bikes_available ?? "—";
                    const ebikesAvailable = getEbikeCount(status);
                    const docksAvailable = status?.num_docks_available ?? "—";

                    return (
                      <Link
                        key={station.station_id}
                        to={`/${station.bikeshareSlug}/station/${station.station_id}`}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={faBicycle}
                            className="text-white text-xs"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">
                            {station.label || station.name?.replace("*", "")}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                            <span
                              className="flex items-center gap-0.5"
                              title="Bikes available"
                            >
                              <FontAwesomeIcon icon={faBicycle} />
                              <span className="font-semibold tabular-nums">
                                {bikesAvailable}
                              </span>
                            </span>
                            {ebikesAvailable > 0 && (
                              <span
                                className="flex items-center gap-0.5"
                                title="E-bikes available"
                              >
                                <FontAwesomeIcon
                                  icon={faBolt}
                                  className="text-yellow-500"
                                />
                                <span className="font-semibold tabular-nums">
                                  {ebikesAvailable}
                                </span>
                              </span>
                            )}
                            <span
                              className="flex items-center gap-0.5"
                              title="Docks available"
                            >
                              <FontAwesomeIcon icon={faParking} />
                              <span className="font-semibold tabular-nums">
                                {docksAvailable}
                              </span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Map */}
        <div className="h-[300px] md:h-auto md:col-span-3">
          <Mapbox
            ref={map}
            mapLib={MapboxGL}
            mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
            mapStyle={mapStyle}
            initialViewState={initialViewState}
            onLoad={handleMapLoad}
            onZoom={(e) => console.log("zoom:", e.viewState.zoom.toFixed(2))}
          >
            <NavigationControl showCompass={false} />
          </Mapbox>
        </div>
      </div>

      {/* Additional content */}
      {transitCenter.content && (
        <div className="mt-6 px-2">
          <PortableText content={transitCenter.content} />
        </div>
      )}

      {/* Stop list - grouped by label */}
      <div className="mt-4 px-2 pb-4">
        <div className="columns-2 md:columns-3 lg:columns-6 gap-3 space-y-3 h-[30vh]" style={{ columnFill: "auto" }}>
          {Object.entries(
            _.groupBy(stopsWithData, (s) => s.label || "Other")
          ).map(([label, stops]) => {
            const isSingleStop = stops.length === 1;
            const singleStop = isSingleStop ? stops[0] : null;
            const formatStopName = (name) => {
              const parts = name?.split(" - ");
              return parts?.length > 1 ? parts[1] : name;
            };

            return (
              <div
                key={label}
                className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden break-inside-avoid"
              >
                <div className="bg-gray-100 dark:bg-zinc-800 px-2 py-1.5 font-semibold text-sm flex items-center gap-1.5">
                  {/* Stop label marker */}
                  {label && label !== "Other" && (
                    <div
                      className="w-6 h-6 flex-shrink-0 rounded-full bg-white border border-gray-400 flex items-center justify-center"
                    >
                      <span className="text-xs font-bold text-black leading-none">{label}</span>
                    </div>
                  )}
                  {isSingleStop ? (
                    <Link
                      to={`/${singleStop.agency.agencySlug}/stop/${singleStop.stopId}`}
                      className="flex-1 min-w-0 truncate hover:underline"
                    >
                      {formatStopName(singleStop.stopName)}
                    </Link>
                  ) : (
                    <span className="flex-1">{label && label !== "Other" ? "" : label}</span>
                  )}
                </div>
                {isSingleStop ? (
                  singleStop.routes?.length > 0 && (
                    <div className="px-2 py-1.5">
                      {singleStop.routes.length === 1 ? (
                        <RouteSlim
                          displayShortName={singleStop.routes[0].routeShortName}
                          routeShortName={singleStop.routes[0].routeShortName}
                          routeLongName={singleStop.routes[0].routeLongName}
                          routeColor={`#${singleStop.routes[0].routeColor || "666"}`}
                          routeTextColor={`#${singleStop.routes[0].routeTextColor || "fff"}`}
                          size="xs"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-0.5">
                          {singleStop.routes.map((route, ridx) => (
                            <RouteBadge
                              key={ridx}
                              route={{
                                displayShortName: route.routeShortName,
                                routeColor: `#${route.routeColor || "666"}`,
                                routeTextColor: `#${route.routeTextColor || "fff"}`,
                              }}
                              size="xs"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <ul className="list-none m-0">
                    {stops.map((stop, idx) => (
                      <li
                        key={idx}
                        className="flex flex-col gap-1 py-1.5 px-2 border-b border-gray-100 dark:border-zinc-800 last:border-none"
                      >
                        <Link
                          to={`/${stop.agency.agencySlug}/stop/${stop.stopId}`}
                          className="min-w-0 truncate hover:underline text-xs font-medium"
                        >
                          {formatStopName(stop.stopName)}
                        </Link>
                        {stop.routes?.length > 0 && (
                          stop.routes.length === 1 ? (
                            <RouteSlim
                              displayShortName={stop.routes[0].routeShortName}
                              routeShortName={stop.routes[0].routeShortName}
                              routeLongName={stop.routes[0].routeLongName}
                              routeColor={`#${stop.routes[0].routeColor || "666"}`}
                              routeTextColor={`#${stop.routes[0].routeTextColor || "fff"}`}
                              size="xs"
                            />
                          ) : (
                            <div className="flex flex-wrap gap-0.5">
                              {stop.routes.map((route, ridx) => (
                                <RouteBadge
                                  key={ridx}
                                  route={{
                                    displayShortName: route.routeShortName,
                                    routeColor: `#${route.routeColor || "666"}`,
                                    routeTextColor: `#${route.routeTextColor || "fff"}`,
                                  }}
                                  size="xs"
                                />
                              ))}
                            </div>
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const query = graphql`
  query TransitCenterQuery(
    $slug: String!
    $feedIndexes: [Int!]
    $stopIdentifiers: [String!]
  ) {
    sanityTransitCenter(slug: { current: { eq: $slug } }) {
      name
      slug {
        current
      }
      description: _rawDescription
      content: _rawContent
      boundary
      stops {
        stopId
        label
        agency {
          name
          slug {
            current
          }
          currentFeedIndex
          realTimeEnabled
          stopIdentifierField
          apiStopIdentifierField
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
      stops: stopsList(
        filter: {
          feedIndex: { in: $feedIndexes }
          and: [{ stopCode: { in: $stopIdentifiers } }]
        }
      ) {
        feedIndex
        stopId
        stopCode
        stopName
        stopLat
        stopLon
        routes: routesList {
          routeShortName
          routeLongName
          routeColor
          routeTextColor
        }
      }
    }
  }
`;

export default TransitCenterPage;

export const Head = ({ data }) => {
  const transitCenter = data.sanityTransitCenter;
  return (
    <>
      <title>{transitCenter?.name || "Transit Center"} | Detroit Transit</title>
      <meta
        name="description"
        content={`Real-time departures and information for ${transitCenter?.name}`}
      />
    </>
  );
};
