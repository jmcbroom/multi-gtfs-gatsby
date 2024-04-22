import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWheelchair } from "@fortawesome/free-solid-svg-icons";

const StopAccessibility = ({ stop }) => {

  // only show for DDOT and SMART stops
  if (!["ddot", "smart"].includes(stop.agency.agencySlug)) {
    return;
  };

  let agencySlug = stop.agency.agencySlug;
  let stopId = stop.stopId;

  let itmaUrl = `https://isthemetroaccessible.com/stop/${agencySlug}-${stopId}`;

  // this is currently erroring due to CORS, but turn back on when possible
  // useEffect(() => {
  //   fetch("https://isthemetroaccessible.com/api/stop-details", {
  //     headers: {
  //       "content-type": "application/json",
  //       "Referer": "https://isthemetroaccessible.com/stop/ddot-3617",
  //     },
  //     body: `{\"id\":\"${agencySlug}-${stopId}\"}`,
  //     method: "POST",
  //   })
  //     .then((response) => {
  //       console.log(response);
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //     });
  // }, []);

  return (
    <div className="mt-4 bg-gray-100 dark:bg-zinc-900">
      <h4>
        Stop accessibility
      </h4>
      <div className="p-2 py-3 text-sm flex flex-col md:flex-row items-start md:items-center gap-1">
        <span>
          Check this bus stop's accessibility on{" "}
        <a
          href={itmaUrl}
          className="font-semibold"
        >
          is the metro accessible
          {/* TODO: flip back and forth between dark and light? */}
          <img src="https://isthemetroaccessible.com/images/favicon-dark.png" alt="isthemetroaccessible logo" className="w-4 ml-1 -mt-1 inline-block" />
        </a>
        </span>
      </div>
    </div>
  );
};

export default StopAccessibility;
