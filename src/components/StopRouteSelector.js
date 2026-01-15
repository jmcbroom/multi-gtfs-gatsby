import React from "react";
import RouteSlim from "./RouteSlim";

const StopRouteSelector = ({ routes, agency, selectedRoute, setSelectedRoute }) => {
  return (
    <div>
      <div className="grayHeader">Routes that stop here</div>
      <div className="p-2 bg-gray-50 dark:bg-zinc-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {routes.map((route) => (
            <button
              key={route.displayShortName}
              onClick={() => setSelectedRoute(selectedRoute === route.routeShortName ? null : route.routeShortName)}
              className={`p-2 rounded-lg transition-colors text-left ${
                selectedRoute === route.routeShortName
                  ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
                  : 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-gray-400 dark:hover:border-zinc-500'
              }`}
            >
              <RouteSlim {...route} agency={agency} direction={route.directions[0]} size="small" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StopRouteSelector;
