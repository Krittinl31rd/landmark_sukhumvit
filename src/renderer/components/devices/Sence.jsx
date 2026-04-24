import React, { useState } from "react";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Sence = ({
  gateway_id,
  senceDevices,
  setIsSending,
  isSending,
  setRoom,
}) => {
  const [loadingMap, setLoadingMap] = useState({});

  //  queue + delay + timeout
  const sendWithQueue = async (tasks) => {
    setIsSending(true);

    for (const task of tasks) {
      const key = `${task.device_id}_${task.control_id}`;
      setLoadingMap((prev) => ({ ...prev, [key]: true }));

      //  optimistic UI
      setRoom((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          devices: prev.devices.map((device) => {
            if (device.device_id !== task.device_id) return device;

            return {
              ...device,
              device_control: device.device_control.map((c) =>
                c.control_id === task.control_id
                  ? { ...c, control_value: task.control_value }
                  : c
              ),
            };
          }),
        };
      });

      //  timeout กันค้าง
      const timeout = new Promise((resolve) => setTimeout(resolve, 2000));

      await Promise.race([window.modbusAPI.writeData(task), timeout]);

      await sleep(200); //  delay ต่อ command
    }

    setTimeout(() => {
      setLoadingMap({});
      setIsSending(false);
    }, 800);
  };

  // ===== ACTION =====
  const handleSend = (device, control, value) => {
    if (!control) return;

    sendWithQueue([
      {
        gateway_id,
        device_id: device.device_id,
        control_id: control.control_id,
        control_value: value,
        modbus_address: control.modbus_address,
      },
    ]);
  };

  return (
    <div className="w-full flex items-center gap-2 overflow-auto">
      {senceDevices.map((item, idx) => {
        const control = item.device_control?.[0];
        const key = `${item.device_id}_${control?.control_id}`;

        return (
          <div key={idx} className="flex gap-1">
            {/* ON */}
            <button
              onClick={() => handleSend(item, control, 100)}
              disabled={isSending}
              className="btn btn-primary flex items-center gap-1"
            >
              {loadingMap[key] && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              {item.device_name} ON
            </button>

            {/* OFF */}
            <button
              onClick={() => handleSend(item, control, 0)}
              disabled={isSending}
              className="btn btn-primary flex items-center gap-1"
            >
              {loadingMap[key] && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              {item.device_name} OFF
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Sence;
