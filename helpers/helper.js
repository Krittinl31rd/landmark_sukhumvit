import db from "../db/db";
import { getModbusConfig } from "../db/modbus";
import { getRooms } from "../db/room";

const formatedDatatoModbusMulti = async (payload) => {
  const gateways = await getModbusConfig();
  const gateway = gateways.find((g) => g.id == payload.gateway_id);
  const modbusAddrStr = payload.address?.toString() || "";

  const ip = gateway?.ip;
  const address = Number(modbusAddrStr.slice(1));
  const slaveId = 1;

  return {
    ip,
    address,
    slaveId,
  };
};

const fotmatedDataToModbus = async (payload) => {
  const gateways = await getModbusConfig();
  const gateway = gateways.find((g) => g.id == payload.gateway_id);
  const modbusAddrStr = payload.modbus_address?.toString() || "";
  const functionCode = Number(modbusAddrStr.slice(0, 1));

  const ip = gateway?.ip;
  const address = Number(modbusAddrStr.slice(1));
  const value = payload.control_value;
  const slaveId = 1;
  const fc =
    functionCode == 1
      ? 5
      : functionCode == 2
        ? 5
        : functionCode == 3
          ? 6
          : functionCode == 4 && 6;

  return {
    ip,
    address,
    value,
    slaveId,
    fc,
  };
};

// utils: สร้าง modbus_address ให้ format เดียวกัน
const formatModbusAddress = (fc, address) =>
  Number(`${fc}${String(address).padStart(5, "0")}`);

/**
 * Map data → client format (ไม่มี DB write)
 */
const formatedDataToClient = async (payload, cb) => {
  const { ip, data } = payload;

  const gateways = await getModbusConfig();
  const rooms = await getRooms();

  const gateway = gateways.find((g) => g.ip === ip);
  if (!gateway) throw new Error("Gateway not found");

  const roomsOfGateway = rooms.filter((r) => r.gateway_id === gateway.id);

  // สร้าง map เพื่อ lookup เร็วขึ้น
  const controlMap = new Map();
  for (const room of roomsOfGateway) {
    for (const dev of room.devices) {
      for (const ctrl of dev.device_control) {
        controlMap.set(ctrl.modbus_address, {
          room_id: room.id,
          device_id: dev.device_id,
          control_id: ctrl.control_id,
        });
      }
    }
  }

  const dataArray = Array.isArray(data) ? data : [data];

  for (const { address, value, fc } of dataArray) {
    const modbus_address = formatModbusAddress(fc, address);
    const match = controlMap.get(modbus_address);

    if (match) {
      const obj = {
        gateway_id: gateway.id,
        room_id: match.room_id,
        device_id: match.device_id,
        control_id: match.control_id,
        control_value: value,
      };
      cb(obj); // ส่งออกทันที
    }
  }
};

/**
 * Bulk update DB
 */
const initData = async (payload) => {
  const { ip, changedData } = payload;

  await db.read();
  const gateways = db.data.modbusConfig || [];
  const rooms = db.data.rooms || [];
  const clocks = db.data.clockMaster || [];

  const gateway = gateways.find((g) => g.ip === ip);
  if (!gateway) throw new Error("Gateway not found");

  const roomsOfGateway = rooms.filter((r) => r.gateway_id === gateway.id);
  const controlMap = new Map();
  for (const room of roomsOfGateway) {
    for (const dev of room.devices) {
      for (const ctrl of dev.device_control) {
        controlMap.set(ctrl.modbus_address, ctrl);
      }
    }
  }

  const clocksOfGateway = clocks.filter((c) => c.gateway_id === gateway.id);
  const controlClockMap = new Map();
  for (const clock of clocksOfGateway) {
    for (const ctrl of clock.controls) {
      // console.log(ctrl);
      controlClockMap.set(ctrl.modbus_address, ctrl);
    }
  }

  for (const { address, value, fc } of changedData) {
    const modbus_address = formatModbusAddress(fc, address);
    const ctrl = controlMap.get(modbus_address);
    if (ctrl) ctrl.control_value = value;
    const ctrlClock = controlClockMap.get(modbus_address);
    if (ctrlClock) ctrlClock.control_value = value;
  }

  await db.write();
};

const initDataChange = async ({
  gateway_id,
  room_id,
  device_id,
  control_id,
  control_value,
}) => {
  await db.read();
  const rooms = db.data.rooms || [];

  const room = rooms.find(
    (r) => r.id === room_id && r.gateway_id === gateway_id
  );
  if (!room) throw new Error("Room not found");

  const device = room.devices.find((d) => d.device_id === device_id);
  if (!device) throw new Error("Device not found");

  const control = device.device_control.find(
    (c) => c.control_id === control_id
  );
  if (!control) throw new Error("Control not found");

  control.control_value = control_value;
  await db.write();
};

// const initDataChange = async (payload) => {
//   const { gateway_id, room_id, device_id, control_id, control_value } = payload;

//   await db.read();

//   const rooms = db.data.rooms || [];

//   const room = rooms.find(
//     (r) => r.id === room_id && r.gateway_id === gateway_id
//   );
//   if (!room) {
//     throw new Error("Room not found");
//   }
//   const device = room.devices.find((d) => d.device_id === device_id);
//   if (!device) {
//     throw new Error("Device not found");
//   }

//   const control = device.device_control.find(
//     (c) => c.control_id === control_id
//   );
//   if (!control) {
//     throw new Error("Control not found");
//   }

//   control.control_value = control_value;

//   await db.write();

//   // console.log("Updated control_value saved to db.json");
// };

const createDefaultSchedule = () => ({
  mon: { enable: false, start: "00:00", end: "00:00" },
  tue: { enable: false, start: "00:00", end: "00:00" },
  wed: { enable: false, start: "00:00", end: "00:00" },
  thu: { enable: false, start: "00:00", end: "00:00" },
  fri: { enable: false, start: "00:00", end: "00:00" },
  sat: { enable: false, start: "00:00", end: "00:00" },
  sun: { enable: false, start: "00:00", end: "00:00" },
});

export {
  createDefaultSchedule,
  fotmatedDataToModbus,
  formatedDataToClient,
  initData,
  initDataChange,
  formatedDatatoModbusMulti,
};

// const formatedDataToClient = async (payload) => {
//   console.log(payload);
//   const ip = payload.ip;
//   const dataArray = payload.data;
//   const gateways = await getModbusConfig();
//   const rooms = await getRooms();

//   const gateway = gateways.find((item) => item.ip == ip);
//   if (!gateway) throw new Error("Gateway not found");

//   const roomsOfGateway = rooms.filter((room) => room.gateway_id === gateway.id);

//   let results = [];

//   for (const data of dataArray) {
//     const { address, value, fc } = data;
//     const modbus_address = Number(`${fc}${String(address).padStart(5, "0")}`);

//     let foundRoom = null;
//     let foundDevice = null;
//     let foundControl = null;

//     for (const room of roomsOfGateway) {
//       for (const dev of room.devices) {
//         const matchControl = dev.device_control.find(
//           (ctrl) => ctrl.modbus_address === modbus_address
//         );
//         if (matchControl) {
//           foundRoom = room;
//           foundDevice = dev;
//           foundControl = matchControl;
//           break;
//         }
//       }
//       if (foundControl) break;
//     }

//     if (foundDevice && foundControl && foundRoom) {
//       results.push({
//         gateway_id: gateway.id,
//         room_id: foundRoom.id,
//         device_id: foundDevice.device_id,
//         control_id: foundControl.control_id,
//         control_value: value,
//       });
//     }
//   }

//   // console.log(results);
//   return results;
// };

// const formatedDataToClient = async (payload) => {
//   const ip = payload.ip;
//   const dataArray = payload.data;
//   const gateways = await getModbusConfig();
//   const rooms = await getRooms();

//   const gateway = gateways.find((item) => item.ip == ip);
//   if (!gateway) throw new Error("Gateway not found");

//   const roomsOfGateway = rooms.filter((room) => room.gateway_id === gateway.id);

//   let results = [];

//   for (const data of dataArray) {
//     const { address, value, fc } = data;
//     const modbus_address = Number(`${fc}${String(address).padStart(5, "0")}`);

//     let foundRoom = null;
//     let foundDevice = null;
//     let foundControl = null;

//     for (const room of roomsOfGateway) {
//       for (const dev of room.devices) {
//         const matchControl = dev.device_control.find(
//           (ctrl) => ctrl.modbus_address === modbus_address
//         );
//         if (matchControl) {
//           foundRoom = room;
//           foundDevice = dev;
//           foundControl = matchControl;
//           break;
//         }
//       }
//       if (foundControl) break;
//     }

//     if (foundDevice && foundControl && foundRoom) {
//       results.push({
//         gateway_id: gateway.id,
//         room_id: foundRoom.id,
//         device_id: foundDevice.device_id,
//         control_id: foundControl.control_id,
//         control_value: value,
//       });
//     }
//   }

//   // console.log(results);
//   return results;
// };

// const formatedDataToClient = async (payload, cb) => {
//   const ip = payload.ip;
//   const dataArray = payload.data;
//   const gateways = await getModbusConfig();
//   const rooms = await getRooms();

//   const gateway = gateways.find((item) => item.ip == ip);
//   if (!gateway) throw new Error("Gateway not found");

//   const roomsOfGateway = rooms.filter((room) => room.gateway_id === gateway.id);

//   for (const data of dataArray) {
//     const { address, value, fc } = data;
//     const modbus_address = Number(`${fc}${String(address).padStart(5, "0")}`);

//     for (const room of roomsOfGateway) {
//       for (const dev of room.devices) {
//         const matchControl = dev.device_control.find(
//           (ctrl) => ctrl.modbus_address === modbus_address
//         );
//         if (matchControl) {
//           const obj = {
//             gateway_id: gateway.id,
//             room_id: room.id,
//             device_id: dev.device_id,
//             control_id: matchControl.control_id,
//             control_value: value,
//           };
//           await cb(obj); // ส่ง obj ทีละตัวไปยัง callback
//         }
//       }
//     }
//   }
// };
