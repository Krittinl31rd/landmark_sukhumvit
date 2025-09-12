import { data } from "react-router-dom";
import db from "./db";
import { getPollIntervals } from "../modbus/interval";
import { formatedDataToClient, initDataChange } from "../helpers/helper";

const getModbusConfig = async () => {
  await db.read();
  return db.data.modbusConfig;
};

const addModbusConfig = async (config) => {
  await db.read();
  const data = db.data.modbusConfig;
  const isData = data.find((item) => item.ip == config.ip);
  if (isData)
    return {
      result: {
        success: false,
        message: `This ${config.ip} is already exists.`,
      },
    };
  config.id = db.data.modbusConfig.length + 1;
  db.data.modbusConfig.push(config);
  await db.write();
  console.log(getPollIntervals());
  return {
    result: {
      success: true,
      message: `Add gateway success.`,
    },
  };
};

const updateModbusConfig = async (config) => {
  await db.read();

  const index = db.data.modbusConfig.findIndex((item) => item.id == config.id);
  if (index == -1) {
    return {
      result: {
        success: false,
        message: `Gateway with id ${config.id} not found.`,
      },
    };
  }

  const isDuplicateIp = db.data.modbusConfig.some(
    (item, idx) => item.ip == config.ip && idx != index
  );
  if (isDuplicateIp) {
    return {
      result: {
        success: false,
        message: `This IP ${config.ip} already exists in another gateway.`,
      },
    };
  }

  db.data.modbusConfig[index] = { ...db.data.modbusConfig[index], ...config };

  await db.write();

  // await restartModbus({ oldIp, oldPort, ...config }, async (ip, data) => {
  //   if (mainWindow && mainWindow.webContents) {
  //     mainWindow.webContents.send("modbus-data", { ip, data });
  //     const res = await formatedDataToClient({ ip, data });
  //     if (res) {
  //       mainWindow.webContents.send("modbus-data2", res);
  //       await initDataChange(res);
  //     }
  //   }
  // });

  return {
    result: {
      success: true,
      message: `Gateway with id ${config.id} updated successfully.`,
    },
  };
};

const deleteModbusConfig = async (id) => {
  await db.read();

  const target = db.data.modbusConfig.find((item) => item.id === id);
  if (!target) {
    return {
      result: { success: false, message: `Gateway with id ${id} not found.` },
    };
  }

  db.data.modbusConfig = db.data.modbusConfig.filter((item) => item.id !== id);

  await db.write();

  // stopModbus(target.ip, target.port);

  return {
    result: {
      success: true,
      message: `Gateway with id ${id} deleted.`,
    },
  };
};

export {
  getModbusConfig,
  addModbusConfig,
  updateModbusConfig,
  deleteModbusConfig,
};
