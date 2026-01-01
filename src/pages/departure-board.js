import { graphql } from "gatsby";
import React, { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import FavoritesDashboard from "../components/FavoritesDashboard";
import { db } from "../db";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
import PageHeader from "../components/PageHeader";
import { faTableList, faGear, faChevronDown, faPlay, faPause, faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as Collapsible from "@radix-ui/react-collapsible";

const DEFAULT_MAX_PREDICTION_TIME = 35;

const DepartureBoardPage = ({ data }) => {
  const { sanityAgencies: sanityAgenciesRaw } = useSanityAgencies();
  const sanityAgencies = useMemo(
    () => sanityAgenciesRaw?.edges?.map((e) => e.node) || [],
    [sanityAgenciesRaw]
  );

  const bikeshareAgencies = useMemo(
    () => data.allSanityBikeshare?.edges?.map((e) => e.node) || [],
    [data.allSanityBikeshare]
  );

  const favoriteStops = useLiveQuery(() => db?.stops?.toArray());
  const favoriteBikeshareStops = useLiveQuery(() => db?.bikeshare?.toArray());

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [maxPredictionTime, setMaxPredictionTime] = useState(DEFAULT_MAX_PREDICTION_TIME);

  // Carousel state (lifted from FavoritesDashboard)
  const [carouselMode, setCarouselMode] = useState(true);
  const [pinnedPrediction, setPinnedPrediction] = useState(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("departureBoardSettings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.maxPredictionTime) {
          setMaxPredictionTime(settings.maxPredictionTime);
        }
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    }
  }, []);

  // Save settings to localStorage when changed
  const updateMaxPredictionTime = (value) => {
    const numValue = parseInt(value) || DEFAULT_MAX_PREDICTION_TIME;
    setMaxPredictionTime(numValue);
    localStorage.setItem("departureBoardSettings", JSON.stringify({ maxPredictionTime: numValue }));
  };

  const hasFavorites =
    favoriteStops?.length > 0 || favoriteBikeshareStops?.length > 0;

  // Handle play/pause toggle
  const handlePlayPauseToggle = () => {
    if (pinnedPrediction) {
      setPinnedPrediction(null);
    } else {
      setCarouselMode(!carouselMode);
    }
  };

  if (!hasFavorites) {
    return (
      <div className="h-full flex flex-col bg-gray-100 dark:bg-zinc-900">
        <div className="px-4">
          <PageHeader title="Departure board" icon={faTableList} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-700 dark:text-zinc-300 mb-4">
              No favorites yet
            </h1>
            <p className="text-gray-500 dark:text-zinc-400">
              Add stops and bike stations to your favorites to see them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Departure board" icon={faTableList} />
          <div className="flex items-center gap-2">
            {/* Play/Pause/Pinned toggle */}
            <button
              onClick={handlePlayPauseToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pinnedPrediction
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : carouselMode
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
              }`}
              title={pinnedPrediction ? "Unpin and resume carousel" : (carouselMode ? "Pause carousel" : "Start carousel")}
            >
              <FontAwesomeIcon
                icon={pinnedPrediction ? faThumbtack : (carouselMode ? faPause : faPlay)}
              />
              <span className="hidden sm:inline text-xs">
                {pinnedPrediction ? "Pinned" : (carouselMode ? "Playing" : "Paused")}
              </span>
            </button>

            {/* Settings dropdown */}
            <div className="relative">
              <Collapsible.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
                <Collapsible.Trigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                  <FontAwesomeIcon icon={faGear} />
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-xs transition-transform ${settingsOpen ? "rotate-180" : ""}`}
                  />
                </Collapsible.Trigger>
                <Collapsible.Content className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 p-4 z-50 min-w-[250px]">
                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Settings</div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                        Max prediction time
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="10"
                          max="90"
                          step="5"
                          value={maxPredictionTime}
                          onChange={(e) => updateMaxPredictionTime(e.target.value)}
                          className="flex-1 h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-12 text-right">
                          {maxPredictionTime} min
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                        Hide predictions more than {maxPredictionTime} minutes away
                      </p>
                    </div>
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <FavoritesDashboard
          favoriteStops={favoriteStops}
          favoriteBikeshare={favoriteBikeshareStops}
          sanityAgencies={sanityAgencies}
          bikeshareAgencies={bikeshareAgencies}
          widescreen={true}
          maxPredictionTime={maxPredictionTime}
          carouselMode={carouselMode}
          setCarouselMode={setCarouselMode}
          pinnedPrediction={pinnedPrediction}
          setPinnedPrediction={setPinnedPrediction}
        />
      </div>
    </div>
  );
};

export const query = graphql`
  {
    allSanityBikeshare {
      edges {
        node {
          name
          fullName
          feedUrl
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

export default DepartureBoardPage;
