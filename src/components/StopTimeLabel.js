import React from "react";
import { formatArrivalTime } from "../util";

const StopTimeLabel = ({ arrivalTime }) => {
  return (
    <time
      className={formatArrivalTime(arrivalTime).indexOf("p") > -1 ? `font-semibold` : `font-base`}
      dateTime={formatArrivalTime(arrivalTime, false, true)}>
        {formatArrivalTime(arrivalTime).slice(0, -3)}
    </time>
  );
};

export default StopTimeLabel;
