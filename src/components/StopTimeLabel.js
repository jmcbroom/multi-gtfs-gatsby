import React from "react";
import { formatArrivalTime } from "../util";

const StopTimeLabel = ({ arrivalTime, ampm = false }) => {
  const timeStr = ampm
    ? formatArrivalTime(arrivalTime, true)
    : formatArrivalTime(arrivalTime, false);
  const isPM = formatArrivalTime(arrivalTime).indexOf("p") > -1;

  // Pad single-digit hours with a space so colons align
  const colonIndex = timeStr.indexOf(":");
  const hour = timeStr.slice(0, colonIndex);
  const rest = timeStr.slice(colonIndex); // includes colon, minutes, and optional am/pm
  const paddedHour = hour.length === 1 ? `\u2007${hour}` : hour; // figure space (same width as digit)

  return (
    <time
      className={`${isPM ? "font-semibold" : "font-base"} tabular-nums text-sm md:text-sm`}
      dateTime={formatArrivalTime(arrivalTime, false, true)}
    >
      {paddedHour}{rest}
    </time>
  );
};

export default StopTimeLabel;
