import { getModbusConfig } from "../../db/modbus";
import {
  formatedDataToClient,
  initDataChange,
  initData,
} from "../../helpers/helper";
import { connectAndPoll, cache, firstPollFlags } from "../../modbus/poller";
import { ipcMain } from "electron";
import { getPollIntervals, removePollInterval } from "../../modbus/interval";
import { pollStates, stopOldPolling } from "../../modbus/poller";

const CONFIG_POLL_INTERVAL_MS = 5000;

export async function startModbus(mainWindow) {
  const modbusConfigs = await getModbusConfig();
  if (!modbusConfigs?.length) return;

  for (const cfg of modbusConfigs) {
    connectAndPoll(
      cfg.ip,
      cfg.port,
      cfg.read_coils_start,
      cfg.read_coils_length,
      cfg.read_discrete_inputs_start,
      cfg.read_discrete_inputs_length,
      cfg.read_holding_registers_start,
      cfg.read_holding_registers_length,
      cfg.read_input_registers_start,
      cfg.read_input_registers_length,
      async (ip, dataArray) => {
        if (!mainWindow?.webContents) return;

        // ส่ง raw data ไป UI
        mainWindow.webContents.send("modbus-data", { ip, data: dataArray });

        // เก็บผลลัพธ์ที่ format แล้ว
        const formattedObjects = [];

        await formatedDataToClient({ ip, data: dataArray }, (obj) => {
          formattedObjects.push(obj);
          mainWindow.webContents.send("modbus-data2", obj);
        });
        // อัปเดต DB ทั้งก้อน (bulk update)
        if (dataArray.length) {
          await initData({ ip, changedData: dataArray });
        }
      }
    );
  }
}

// export async function startModbus(mainWindow) {
//   const modbusConfigs = await getModbusConfig();
//   if (!modbusConfigs?.length) return;

//   for (const cfg of modbusConfigs) {
//     connectAndPoll(
//       cfg.ip,
//       cfg.port,
//       cfg.read_coils_start,
//       cfg.read_coils_length,
//       cfg.read_discrete_inputs_start,
//       cfg.read_discrete_inputs_length,
//       cfg.read_holding_registers_start,
//       cfg.read_holding_registers_length,
//       cfg.read_input_registers_start,
//       cfg.read_input_registers_length,
//       async (ip, dataArray) => {
//         if (!mainWindow?.webContents) return;

//         // Send raw data for debugging/UI
//         mainWindow.webContents.send("modbus-data", { ip, data: dataArray });

//         // Pass the whole array at once instead of looping item by item
//         await formatedDataToClient({ ip, data: dataArray }, (obj) => {
//           mainWindow.webContents.send("modbus-data2", obj);
//         });
//       }
//     );
//   }
// }

// export async function startModbusAuto(mainWindow) {
//   let lastConfig = [];

//   async function updateConfig() {
//     const modbus = await getModbusConfig();

//     // --- หยุด poll ของ IP/Port ที่ถูกลบออกจาก config ---
//     pollStates.forEach((p) => {
//       const exist = modbus.find((c) => c.ip === p.ip && c.port === p.port);
//       if (!exist) {
//         p.active = false;
//       }
//     });
//     stopOldPolling();

//     // --- เริ่ม poll ของ IP/Port ใหม่ ---
//     for (const cfg of modbus) {
//       const exists = pollStates.find(
//         (p) => p.ip === cfg.ip && p.port === cfg.port
//       );
//       if (!exists) {
//         // Poll ใหม่
//         connectAndPoll(
//           cfg.ip,
//           cfg.port,
//           cfg.read_coils_start,
//           cfg.read_coils_length,
//           cfg.read_discrete_inputs_start,
//           cfg.read_discrete_inputs_length,
//           cfg.read_holding_registers_start,
//           cfg.read_holding_registers_length,
//           cfg.read_input_registers_start,
//           cfg.read_input_registers_length,
//           async (ip, data) => {
//             if (mainWindow && mainWindow.webContents) {
//               mainWindow.webContents.send("modbus-data", { ip, data });
//               const res = await formatedDataToClient({ ip, data });
//               if (res) {
//                 mainWindow.webContents.send("modbus-data2", res);
//                 await initDataChange(res);
//               }
//             }
//           }
//         );
//       }
//     }

//     lastConfig = modbus;
//     setTimeout(updateConfig, CONFIG_POLL_INTERVAL_MS);
//   }

//   updateConfig(); // เริ่ม loop
// }
