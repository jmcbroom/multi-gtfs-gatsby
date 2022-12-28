import { head } from "lodash";

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

  return `${hour}:${minutes}${showAp ? ` ${ap}` : ``}`;
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

  return {
    trips: sorted,
    timepoints: timepoints
  };
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
    if (weekdayMatches.every(e => e) && sc.saturday === 0 && sc.sunday === 0) {
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
      let filteredTrips = trips.filter(trip => (trip.serviceId) === serviceDays[day] && trip.directionId === parseInt(dir))
      if (filteredTrips.length > 0) {
        tripsByServiceAndDirection[day][dir] = sortTripsByFrequentTimepoint(filteredTrips).trips
      }
      else {
        tripsByServiceAndDirection[day][dir] = []
      }
    })
  })

  return tripsByServiceAndDirection
}

/**
 * Get distinct tripHeadsigns for each directionId of a route
 * @param {*} trips: an array of trip objects
 * @returns an object whose keys are directionIds and values an array of distinct tripHeadsigns
 */
export const getHeadsignsByDirectionId = (trips, sanityRoute) => {
  let headsignsByDirectionId = {}
  const directions = [...new Set(trips.map(trip => trip.directionId))].sort()
  console.log(directions)
  directions.forEach(dir => {
    let tripsThisDirection = trips.filter(trip => trip.directionId === dir)
    // get th unique tripHeadsigns
    let headsigns = [...new Set(tripsThisDirection.map(trip => trip.tripHeadsign))]
    headsignsByDirectionId[dir] = { headsigns: headsigns }
  })

  if(sanityRoute) {
    sanityRoute.directions.forEach((dir, idx) => {
      console.log(dir)
      let directionId = dir.directionId
      console.log(directionId, headsignsByDirectionId)
      if (dir.directionHeadsign) {
        headsignsByDirectionId[directionId].headsigns = [dir.directionHeadsign];
      }
      if (dir.directionDescription) {
        headsignsByDirectionId[directionId].description = dir.directionDescription;
      }
    });
  }
  return headsignsByDirectionId
}

/**
 * Create a GeoJSON FeatureCollection from the GTFS and Sanity representations of a route.
 * @param {*} sanityRoute: the Sanity data about the route. must include the extendedRouteDirs with the GeoJSON feature-as-string
 * @param {*} gtfsRoute: the Postgres data about the route
 * @returns GeoJSON feature collection
 */
export const createRouteFc = (sanityRoute, gtfsRoute) => { 

  // iterate through the extendedRouteDirections
  let features = sanityRoute.directions.map(direction => {

    // parse the directionShape GeoJSON feature
    let feature = JSON.parse(direction.directionShape)[0]

    // attach the GTFS attributes to properties
    feature.properties = {...gtfsRoute}

    // add two pieces of extendedRouteDir info
    feature.properties.directionDescription = direction.directionDescription
    feature.properties.directionId = direction.directionId

    return feature
  })

  let featureCollection = {
    type: "FeatureCollection",
    features: features
  }

  return featureCollection
}

/**
 * Create a GeoJSON FeatureCollection from the GTFS and Sanity representations of a route.
 * @param {*} sanityRoute: the Sanity route object
 * @param {*} trips: the returned object from getTripsByServiceAndDirection
 * @returns GeoJSON feature collection of timepoints
 */
export const createTimepointsFc = (sanityRoute, trips, shortFormat=true) => {

  // store GeoJSON features here to include with the featureCollection
  let features = []

  // iterate through each direction on weekday service
  Object.keys(trips.weekday).map(key => {

    // get the timepoints from the trip with the most timepoints
    const mostTimepointsTrip = trips.weekday[key].sort((a, b) => {
      return b.stopTimes.length - a.stopTimes.length;
    })[0];
    let stops = mostTimepointsTrip.stopTimes.map(st => st.stop)

    stops.forEach(stop => {

      // create a new GeoJSON feature
      let stopFeature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [stop.stopLon, stop.stopLat]
        },
        properties: {
          ...stop
        }
      }

      // strip out the name of the route, for shorter map labels
      // ex, on DDOT 39, timepoint `Puritan & Livernois` => `Livernois`
      if(shortFormat) {
        stopFeature.properties.stopName = stopFeature.properties.stopName.replace(`${sanityRoute.longName} & `, '')
      }

      features.push(stopFeature)

    })
  })

  return {
    type: "FeatureCollection",
    features: features
  }
}

export const createAgencyData = (gtfsAgency, sanityAgency) => {

  gtfsAgency.slug = sanityAgency.slug
  gtfsAgency.content = sanityAgency.content
  gtfsAgency.description = sanityAgency.description
  gtfsAgency.name = sanityAgency.name
  gtfsAgency.color = sanityAgency.color
  gtfsAgency.textColor = sanityAgency.textColor
  return gtfsAgency

}

export const createRouteData = (gtfsRoute, sanityRoute) => {
  gtfsRoute.routeLongName = sanityRoute.longName
  gtfsRoute.routeColor = sanityRoute.routeColor.hex
  gtfsRoute.routeTextColor = sanityRoute.routeTextColor.hex
  return gtfsRoute
}