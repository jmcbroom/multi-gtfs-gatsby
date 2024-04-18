import React from "react";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBicycle, faBus } from "@fortawesome/free-solid-svg-icons";
import RouteSlim from "./RouteSlim";

const BikeshareCard = ({ station, agency }) => {
  return (
    <div key={station.id} className="bg-gray-200 dark:bg-zinc-800 border-b border-dotted border-gray-400 dark:border-zinc-700 last:border-none p-1">
      <div className="flex items-center justify-between px-2 py-1">
        <Link
          to={`/${agency.slug.current}/station/${station.id}`}
        >
          <FontAwesomeIcon icon={faBicycle} className="mr-2 text-gray-500" />
          <span className="plex font-semibold">{station.name}</span>
        </Link>
      </div>
    </div>
  );
};

export default BikeshareCard;
