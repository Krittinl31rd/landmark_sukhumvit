import React, { useState } from "react";
import LightSet from "./LightSet";
import { Lightbulb } from "lucide-react";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Light = ({
  gateway_id,
  lightDevices,
  setIsSending,
  isSending,
  setRoom,
}) => {
  const [selectedIndexes, setSelectedIndexes] = useState([]);

  const toggleSelect = (idx) => {
    if (isSending) return;
    setSelectedIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const processQueue = async (queue) => {
    for (const item of queue) {
      await window.modbusAPI.writeData(item);
      await sleep(300);
    }
  };

  const handleSend = async (bright) => {
    if (isSending) return;

    setIsSending(true);

    const formatted = selectedIndexes
      .map((idx) => {
        const device = lightDevices[idx];
        const control = device?.device_control?.[0];
        if (!device || !control) return null;

        return {
          device_id: device.device_id,
          control_id: control.control_id,
          control_value: bright,
          gateway_id,
          modbus_address: control.modbus_address,
        };
      })
      .filter(Boolean);

    if (!formatted.length) {
      setIsSending(false);
      return;
    }

    // ✅ optimistic UI
    setRoom((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        devices: prev.devices.map((device) => {
          const found = formatted.find((f) => f.device_id === device.device_id);
          if (!found) return device;

          return {
            ...device,
            device_control: device.device_control.map((c) =>
              c.control_id === found.control_id
                ? { ...c, control_value: found.control_value }
                : c
            ),
          };
        }),
      };
    });

    await processQueue(formatted);

    const totalDelay = Math.max(formatted.length * 150, 1500);

    setTimeout(() => {
      setSelectedIndexes([]);
      setIsSending(false);
    }, totalDelay);
  };

  return (
    <div className="flex flex-col gap-3 w-full p-2">
      <LightSet handleSend={(e) => handleSend(e)} />

      {/* action */}
      <div className="flex justify-end gap-2">
        <button
          disabled={isSending}
          onClick={() => setSelectedIndexes(lightDevices.map((_, idx) => idx))}
          className="btn btn-sm btn-outline"
        >
          Select All
        </button>

        <button
          disabled={isSending}
          onClick={() => setSelectedIndexes([])}
          className="btn btn-sm btn-outline"
        >
          Clear
        </button>
      </div>

      {/* grid */}
      <div className="relative">
        {isSending && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl z-10">
            <span className="loading loading-spinner loading-lg text-warning"></span>
          </div>
        )}

        <div
          className={`grid grid-cols-4 gap-2 ${
            isSending ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {lightDevices.map((item, idx) => {
            const isSelected = selectedIndexes.includes(idx);
            const value = item.device_control?.[0]?.control_value || 0;
            const isOn = value > 0;

            return (
              <div
                key={idx}
                onClick={() => toggleSelect(idx)}
                className={`
    p-2 rounded-lg cursor-pointer
    ${isSelected ? "ring-1 ring-warning" : ""}
    ${value > 0 ? "bg-success/30" : "bg-base-100"}
  `}
              >
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Lightbulb
                    className={`w-4 h-4 ${
                      value > 0 ? "text-yellow-400" : "text-gray-400"
                    }`}
                  />
                  <span className="truncate">{item.device_name}</span>
                </div>

                <div className="flex justify-between text-xs mt-1">
                  <span
                    className={`font-semibold ${
                      value > 0 ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {value > 0 ? "ON" : "OFF"}
                  </span>
                  <span>{value}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Light;
