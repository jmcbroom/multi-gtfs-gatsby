import React from "react";
import { Link } from "gatsby";
import RouteBadge from "./RouteBadge";

const RouteCard = ({ route, agency, onDelete }) => {

  let url = `/${route.displayShortName.toLowerCase()}`;

  if(agency && agency?.slug?.current !== 'd2a2'){
    url = `/${agency.slug.current}/route/${route.displayShortName}`;
  }

  if (route.displayShortName === 'DPM'){
    url = '/people-mover';
  }

  return (
    <div key={route.id} className="relative bg-gray-100 dark:bg-zinc-900 border-b border-dotted border-gray-400 dark:border-zinc-700 last:border-none">
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors"
          title="Remove from favorites"
        >
          &times;
        </button>
      )}
      <div className="flex items-center justify-between px-2 py-3 pr-6">
        <Link
          to={url}
          className="flex items-center gap-3 flex-grow"
        >
          <RouteBadge route={route} size="medium" />
          <span className="font-semibold">{route.routeLongName}</span>
        </Link>
      </div>
    </div>
  );
};

export default RouteCard;
