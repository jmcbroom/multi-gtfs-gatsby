import React from "react";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBicycle } from "@fortawesome/free-solid-svg-icons";

interface BikeshareCardProps {
  station: {
    id: string;
    station_id: string;
    name: string;
  };
  agency: {
    slug: { current: string };
    color?: { hex: string };
  };
  variant?: "default" | "card";
}

const BikeshareCard = ({ station, agency, variant = "default" }: BikeshareCardProps) => {
  const agencyColor = agency?.color?.hex || "#DC2626"; // Default to MoGo red

  if (variant === "default") {
    return (
      <div className="bg-gray-200 dark:bg-zinc-800 border-b border-dotted border-gray-400 dark:border-zinc-700 last:border-none">
        <div className="flex items-center px-2 py-2">
          <Link
            to={`/${agency.slug.current}/station/${station.station_id}`}
            className="flex items-center gap-2"
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faBicycle} className="text-white text-xs" />
            </div>
            <span className="plex font-semibold">{station.name}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div
      className="block rounded-lg border border-l-4 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:shadow-sm transition-all overflow-hidden"
      style={{ borderLeftColor: agencyColor }}
    >
      <div className="flex items-center gap-2 p-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
          <FontAwesomeIcon icon={faBicycle} className="text-white text-xs" />
        </div>
        <Link
          to={`/${agency.slug.current}/station/${station.station_id}`}
          className="font-medium text-gray-800 dark:text-zinc-200 hover:underline truncate"
        >
          {station.name}
        </Link>
      </div>
    </div>
  );
};

export default BikeshareCard;
