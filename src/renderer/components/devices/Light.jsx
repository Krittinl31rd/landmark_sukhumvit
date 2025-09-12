import React, { useState } from "react";
import LightSet from "./LightSet";
import { Lightbulb } from "lucide-react";

const Light = ({ gateway_id, lightDevices }) => {
  const [selectedIndexes, setSelectedIndexes] = useState([]);

  const toggleSelect = (idx) => {
    setSelectedIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSend = async (bright) => {
    const formatted = selectedIndexes.map((idx) => {
      const device = lightDevices[idx];
      return {
        device_id: device.device_id,
        control_id: device.device_control?.[0]?.control_id,
        control_value: bright,
        gateway_id: gateway_id,
        modbus_address: device.device_control?.[0]?.modbus_address,
      };
    });

    // Add delay between each writeData call
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const item of formatted) {
      await window.modbusAPI.writeData({
        control_id: item.control_id,
        control_value: item.control_value,
        device_id: item.device_id,
        gateway_id: item.gateway_id,
        modbus_address: item.modbus_address,
      });
      await sleep(50);
    }
    // Clear selection after sending
    setTimeout(
      () => {
        setSelectedIndexes([]);
      },
      selectedIndexes?.length || 5 * 800
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <LightSet handleSend={(e) => handleSend(e)} />
      <div className="w-full flex items-center justify-end gap-2">
        <button
          onClick={() => setSelectedIndexes([])}
          className="btn btn-sm btn-primary btn-ghost"
        >
          Clear
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {lightDevices.map((item, idx) => {
          const isSelected = selectedIndexes.includes(idx);

          return (
            <div
              key={idx}
              onClick={() => toggleSelect(idx)}
              className={`bg-base-100 w-full rounded-box p-2 cursor-pointer
                ${isSelected ? "border-2 border-warning" : "border border-transparent"}`}
            >
              <div className="flex items-center justify-center text-xs gap-0.5 mb-1">
                <Lightbulb
                  className={`w-4 h-4 ${item.device_control?.[0]?.control_value > 0 && "text-warning"}`}
                />
                <span className="font-semibold w-8 text-center">
                  {item.device_control?.[0]?.control_value}
                </span>
                %
              </div>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  id={`light-${idx}`}
                  className="checkbox checkbox-xl"
                  checked={isSelected}
                  readOnly
                />
                <div className="font-semibold min-w-8">
                  <label htmlFor={`light-${idx}`}>{item?.device_name}</label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Light;
