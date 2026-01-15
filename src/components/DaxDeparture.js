import React, { useMemo } from "react";
import { useStaticQuery, graphql, Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane } from "@fortawesome/free-solid-svg-icons";
import { formatArrivalTime } from "../util";

const DaxDeparture = () => {
  const data = useStaticQuery(graphql`
    query DaxRosaParksQuery {
      sanityAgency(slug: { current: { eq: "d2a2" } }) {
        color {
          hex
        }
        textColor {
          hex
        }
      }
      postgres {
        stop(stopId: "4244491", feedIndex: 36) {
          stopName
          times: stopTimesByFeedIndexAndStopIdList(
            filter: { stopSequence: { equalTo: 1 } }
          ) {
            arrivalTime {
              hours
              minutes
              seconds
            }
            trip: tripByFeedIndexAndTripId {
              tripHeadsign
              serviceId
              calendar: calendarByFeedIndexAndServiceId {
                monday
                tuesday
                wednesday
                thursday
                friday
                saturday
                sunday
              }
            }
          }
        }
      }
    }
  `);

  const nextDeparture = useMemo(() => {
    const times = data?.postgres?.stop?.times || [];
    if (!times.length) return null;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayKey = dayMap[currentDay];

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Filter to today's service and find next departure
    const todayTimes = times
      .filter((t) => t.trip?.calendar?.[todayKey])
      .map((t) => ({
        ...t,
        totalMinutes: t.arrivalTime.hours * 60 + t.arrivalTime.minutes,
      }))
      .filter((t) => t.totalMinutes > currentMinutes)
      .sort((a, b) => a.totalMinutes - b.totalMinutes);

    return todayTimes[0] || null;
  }, [data]);

  if (!nextDeparture) {
    return null;
  }

  const minutesUntil = nextDeparture.totalMinutes - (new Date().getHours() * 60 + new Date().getMinutes());
  const bgColor = data?.sanityAgency?.color?.hex || "#0ea5e9";
  const textColor = data?.sanityAgency?.textColor?.hex || "#ffffff";

  return (
    <Link
      to="/dax"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <FontAwesomeIcon icon={faPlane} className="text-lg" />
      <div className="flex flex-col">
        <span className="text-xs opacity-80">DAX airport express bus to DTW</span>
        <span className="font-semibold">
          Next at {formatArrivalTime(nextDeparture.arrivalTime)} ({minutesUntil} min)
        </span>
        <span className="text-xs opacity-70">dax-bus.com</span>
      </div>
    </Link>
  );
};

export default DaxDeparture;
