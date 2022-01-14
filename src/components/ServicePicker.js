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
    <div className="flex items-center justify-start w-full md:w-auto">
      <span className="bg-gray-300 py-3 text-sm w-1/3 text-right px-4 md:text-center">
        Day
      </span>
    <select className="w-2/3 md:w-auto" onChange={(e) => setService(e.target.value)}>
      {Object.keys(services).map(serviceDay => (
        <option value={serviceDay} key={serviceDay}>{serviceDay}</option>
      ))}
    </select>
    </div>
  )
}

export default ServicePicker;