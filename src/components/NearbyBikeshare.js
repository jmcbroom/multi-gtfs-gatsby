import React, { useState, useEffect } from "react";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBicycle, faBolt, faParking } from "@fortawesome/free-solid-svg-icons";

const NearbyBikeshare = ({ nearbyBikeshare }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!nearbyBikeshare?.feedUrl) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${nearbyBikeshare.feedUrl}/station_status.json`);
        const data = await res.json();
        const stationStatus = data.data.stations.find(
          (s) => s.station_id === nearbyBikeshare.station_id
        );
        setStatus(stationStatus);
      } catch (err) {
        console.error("Error fetching bikeshare status:", err);
      }
    };

    fetchStatus();
  }, [nearbyBikeshare]);

  if (!nearbyBikeshare) {
    return null;
  }

  const eBikes =
    status?.vehicle_types_available
      ?.filter((v) => v.vehicle_type_id !== "ICONIC")
      .reduce((sum, v) => sum + v.count, 0) || 0;

  const distanceText =
    nearbyBikeshare.distance < 100
      ? `${nearbyBikeshare.distance}m`
      : `${Math.round(nearbyBikeshare.distance / 10) * 10}m`;

  return (
    <div className="my-2">
      <div className="grayHeader">Nearby bikeshare</div>
      <div className="bg-white dark:bg-zinc-900 p-3">
        <div className="flex items-center gap-3">
          {/* Circular red badge with white bike icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faBicycle} className="text-white text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/${nearbyBikeshare.bikeshareSlug}/station/${nearbyBikeshare.station_id}`}
              className="font-medium hover:underline"
            >
              {nearbyBikeshare.name}
            </Link>
            <div className="text-xs text-gray-500 dark:text-zinc-400">
              {distanceText} away
            </div>
          </div>
          {status && (
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-300 flex-shrink-0">
              <span className="flex items-center gap-1" title="Bikes available">
                <FontAwesomeIcon icon={faBicycle} className="text-xs" />
                <span className="font-semibold">{status.num_bikes_available}</span>
              </span>
              <span className="flex items-center gap-1" title="E-bikes available">
                <FontAwesomeIcon icon={faBolt} className="text-xs" />
                <span className="font-semibold">{eBikes}</span>
              </span>
              <span className="flex items-center gap-1" title="Docks available">
                <FontAwesomeIcon icon={faParking} className="text-xs" />
                <span className="font-semibold">{status.num_docks_available}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyBikeshare;
