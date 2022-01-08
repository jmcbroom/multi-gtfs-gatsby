
/**
 * Convert the GraphQL arrivalTime to a human-readable string.
 * @param {arrivalTime} time 
 * @param {boolean} showAp 
 * @returns 
 */
export const formatArrivalTime = (time, showAp=true) => {
  let hour = time.hours;
  let minutes = time.minutes ? time.minutes.toString().padStart(2, "0") : "00";
  let ap = "am";

  // vary hours & am/pm based on what hour it is
  // gtfs has hours that are greater than 24
  if (time.hours < 12 && time.hours > 0) {
    hour = time.hours;
    ap = "am";
  } else if (time.hours > 12 && time.hours < 24) {
    hour = time.hours - 12;
    ap = "pm";
  } else if (time.hours % 12 === 0) {
    hour = 12;
    ap = time.hours === 12 ? "pm" : "am";
  } else if (time.hours >= 24) {
    hour = time.hours - 24;
    ap = "am";
  }

  return `${hour}:${minutes} ${ap}`;
};

/**
 * Sort an array of trips chronologically.
 * @param {*} trips: must have an array of stopTimes attached
 * @returns the same array, but sorted
 */
export const sortTripsByFrequentTimepoint = (trips) => {
  const mostTimepointsTrip = trips.sort((a, b) => {
    return b.stopTimes.length - a.stopTimes.length;
  })[0];

  // get the timepoints for that trip
  const timepoints = mostTimepointsTrip.stopTimes;

  // sort by frequency
  let stopIdOccurences = trips.map(t => t.stopTimes.map(s => s.stop.stopId));

  let defaultTimepoint = 0;

  // we iterate through the timepoints and find the most frequent one
  timepoints
    .map(t => t.stop.stopId)
    .some((tp, j) => {
      let included = stopIdOccurences.map(sio => sio.includes(tp));
      if (included.every(i => i)) {
        defaultTimepoint = tp;
        return true;
      } else {
        return false;
      }
    });

  let sorted = trips.sort((a, b) => {
    let aStopTime = a.stopTimes.filter(st => st.stop.stopId === defaultTimepoint)[0].arrivalTime;
    let bStopTime = b.stopTimes.filter(st => st.stop.stopId === defaultTimepoint)[0].arrivalTime;

    return aStopTime.hours * 60 + aStopTime.minutes - (bStopTime.hours * 60 + bStopTime.minutes);
  });

  return sorted;
}

/**
 * Convert GTFS service calendars into the specific days of the week.
 * @param {*} serviceCalendars: an array of a feed's Calendars, describing which days of the week are applicable for that service
 * @returns an object whose keys are `weekday`, `saturday`, `sunday` and the corresponding serviceId values
 */
export const getServiceDays = ( serviceCalendars ) => {
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

  return serviceDays;
}

/**
 * Group a route's trips by the serviceDay (weekday/sat/sun)
 * @param {Array} trips: an array of trip objects
 * @param {Object} serviceDays: getServiceDays returned value
 * @returns a grouping of trips by weekday, saturday, sunday
 */
export const getTripsByServiceDay = (trips, serviceDays) => {

  let tripsByServiceDay = {
    'weekday': [],
    'saturday': [],
    'sunday': []
  }

  Object.keys(serviceDays).forEach(day => {
    let thisDayTrips = trips.filter(trip => trip.serviceId === serviceDays[day])
    tripsByServiceDay[day] = thisDayTrips
  })

  return tripsByServiceDay
}

/**
 * Group a route's trips by service day & direction
 * @param {*} trips: an array of trip objects
 * @param {*} serviceDays: getServiceDays returned value
 * @param {*} headsignsByDirectionId: an object whose keys are directionId and values an array of distinct tripHeadsigns in that direction
 * @returns a nested object whose top keys are serviceDays (weekday/saturday/sunday), intermediate keys the directionId, and values are the trips which fall in that filter
 */
export const getTripsByServiceAndDirection = (trips, serviceDays, headsignsByDirectionId) => {

  let tripsByServiceAndDirection = {}

  Object.keys(serviceDays).forEach(day => {
    tripsByServiceAndDirection[day] = {}
    Object.keys(headsignsByDirectionId).forEach(dir => {
      let filteredTrips = trips.filter(trip => (trip.serviceId) === serviceDays[day] && trip.directionId == dir)
      tripsByServiceAndDirection[day][dir] = filteredTrips
    })
  })

  return tripsByServiceAndDirection
}

/**
 * Get distinct tripHeadsigns for each directionId of a route
 * @param {*} trips: an array of trip objects
 * @returns an object whose keys are directionIds and values an array of distinct tripHeadsigns
 */
export const getHeadsignsByDirectionId = (trips) => {
  let headsignsByDirectionId = {}

  const directions = [...new Set(trips.map(trip => trip.directionId))].sort()

  directions.forEach(dir => {
    let tripsThisDirection = trips.filter(trip => trip.directionId === dir)
    // get the unique tripHeadsigns
    let headsigns = [...new Set(tripsThisDirection.map(trip => trip.tripHeadsign))]
    headsignsByDirectionId[dir] = headsigns
  })

  return headsignsByDirectionId
}