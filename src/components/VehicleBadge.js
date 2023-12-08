import React from "react";

const VehicleBadge = ({ busNumber }) => (
  <span className="text-gray-400 dark:text-zinc-500 font-light text-xs p-1 bg-gray-200 dark:bg-zinc-800 px-2">
  bus{"  "}
  <span className="font-normal font-mono ">
  #{busNumber}
  </span>
</span>
)

export default VehicleBadge;