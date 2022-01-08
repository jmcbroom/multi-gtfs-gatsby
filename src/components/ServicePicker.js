import React from "react";

/**
 * Let the user choose the current service day.
 * @param {Object} services: tripsByServiceDay returned value; keys are services
 * @param {String} service: from useState, the current service value
 * @param {Function} setService: from useState, the setter function
 * @returns 
 */
const ServicePicker = ({ services, service, setService }) => {
  return (
    <>
    <h2>
      Service picker
    </h2>
    <select onChange={(e) => setService(e.target.value)}>
      {Object.keys(services).map(serviceDay => (
        <option value={serviceDay} key={serviceDay}>{serviceDay}</option>
      ))}
    </select>
    </>
  )
}

export default ServicePicker;