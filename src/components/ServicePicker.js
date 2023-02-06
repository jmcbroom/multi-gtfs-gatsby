import * as RadioGroup from "@radix-ui/react-radio-group";
import React from "react";
import '../styles/picker.css';
import { dayOfWeek } from "../util";

/**
 * Let the user choose the current service day.
 * @param {Object} services: tripsByServiceDay returned value; keys are services
 * @param {String} service: from useState, the current service value
 * @param {Function} setService: from useState, the setter function
 * @returns
 */
const ServicePicker = ({ services, service, setService }) => {
  let display = {
    weekday: `Weekday`,
    saturday: `Saturday`,
    sunday: `Sunday`,
  };

  return (
    <RadioGroup.Root
      className="radioGroupRoot"
      defaultValue={service ? service : dayOfWeek()}
      onValueChange={(e) => setService(e)}
    >
      {/* <div className="w-12 flex flex-shrink-0 items-center justify-around">
        <FontAwesomeIcon icon={faCalendarWeek} className="radioGroupIcon" />
      </div> */}
      {Object.keys(services).map((serviceDay) => (
        <div className="flex items-center" key={serviceDay}>
          <RadioGroup.Item
            className="radioGroupItem"
            value={serviceDay}
            id={serviceDay}
            disabled={services[serviceDay].length === 0}
            
          >
            <RadioGroup.Indicator className="radioGroupIndicator" />
          </RadioGroup.Item>
          <label className="radioGroupLabel" data-disabled={services[serviceDay].length === 0} htmlFor={serviceDay}>
            {display[serviceDay]}
          </label>
        </div>
      ))}
    </RadioGroup.Root>
  );
};

export default ServicePicker;
