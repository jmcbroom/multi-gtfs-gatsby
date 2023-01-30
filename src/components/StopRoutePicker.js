import React from "react";
import RouteListItem from "./RouteListItem";
const StopRoutePicker = ({ routes, agency, currentRoute, setCurrentRoute }) => {
  return (
    <div className="">
      <h3>Routes at this stop</h3>
      <div className="flex flex-col gap-1">
        {routes.map((route) => (
          <RouteListItem
            key={route.routeLongName}
            {...route}
            agency={agency}
          />
        ))}
      </div>
    </div>
  );
};

export default StopRoutePicker;
