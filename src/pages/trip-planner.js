import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../hooks/ThemeContext";
import { faCompass, faChevronDown, faChevronUp, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../components/PageHeader";
import { useSanityRoutes } from "../hooks/useSanityRoutes";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
import _ from "lodash";
import {
  ItineraryCard,
  TripMap,
  LegStepper,
  FromToInputs,
  WhenInputs,
} from "../components/TripPlanner";

// Known mappings from OTP agency names to Sanity slugs
const AGENCY_NAME_MAP = {
  "detroit department of transportation": "ddot",
  "suburban mobility authority for regional transportation": "smart",
  "ann arbor area transportation authority": "theride",
  "the ann arbor area transportation authority": "theride",
  aaata: "theride",
  "transit windsor": "transit-windsor",
  "city of detroit": "ddot",
  "michigan flyer": "d2a2",
  dax: "d2a2",
  "detroit air xpress": "d2a2",
  "detroit ann arbor express": "d2a2",
};

// Match OTP agency to Sanity agency
const findSanityAgency = (sanityAgencies, otpAgency) => {
  if (!otpAgency) return null;

  const otpName = otpAgency.name?.toLowerCase();
  let match = null;

  match = sanityAgencies.find((sa) => sa.name?.toLowerCase() === otpName);

  if (!match && otpName && AGENCY_NAME_MAP[otpName]) {
    const slug = AGENCY_NAME_MAP[otpName];
    match = sanityAgencies.find((sa) => sa.slug?.current === slug);
  }

  if (!match && otpAgency.gtfsId) {
    const feedIndex = parseInt(otpAgency.gtfsId.split(":")[0]);
    if (!isNaN(feedIndex)) {
      match = sanityAgencies.find((sa) => sa.currentFeedIndex === feedIndex);
    }
  }

  if (!match && otpName) {
    match = sanityAgencies.find((sa) => {
      const sanityName = sa.name?.toLowerCase();
      return (
        sanityName &&
        (otpName.includes(sanityName) || sanityName.includes(otpName))
      );
    });
  }

  return match;
};

// Match OTP route to Sanity route
const findSanityRoute = (sanityRoutes, sanityAgencies, otpRoute) => {
  if (!otpRoute?.shortName && !otpRoute?.longName) return null;

  const sanityAgency = findSanityAgency(sanityAgencies, otpRoute.agency);

  let match = null;
  if (sanityAgency) {
    if (otpRoute.shortName) {
      match = sanityRoutes.find(
        (sr) =>
          sr.agency?.currentFeedIndex === sanityAgency.currentFeedIndex &&
          sr.shortName === otpRoute.shortName
      );
    }

    if (!match && otpRoute.longName) {
      match = sanityRoutes.find(
        (sr) =>
          sr.agency?.currentFeedIndex === sanityAgency.currentFeedIndex &&
          sr.longName === otpRoute.longName
      );
    }
  }

  return match;
};

// Find matching direction by directionId or headsign
const findMatchingDirection = (sanityRoute, headsign, directionId) => {
  if (!sanityRoute?.directions) return null;

  if (directionId !== undefined && directionId !== null) {
    const directionById = sanityRoute.directions.find(
      (d) =>
        d.directionId === directionId || d.directionId === String(directionId)
    );
    if (directionById) return directionById;
  }

  if (!headsign) {
    return sanityRoute.directions.length > 0 ? sanityRoute.directions[0] : null;
  }

  let direction = sanityRoute.directions.find(
    (d) => d.directionHeadsign === headsign
  );

  if (!direction) {
    direction = sanityRoute.directions.find(
      (d) =>
        headsign.includes(d.directionHeadsign) ||
        d.directionHeadsign?.includes(headsign)
    );
  }

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

      const sanityRoute = findSanityRoute(
        sanityRoutes,
        sanityAgencies,
        leg.route
      );
      if (sanityRoute) {
        const direction = findMatchingDirection(
          sanityRoute,
          leg.headsign,
          leg.trip?.directionId
        );
        const sanityAgency = sanityAgencies.find(
          (a) => a.slug?.current === sanityRoute.agency?.slug?.current
        );

        return {
          ...leg,
          route: {
            ...leg.route,
            shortName: sanityRoute.shortName || leg.route.shortName,
            color: sanityRoute.color?.hex?.replace("#", "") || leg.route.color,
            textColor: sanityRoute.textColor?.hex?.replace("#", "") || "FFFFFF",
            longName: sanityRoute.longName || leg.route.longName,
            agencySlug: sanityRoute.agency?.slug?.current,
            stopIdentifierField: sanityAgency?.stopIdentifierField || "stopId",
          },
          sanityHeadsign: direction?.directionHeadsign || null,
          sanityDirection: direction
            ? {
                directionHeadsign: direction.directionHeadsign,
                directionDescription: direction.directionDescription,
              }
            : null,
          sanityGeometry: direction?.directionShape || null,
        };
      }
      return leg;
    }),
  };
};

const TripPlannerPage = () => {
  const { theme } = useTheme();

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

  // Form state
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [settingPoint, setSettingPoint] = useState("origin");

  // Date/Time state
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split("T")[0]);
  const [time, setTime] = useState(
    now.toTimeString().split(" ")[0].substring(0, 5)
  );
  const [arriveBy, setArriveBy] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    const fromLat = params.get("fromLat");
    const fromLon = params.get("fromLon");
    const fromName = params.get("fromName");
    if (fromLat && fromLon) {
      setOrigin({
        name: fromName || `${fromLat}, ${fromLon}`,
        lat: fromLat,
        lon: fromLon,
      });
      setSettingPoint("destination");
    }

    const toLat = params.get("toLat");
    const toLon = params.get("toLon");
    const toName = params.get("toName");
    if (toLat && toLon) {
      setDestination({
        name: toName || `${toLat}, ${toLon}`,
        lat: toLat,
        lon: toLon,
      });
      if (fromLat && fromLon) {
        setSettingPoint(null);
      }
    }

    const dateParam = params.get("date");
    if (dateParam) setDate(dateParam);

    const timeParam = params.get("time");
    if (timeParam) setTime(timeParam);

    const arriveByParam = params.get("arriveBy");
    if (arriveByParam === "true") setArriveBy(true);
  }, []);

  // Update URL when trip params change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();

    if (origin) {
      params.set("fromLat", origin.lat);
      params.set("fromLon", origin.lon);
      if (origin.name) params.set("fromName", origin.name);
    }

    if (destination) {
      params.set("toLat", destination.lat);
      params.set("toLon", destination.lon);
      if (destination.name) params.set("toName", destination.name);
    }

    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (arriveBy) params.set("arriveBy", "true");

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, "", newUrl);
  }, [origin, destination, date, time, arriveBy]);

  // Results state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredLegIndex, setHoveredLegIndex] = useState(null);
  const [hoveredItineraryIndex, setHoveredItineraryIndex] = useState(null);
  const [focusedLegIndex, setFocusedLegIndex] = useState(null);
  const [sortBy, setSortBy] = useState("fastest");
  const [mobileInputsExpanded, setMobileInputsExpanded] = useState(true);
  const hoverTimeoutRef = React.useRef(null);

  // Sort itineraries
  const sortedItineraries = useMemo(() => {
    if (!itineraries.length) return [];
    return [...itineraries].sort((a, b) => {
      switch (sortBy) {
        case "walking":
          return (a.walkDistance || 0) - (b.walkDistance || 0);
        case "transfers":
          return (a.numberOfTransfers || 0) - (b.numberOfTransfers || 0);
        case "fastest":
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
      setOrigin({
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat: lat.toFixed(6),
        lon: lng.toFixed(6),
      });
      setSettingPoint("destination");
    } else if (settingPoint === "destination") {
      setDestination({
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat: lat.toFixed(6),
        lon: lng.toFixed(6),
      });
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
    setFocusedLegIndex(null);

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

  const debouncedSubmit = useMemo(
    () =>
      _.debounce(() => {
        handleSubmit();
      }, 500),
    [handleSubmit]
  );

  useEffect(() => {
    return () => {
      debouncedSubmit.cancel();
    };
  }, [debouncedSubmit]);

  useEffect(() => {
    if (origin && destination && date && time) {
      debouncedSubmit();
    }
  }, [origin, destination, date, time, arriveBy, debouncedSubmit]);

  // Auto-collapse mobile inputs when results arrive
  useEffect(() => {
    if (itineraries.length > 0) {
      setMobileInputsExpanded(false);
    }
  }, [itineraries.length]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOrigin({
          name: "Your current location",
          lat: latitude.toFixed(6),
          lon: longitude.toFixed(6),
        });
        setSettingPoint("destination");
      },
      (err) => {
        setError(
          "Unable to get your location. Please search or click the map."
        );
        console.error(err);
      }
    );
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setItineraries([]);
    setFocusedLegIndex(null);
  };

  const selectedItinerary = sortedItineraries[selectedIndex] || null;

  if (!theme) {
    return null;
  }

  // Sort buttons component
  const SortButtons = () => (
    <div className="flex gap-1">
      <button
        onClick={() => setSortBy("fastest")}
        className={`px-2 py-0.5 text-xs rounded ${
          sortBy === "fastest"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600"
        }`}
      >
        Fastest
      </button>
      <button
        onClick={() => setSortBy("walking")}
        className={`px-2 py-0.5 text-xs rounded ${
          sortBy === "walking"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600"
        }`}
      >
        Less walking
      </button>
      <button
        onClick={() => setSortBy("transfers")}
        className={`px-2 py-0.5 text-xs rounded ${
          sortBy === "transfers"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600"
        }`}
      >
        Fewer transfers
      </button>
    </div>
  );

  // Itinerary list component
  const ItineraryList = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500 dark:text-zinc-400">
          {sortedItineraries.length} option
          {sortedItineraries.length !== 1 && "s"}
        </div>
        <SortButtons />
      </div>
      <div className="space-y-2">
        {sortedItineraries.map((itinerary, index) => (
          <ItineraryCard
            key={index}
            itinerary={itinerary}
            isSelected={index === selectedIndex}
            isExpanded={index === selectedIndex}
            onClick={() => {
              setSelectedIndex(index === selectedIndex ? null : index);
              setFocusedLegIndex(null);
            }}
            onMouseEnter={() => setHoveredItineraryIndex(index)}
            onMouseLeave={() => setHoveredItineraryIndex(null)}
            onLegHover={index === selectedIndex ? handleLegHover : undefined}
            originName={origin?.name}
            destinationName={destination?.name}
          />
        ))}
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-sm">
      {origin && destination ? (
        loading ? (
          "Finding routes..."
        ) : (
          "No routes found"
        )
      ) : (
        <>
          <h4>How to use the Trip planner</h4>
          <p className="px-2">
            Choose where to start and begin your trip, then when you'd like to
            travel. You can choose to leave at or arrive by a certain time.
          </p>
          <p className="px-2">
            You'll then choose from one or more suggested trips.
          </p>
        </>
      )}
    </div>
  );

  // Shared props for FromToInputs
  const fromToProps = {
    origin,
    destination,
    setOrigin,
    setDestination,
    setSettingPoint,
    setItineraries,
    setFocusedLegIndex,
    getCurrentLocation,
    handleSwap,
  };

  // Shared props for WhenInputs
  const whenProps = {
    date,
    setDate,
    time,
    setTime,
    arriveBy,
    setArriveBy,
  };

  return (
    <div className="flex flex-col min-h-screen md:h-screen">
      <PageHeader title="Trip planner" icon={faCompass} />

      {/* Mobile: Input bar */}
      <div className="md:hidden bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        {origin && destination && !mobileInputsExpanded ? (
          /* Collapsed view */
          <button
            onClick={() => setMobileInputsExpanded(true)}
            className="w-full p-3 flex items-center justify-between text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{origin.name}</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-gray-400 dark:text-zinc-500 text-xs flex-shrink-0" />
                <span className="truncate text-sm font-medium">{destination.name}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                {arriveBy ? "Arrive by" : "Leave at"} {time} on {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 dark:text-zinc-500 ml-2 flex-shrink-0" />
          </button>
        ) : (
          /* Expanded view */
          <div className="p-2">
            <div className="flex flex-col gap-2">
              <FromToInputs {...fromToProps} />
              <WhenInputs {...whenProps} />
              {loading && (
                <div className="text-sm text-gray-500 dark:text-zinc-400">
                  Planning...
                </div>
              )}
            </div>
            {origin && destination && (
              <button
                onClick={() => setMobileInputsExpanded(false)}
                className="w-full mt-2 py-1 text-xs text-gray-500 dark:text-zinc-400 flex items-center justify-center gap-1"
              >
                <span>Collapse</span>
                <FontAwesomeIcon icon={faChevronUp} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border-b border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Desktop: Two-column layout */}
      <div className="hidden md:flex flex-1 min-h-0 gap-4">
        {/* Left column - Options (40%) */}
        <div className="w-2/5 flex-shrink-0 overflow-y-auto dark:border-zinc-800">
          {sortedItineraries.length > 0 ? <ItineraryList /> : <EmptyState />}
        </div>

        {/* Right column - Inputs + Map (60%) */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Inputs at top */}
          <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-zinc-900">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <FromToInputs {...fromToProps} stacked={true} />
              </div>
              <div className="flex-shrink-0">
                <WhenInputs {...whenProps} />
              </div>
            </div>
            {loading && (
              <div className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                Planning...
              </div>
            )}
          </div>

          {/* Map fills remaining space */}
          <div className="flex-1 min-h-0 overflow-hidden max-h-[50vh]">
            <TripMap
              itineraries={sortedItineraries}
              selectedIndex={selectedIndex}
              hoveredIndex={hoveredItineraryIndex}
              hoveredLegIndex={hoveredLegIndex}
              focusedLegIndex={focusedLegIndex}
              origin={origin}
              destination={destination}
              onClick={handleMapClick}
              cursor={settingPoint ? "crosshair" : "grab"}
            />
          </div>

          {/* Leg stepper */}
          {selectedItinerary && (
            <div className="flex-shrink-0">
              <LegStepper
                itinerary={selectedItinerary}
                focusedLegIndex={focusedLegIndex}
                setFocusedLegIndex={setFocusedLegIndex}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Map and results */}
      <div className="md:hidden flex flex-col">
        <div className="h-[220px] flex-shrink-0">
          <TripMap
            itineraries={sortedItineraries}
            selectedIndex={selectedIndex}
            hoveredIndex={hoveredItineraryIndex}
            hoveredLegIndex={hoveredLegIndex}
            focusedLegIndex={focusedLegIndex}
            origin={origin}
            destination={destination}
            onClick={handleMapClick}
            cursor={settingPoint ? "crosshair" : "grab"}
          />
        </div>

        {/* Mobile: Leg stepper */}
        {selectedItinerary && (
          <div className="border-t border-gray-200 dark:border-zinc-700">
            <LegStepper
              itinerary={selectedItinerary}
              focusedLegIndex={focusedLegIndex}
              setFocusedLegIndex={setFocusedLegIndex}
            />
          </div>
        )}

        {/* Mobile: Results panel */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          {sortedItineraries.length > 0 ? (
            <ItineraryList />
          ) : (
            <div className="text-gray-400 dark:text-zinc-500 text-sm">
              {origin && destination
                ? loading
                  ? "Finding routes..."
                  : "No routes found"
                : "Enter origin and destination to plan a trip"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlannerPage;
