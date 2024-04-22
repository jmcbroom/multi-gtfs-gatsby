import React from "react";
import { formatArrivalTime } from "../util";

const StopTimeLabel = ({ arrivalTime, ampm=false }) => {
  return (
    <time
      className={formatArrivalTime(arrivalTime).indexOf("p") > -1 ? `font-semibold tabular` : `font-base tabular`}
      dateTime={formatArrivalTime(arrivalTime, false, true)}>
        {ampm ? formatArrivalTime(arrivalTime, true) : formatArrivalTime(arrivalTime, false)}
    </time>
  );
};

export default StopTimeLabel;
