import React from "react";
import { getServiceDays } from "../util";

const FeedInfo = ({ agency }) => {

  let { feedIndex, feedInfo } = agency;
  let { serviceCalendars } = feedInfo

  let serviceDays = getServiceDays(serviceCalendars)

  return (
    <div>
      <h1>Feed information: index {feedIndex}</h1>
      <h2>Service IDs</h2>
      <ul>
        {Object.entries(serviceDays).map((e) => {
          return (
            <div>{e[0]}: {e[1]}</div>
          )
        })}
      </ul>
    </div>
  )
}

export default FeedInfo;