import { graphql } from "gatsby";
import React, { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import FavoritesDashboard from "../components/FavoritesDashboard";
import { db } from "../db";
import { useSanityAgencies } from "../hooks/useSanityAgencies";
import PageHeader from "../components/PageHeader";
import { faTableList, faPlay, faPause, faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

  const [maxPredictionTime] = useState(DEFAULT_MAX_PREDICTION_TIME);

  // Carousel state (lifted from FavoritesDashboard)
  const [carouselMode, setCarouselMode] = useState(true);
  const [pinnedPrediction, setPinnedPrediction] = useState(null);

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
      <div className="min-h-screen min-h-dvh flex flex-col bg-gray-100 dark:bg-zinc-900">
        <PageHeader title="Departure board" icon={faTableList} fullWidth />
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
    <div className="h-screen h-dvh flex flex-col">
      <PageHeader title="Departure board" icon={faTableList} fullWidth className="flex-shrink-0">
        {/* Play/Pause/Pinned toggle */}
        <button
          onClick={handlePlayPauseToggle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
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
          <span className="hidden sm:inline">
            {pinnedPrediction ? "Pinned" : (carouselMode ? "Playing" : "Paused")}
          </span>
        </button>
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-hidden">
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

export const Head = () => {
  const title = "Departure Board | transit.det.city";
  const description = "View upcoming departures for your favorite stops.";
  const url = "https://transit.det.city/departure-board";

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
