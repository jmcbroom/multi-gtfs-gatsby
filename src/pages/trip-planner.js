import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import MapboxGL from "mapbox-gl/dist/mapbox-gl";
import Mapbox, { NavigationControl, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SearchBox } from "@mapbox/search-js-react";
import { useTheme } from "../hooks/ThemeContext";
import { faLocationDot, faArrowRight, faExchange, faPersonWalking, faBusSimple, faChevronDown, faChevronUp, faMapLocationDot } from '@fortawesome/free-solid-svg-icons';
import PageHeader from "../components/PageHeader";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import dark from "../styles/mapDark.json";
import light from "../styles/mapLight.json";
import ItineraryCard from "../components/ItineraryCard";
import TripMap from "../components/TripMap";

// Known mappings from OTP agency names to Sanity slugs
const AGENCY_NAME_MAP = {
  "detroit department of transportation": "ddot",
  "suburban mobility authority for regional transportation": "smart",
  "ann arbor area transportation authority": "theride",
  "the ann arbor area transportation authority": "theride",
  "transit windsor": "transit-windsor",
  "city of detroit": "ddot",
};

// Match OTP agency to Sanity agency
const findSanityAgency = (sanityAgencies, otpAgency) => {
  if (!otpAgency) return null;

  const otpName = otpAgency.name?.toLowerCase();
  let match = null;

  // Try exact name match first
  match = sanityAgencies.find(
    (sa) => sa.name?.toLowerCase() === otpName
  );

  // Try known name mappings
  if (!match && otpName && AGENCY_NAME_MAP[otpName]) {
    const slug = AGENCY_NAME_MAP[otpName];
    match = sanityAgencies.find((sa) => sa.slug?.current === slug);
  }

  // Try matching by gtfsId (format: "feedIndex:agencyId")
  if (!match && otpAgency.gtfsId) {
    const feedIndex = parseInt(otpAgency.gtfsId.split(':')[0]);
    if (!isNaN(feedIndex)) {
      match = sanityAgencies.find((sa) => sa.currentFeedIndex === feedIndex);
    }
  }

  // Try partial match (OTP name contains Sanity name or vice versa)
  if (!match && otpName) {
    match = sanityAgencies.find(
      (sa) => {
        const sanityName = sa.name?.toLowerCase();
        return sanityName && (otpName.includes(sanityName) || sanityName.includes(otpName));
      }
    );
  }

  console.log('findSanityAgency:', { otpAgency, match: match?.name || 'NO MATCH' });
  return match;
};

// Match OTP route to Sanity route by agency and shortName
const findSanityRoute = (sanityRoutes, sanityAgencies, otpRoute) => {
  if (!otpRoute?.shortName) return null;

  // First find the matching agency
  const sanityAgency = findSanityAgency(sanityAgencies, otpRoute.agency);

  let match = null;
  if (sanityAgency) {
    // Match by both agency feedIndex and route shortName
    match = sanityRoutes.find(
      (sr) =>
        sr.agency?.currentFeedIndex === sanityAgency.currentFeedIndex &&
        sr.shortName === otpRoute.shortName
    );
  }

  // Fallback: match by shortName only (may be ambiguous)
  if (!match) {
    match = sanityRoutes.find((sr) => sr.shortName === otpRoute.shortName);
  }

  console.log('findSanityRoute:', {
    otpRoute: otpRoute.shortName,
    otpAgency: otpRoute.agency?.name,
    sanityAgency: sanityAgency?.name,
    matchedRoute: match?.shortName || 'NO MATCH',
    matchedAgency: match?.agency?.slug?.current || 'N/A',
    hasDirections: match?.directions?.length || 0
  });

  return match;
};

// Find matching direction by directionId or headsign
const findMatchingDirection = (sanityRoute, headsign, directionId) => {
  if (!sanityRoute?.directions) return null;

  // Try matching by directionId first (most reliable)
  if (directionId !== undefined && directionId !== null) {
    const directionById = sanityRoute.directions.find(
      (d) => d.directionId === directionId || d.directionId === String(directionId)
    );
    if (directionById) return directionById;
  }

  if (!headsign) {
    // No headsign to match, fall back to first direction
    return sanityRoute.directions.length > 0 ? sanityRoute.directions[0] : null;
  }

  // Try exact headsign match
  let direction = sanityRoute.directions.find(
    (d) => d.directionHeadsign === headsign
  );

  // Try partial match (headsign contains direction headsign or vice versa)
  if (!direction) {
    direction = sanityRoute.directions.find(
      (d) => headsign.includes(d.directionHeadsign) ||
        d.directionHeadsign?.includes(headsign)
    );
  }

  // Fall back to first direction if no match
  if (!direction && sanityRoute.directions.length > 0) {
    direction = sanityRoute.directions[0];
  }

  return direction;
};

// Enrich itinerary legs with Sanity route data
const enrichItineraryWithSanity = (itinerary, sanityRoutes, sanityAgencies) => {
  return {
    ...itinerary,
    legs: itinerary.legs.map((leg) => {
      if (leg.mode === "WALK" || !leg.route) return leg;

      const sanityRoute = findSanityRoute(sanityRoutes, sanityAgencies, leg.route);
      if (sanityRoute) {
        const direction = findMatchingDirection(sanityRoute, leg.headsign, leg.trip?.directionId);
        const sanityAgency = sanityAgencies.find(
          (a) => a.slug?.current === sanityRoute.agency?.slug?.current
        );

        return {
          ...leg,
          route: {
            ...leg.route,
            color: sanityRoute.color?.hex?.replace("#", "") || leg.route.color,
            textColor: sanityRoute.textColor?.hex?.replace("#", "") || "FFFFFF",
            longName: sanityRoute.longName || leg.route.longName,
            agencySlug: sanityRoute.agency?.slug?.current,
            stopIdentifierField: sanityAgency?.stopIdentifierField || "stopId",
          },
          // Use Sanity headsign if available, fall back to OTP headsign
          sanityHeadsign: direction?.directionHeadsign || null,
          // Include full direction object for RouteSlim component
          sanityDirection: direction ? {
            directionHeadsign: direction.directionHeadsign,
            directionDescription: direction.directionDescription,
          } : null,
          // Include Sanity geometry if available (will clip later)
          sanityGeometry: direction?.directionShape || null,
        };
      }
      return leg;
    }),
  };
};

// Detroit metro bounding box [west, south, east, north]
const DETROIT_BBOX = [-84.159, 41.723, -82.375, 43.168];

const TripPlannerPage = () => {
  const map = useRef();
  const { theme } = useTheme();

  // Get Sanity routes and agencies for color/name matching
  const { sanityRoutes: sanityRoutesData } = useSanityRoutes();
  const sanityRoutes = useMemo(
    () => sanityRoutesData?.edges?.map((e) => e.node) || [],
    [sanityRoutesData]
  );

  const { sanityAgencies: sanityAgenciesData } = useSanityAgencies();
  const sanityAgencies = useMemo(
    () => sanityAgenciesData?.edges?.map((e) => e.node) || [],
    [sanityAgenciesData]
  );

  // Form state - locations include name + coordinates
  const [origin, setOrigin] = useState(null); // { name, lat, lon }
  const [destination, setDestination] = useState(null); // { name, lat, lon }
  const [settingPoint, setSettingPoint] = useState("origin"); // "origin" | "destination" | null

  // Handle geocoder result selection
  const handleOriginRetrieve = (result) => {
    const feature = result.features?.[0];
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      setOrigin({
        name: feature.properties.name || feature.properties.full_address,
        lat: lat.toFixed(6),
        lon: lon.toFixed(6)
      });
      setSettingPoint("destination");
    }
  };

  const handleDestinationRetrieve = (result) => {
    const feature = result.features?.[0];
    if (feature) {
      const [lon, lat] = feature.geometry.coordinates;
      setDestination({
        name: feature.properties.name || feature.properties.full_address,
        lat: lat.toFixed(6),
        lon: lon.toFixed(6)
      });
      setSettingPoint(null);
    }
  };

  // Date/Time state - using native inputs
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [time, setTime] = useState(now.toTimeString().split(' ')[0].substring(0, 5));
  const [arriveBy, setArriveBy] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    const fromLat = params.get('fromLat');
    const fromLon = params.get('fromLon');
    const fromName = params.get('fromName');
    if (fromLat && fromLon) {
      setOrigin({
        name: fromName || `${fromLat}, ${fromLon}`,
        lat: fromLat,
        lon: fromLon
      });
      setSettingPoint('destination');
    }

    const toLat = params.get('toLat');
    const toLon = params.get('toLon');
    const toName = params.get('toName');
    if (toLat && toLon) {
      setDestination({
        name: toName || `${toLat}, ${toLon}`,
        lat: toLat,
        lon: toLon
      });
      if (fromLat && fromLon) {
        setSettingPoint(null);
      }
    }

    const dateParam = params.get('date');
    if (dateParam) setDate(dateParam);

    const timeParam = params.get('time');
    if (timeParam) setTime(timeParam);

    const arriveByParam = params.get('arriveBy');
    if (arriveByParam === 'true') setArriveBy(true);
  }, []);

  // Update URL when trip params change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();

    if (origin) {
      params.set('fromLat', origin.lat);
      params.set('fromLon', origin.lon);
      if (origin.name) params.set('fromName', origin.name);
    }

    if (destination) {
      params.set('toLat', destination.lat);
      params.set('toLon', destination.lon);
      if (destination.name) params.set('toName', destination.name);
    }

    if (date) params.set('date', date);
    if (time) params.set('time', time);
    if (arriveBy) params.set('arriveBy', 'true');

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [origin, destination, date, time, arriveBy]);

  // Results state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredLegIndex, setHoveredLegIndex] = useState(null);
  const [hoveredItineraryIndex, setHoveredItineraryIndex] = useState(null);
  const [sortBy, setSortBy] = useState('fastest'); // 'fastest' | 'walking' | 'transfers'
  const hoverTimeoutRef = React.useRef(null);

  // Sort itineraries based on selected criteria
  const sortedItineraries = useMemo(() => {
    if (!itineraries.length) return [];
    return [...itineraries].sort((a, b) => {
      switch (sortBy) {
        case 'walking':
          return (a.walkDistance || 0) - (b.walkDistance || 0);
        case 'transfers':
          return (a.numberOfTransfers || 0) - (b.numberOfTransfers || 0);
        case 'fastest':
        default:
          return (a.duration || 0) - (b.duration || 0);
      }
    });
  }, [itineraries, sortBy]);

  const handleLegHover = (index) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (index === null) {
      // Delay clearing the hover to prevent flickering when moving between elements
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredLegIndex(null);
      }, 50);
    } else {
      setHoveredLegIndex(index);
    }
  };

  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat;

    if (settingPoint === "origin") {
      setOrigin({ name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat: lat.toFixed(6), lon: lng.toFixed(6) });
      setSettingPoint("destination");
    } else if (settingPoint === "destination") {
      setDestination({ name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat: lat.toFixed(6), lon: lng.toFixed(6) });
      setSettingPoint(null);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!origin || !destination) {
      return;
    }

    setLoading(true);
    setError(null);
    setItineraries([]);
    setSelectedIndex(0);

    try {
      const response = await fetch("/.netlify/functions/tripplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originLat: origin.lat,
          originLon: origin.lon,
          destLat: destination.lat,
          destLon: destination.lon,
          date,
          time,
          arriveBy,
        }),
      });

      const data = await response.json();

      if (data.errors) {
        setError(data.errors[0]?.message || "Error planning trip");
        return;
      }

      const edges = data.data?.planConnection?.edges || [];
      const routingErrors = data.data?.planConnection?.routingErrors || [];

      if (routingErrors.length > 0) {
        setError(routingErrors.map((e) => e.description).join(", "));
        return;
      }

      if (edges.length === 0) {
        setError("No routes found for this trip");
        return;
      }

      // Enrich itineraries with Sanity route data (colors, names, geometry)
      const enrichedItineraries = edges.map((e) =>
        enrichItineraryWithSanity(e.node, sanityRoutes, sanityAgencies)
      );
      setItineraries(enrichedItineraries);
    } catch (err) {
      setError("Failed to connect to trip planner");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, date, time, arriveBy, sanityRoutes, sanityAgencies]);

  // Debounced version of handleSubmit to prevent rapid API calls
  const debouncedSubmit = useMemo(
    () => _.debounce(() => {
      handleSubmit();
    }, 500),
    [handleSubmit]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSubmit.cancel();
    };
  }, [debouncedSubmit]);

  // Auto-submit when both origin and destination are set
  useEffect(() => {
    if (origin && destination && date && time) {
      debouncedSubmit();
    }
  }, [origin, destination, date, time, arriveBy, debouncedSubmit]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOrigin({
          name: "Current Location",
          lat: latitude.toFixed(6),
          lon: longitude.toFixed(6),
        });
        setSettingPoint("destination");
      },
      (err) => {
        setError("Unable to get your location. Please search or click the map.");
        console.error(err);
      }
    );
  };

  const resetPoints = () => {
    setOrigin(null);
    setDestination(null);
    setSettingPoint("origin");
    setItineraries([]);
    setError(null);
  };

  const selectedItinerary = sortedItineraries[selectedIndex] || null;

  if (!theme) {
    return null;
  }

  const baseStyle = theme === "dark" ? _.cloneDeep(dark) : _.cloneDeep(light);

  const initialViewState = {
    longitude: -83.05,
    latitude: 42.35,
    zoom: 11,
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Trip planner" icon={faMapLocationDot} />

      {/* Input bar - stacked on mobile, row on desktop */}
      <div className="bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Origin */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-1 font-medium">From</div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">A</div>
              {origin ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm truncate">{origin.name}</span>
                  <button
                    onClick={() => { setOrigin(null); setSettingPoint("origin"); setItineraries([]); }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-1">
                  <div className="flex-1">
                    <SearchBox
                      accessToken={process.env.MAPBOX_ACCESS_TOKEN}
                      options={{
                        bbox: DETROIT_BBOX,
                        proximity: { lng: -83.05, lat: 42.35 },
                      }}
                      placeholder="From..."
                      onRetrieve={handleOriginRetrieve}
                    />
                  </div>
                  <button
                    onClick={getCurrentLocation}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded hover:bg-gray-200 dark:hover:bg-zinc-700"
                    title="Use current location"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                      <path strokeWidth="2" d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-1 font-medium">To</div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">B</div>
              {destination ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm truncate">{destination.name}</span>
                  <button
                    onClick={() => { setDestination(null); setSettingPoint("destination"); setItineraries([]); }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <SearchBox
                  accessToken={process.env.MAPBOX_ACCESS_TOKEN}
                  options={{
                    bbox: DETROIT_BBOX,
                    proximity: { lng: -83.05, lat: 42.35 },
                  }}
                  placeholder="To..."
                  onRetrieve={handleDestinationRetrieve}
                />
              )}
            </div>
          </div>

          {/* DateTime with Leave/Arrive toggle */}
          <div className="flex-1 md:flex-[1.4] min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-1 font-medium">When</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-28 px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2 mt-1">
              <button
                className={`text-xs ${!arriveBy ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                onClick={() => setArriveBy(false)}
              >
                Leave at
              </button>
              <span className="text-xs text-gray-400 dark:text-zinc-600">|</span>
              <button
                className={`text-xs ${arriveBy ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                onClick={() => setArriveBy(true)}
              >
                Arrive by
              </button>
            </div>
          </div>


          {/* Loading indicator */}
          {loading && (
            <div className="text-sm text-gray-500 dark:text-zinc-400">
              Planning...
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {
        error && (
          <div className="bg-red-100 dark:bg-red-900/30 border-b border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 text-sm">
            {error}
          </div>
        )
      }

      {/* Main content: map first on mobile, side-by-side on desktop */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Map panel - shown first on mobile, 60% on desktop */}
        <div className="h-[300px] md:h-[500px] md:self-start md:sticky md:top-4 md:w-3/5 md:order-2">
          <TripMap
            itineraries={sortedItineraries}
            selectedIndex={selectedIndex}
            hoveredIndex={hoveredItineraryIndex}
            hoveredLegIndex={hoveredLegIndex}
            origin={origin}
            destination={destination}
            onClick={handleMapClick}
            cursor={settingPoint ? "crosshair" : "grab"}
          />
        </div>

        {/* Results panel - 40% on desktop, below map on mobile */}
        <div className="flex-1 md:w-2/5 md:order-1 overflow-y-auto p-4 border-t md:border-t-0 md:border-r border-gray-200 dark:border-zinc-800">
          {sortedItineraries.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500 dark:text-zinc-400">
                  {sortedItineraries.length} option{sortedItineraries.length !== 1 && "s"}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSortBy('fastest')}
                    className={`px-2 py-0.5 text-xs rounded ${sortBy === 'fastest' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600'}`}
                  >
                    Fastest
                  </button>
                  <button
                    onClick={() => setSortBy('walking')}
                    className={`px-2 py-0.5 text-xs rounded ${sortBy === 'walking' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600'}`}
                  >
                    Less walking
                  </button>
                  <button
                    onClick={() => setSortBy('transfers')}
                    className={`px-2 py-0.5 text-xs rounded ${sortBy === 'transfers' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600'}`}
                  >
                    Fewer transfers
                  </button>
                </div>
              </div>
              {sortedItineraries.map((itinerary, index) => (
                <ItineraryCard
                  key={index}
                  itinerary={itinerary}
                  index={index}
                  isSelected={index === selectedIndex}
                  isExpanded={index === selectedIndex}
                  onClick={() => setSelectedIndex(index === selectedIndex ? null : index)}
                  onMouseEnter={() => setHoveredItineraryIndex(index)}
                  onMouseLeave={() => setHoveredItineraryIndex(null)}
                  onLegHover={index === selectedIndex ? handleLegHover : undefined}
                  originName={origin?.name}
                  destinationName={destination?.name}
                />
              ))}
            </div>
          ) : (
            <div className="text-gray-400 dark:text-zinc-500 text-sm">
              {origin && destination ? (
                loading ? "Finding routes..." : "No routes found"
              ) : (
                "Enter origin and destination to plan a trip"
              )}
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default TripPlannerPage;
