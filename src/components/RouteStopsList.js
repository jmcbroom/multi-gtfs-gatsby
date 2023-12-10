import React from "react";
import StopListItem from "./StopListItem";

const RouteStopsList = ({ longTrips, direction, routeColor, agency, className, small = false, timepointsOnly = false, link=true }) => {

  let modelTrip = longTrips.filter(lt => lt.directionId === parseInt(direction))[0];

  if (modelTrip === undefined) {
    modelTrip=longTrips[0]
  }
  let times = modelTrip.stopTimes
  
  if(timepointsOnly) {
    times = times.filter(st => st.timepoint === 1)
  }

  return (
    <div className={small ? "grid w-100 col-span-2 overflow-y-auto px-2 text-sm section-scroll" : "grid w-100 col-span-2 overflow-y-auto px-2 section-scroll"}>
      {times.map((stopTime, i) => (
        <StopListItem key={stopTime.stopSequence} {...{ stopTime, routeColor }} small={small} agency={agency} link={link}/>
      ))}
    </div>
  );
};

export default RouteStopsList;