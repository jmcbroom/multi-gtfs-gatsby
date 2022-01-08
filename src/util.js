/**
 * 
 * @param {*} serviceCalendars 
 * @returns 
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

export const getTripsByServiceDay = (trips, serviceDays) => {

  let tripsByServiceDay = {}

  Object.keys(serviceDays).forEach(day => {
    let thisDayTrips = trips.filter(trip => trip.serviceId === serviceDays[day])
    tripsByServiceDay[day] = thisDayTrips
  })

  return tripsByServiceDay
}

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