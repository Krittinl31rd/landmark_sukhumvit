import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { checkLogin } from "../../db/auth";
import {
  addModbusConfig,
  getModbusConfig,
  deleteModbusConfig,
  updateModbusConfig,
} from "../../db/modbus";
import { startModbus } from "./modbusManager";
import { getCurrent } from "../../modbus/poller";
import { initDB } from "../../db/db";
import {
  addRoom,
  addRoomCSV,
  deleteRoom,
  getRoomById,
  getRooms,
  updateRoom,
  updateRoomSchedule,
} from "../../db/room";
import { addToQueue } from "../../modbus/queue";
import {
  fotmatedDataToModbus,
  formatedDataToClient,
  initDataChange,
  groupModbusTasks,
  formatedDatatoModbusMulti,
} from "../../helpers/helper";
import db from "../../db/db";
import { getColckMaster } from "../../db/clock";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}
export let mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.closeDevTools();
  }
};

app.whenReady().then(async () => {
  createWindow();
  await initDB();
  await startModbus(mainWindow);
  // await startModbusAuto(mainWindow);

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      await initDB();
      await startModbus(mainWindow);
      // await startModbusAuto(mainWindow);
    }
  });
});

// Handle IPC
ipcMain.handle("login", async (event, { username, password }) => {
  const res = await checkLogin(username, password);
  return res;
});

ipcMain.handle("get-modbus-config", async (event) => {
  const res = await getModbusConfig();
  return res;
});

ipcMain.handle("add-modbus-config", async (event, config) => {
  const res = await addModbusConfig(config);
  return res;
});

ipcMain.handle("update-modbus-config", async (event, config) => {
  const res = await updateModbusConfig(config);
  return res;
});

ipcMain.handle("delete-modbus-config", async (event, id) => {
  const res = await deleteModbusConfig(id);
  return res;
});

ipcMain.handle("get-rooms", async (event) => {
  const res = await getRooms();
  return res;
});

ipcMain.handle("get-room-id", async (event, id) => {
  const res = await getRoomById(id);
  return res;
});

ipcMain.handle("add-room", async (event, payload) => {
  const res = await addRoom(payload);
  return res;
});

ipcMain.handle("add-room-csv", async (event, payload) => {
  const res = await addRoomCSV(payload);
  return res;
});

ipcMain.handle("update-room", async (event, payload) => {
  const res = await updateRoom(payload);
  return res;
});

ipcMain.handle("delete-room", async (event, id) => {
  const res = await deleteRoom(id);
  return res;
});

ipcMain.handle("get-clock", async (event) => {
  const res = await getColckMaster();
  // console.log(res);
  return res;
});

ipcMain.handle("update-room-schedule", async (event, { roomId, schedule }) => {
  return await updateRoomSchedule(roomId, schedule);
});

ipcMain.handle("getDataModbus", async (event) => {
  const res = await getCurrent();
  return res;
});

ipcMain.handle("writeData", async (event, payload) => {
  const res = await fotmatedDataToModbus(payload);
  addToQueue(res.ip, {
    address: res.address,
    value: res.value,
    slaveId: res.slaveId,
    fc: res.fc,
  });
});

ipcMain.handle("writeDataMulti", async (event, payloads) => {
  const res = await formatedDatatoModbusMulti(payloads);
  // console.log(payloads);
  addToQueue(res.ip, {
    address: res.address,
    values: payloads.values,
    slaveId: res.slaveId,
    fc: payloads.fc,
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
