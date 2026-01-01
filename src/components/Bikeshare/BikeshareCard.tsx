import React from "react";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBicycle } from "@fortawesome/free-solid-svg-icons";

const BikeshareCard = ({ station, agency, onDelete }) => {
  return (
    <div key={station.id} className="relative bg-gray-200 dark:bg-zinc-800 border-b border-dotted border-gray-400 dark:border-zinc-700 last:border-none">
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors"
          title="Remove from favorites"
        >
          &times;
        </button>
      )}
      <div className="flex items-center justify-between px-2 py-2 pr-6">
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
};

export default BikeshareCard;
