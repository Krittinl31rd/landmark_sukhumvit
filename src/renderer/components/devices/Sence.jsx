import React from "react";

const Sence = ({ gateway_id, senceDevices }) => {
  const handleSend = async (device, control, value) => {
    await window.modbusAPI.writeData({
      control_id: control.control_id,
      control_value: value,
      device_id: device.device_id,
      gateway_id: gateway_id,
      modbus_address: control.modbus_address,
    });
  };

  return (
    <div className="w-full flex items-center overflow-auto">
      {senceDevices.map((item, idx) => {
        const control = item.device_control?.[0];
        const isActive = control?.control_value > 0;
        // Click to toggle
        return (
          <button
            key={idx}
            onClick={() => handleSend(item, control, isActive ? 0 : 100)}
            className={`btn ${
              isActive
                ? "btn-primary text-blue-500"
                : "btn-outline btn-primary text-white"
            }`}
          >
            {item.device_name}
          </button>
        );
      })}
    </div>
  );
};

export default Sence;
