import React from "react";

const FeedInfo = ({ agency }) => {

  let { feedIndex, feedInfo } = agency;
  let { serviceCalendars } = feedInfo

  // let's figure out which service ID is which
  let serviceDays = {
    weekday: null,
    saturday: null,
    sunday: null
  }

  let weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  serviceCalendars.forEach(sc => {
    // evaluate all weekdays of the service calendar
    let weekdayMatches = weekdays.map(day => sc[day] === 1)

    // all weekdayMatches are true => assign weekday
    if (weekdayMatches.every(e => e)) {
      serviceDays.weekday = sc.serviceId
    }
    // all weekdayMatches are false + match only Sat or Sun
    if (weekdayMatches.every(e => !e) && sc.saturday === 1 && sc.sunday === 0) {
      serviceDays.saturday = sc.serviceId
    }
    if (weekdayMatches.every(e => !e) && sc.sunday === 1 && sc.saturday === 0) {
      serviceDays.sunday = sc.serviceId
    }    
  })

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