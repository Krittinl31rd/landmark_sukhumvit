import ModbusRTU from "modbus-serial";

import {
  addPollInterval,
  removePollInterval,
  getPollIntervals,
} from "./interval";
import { addToQueue, getNextFromQueue, hasQueue } from "./queue";
import { updateModbusStatus, getModbusStatus } from "./status";
import { initData } from "../helpers/helper";
import { mainWindow } from "../src/main/main";
const MODBUS_CHUNK_SIZE = 100;
const POLLING_INTERVAL_MS = 2500;
const RECONNECT_DELAY_MS = 1000;
const writeLocks = {}; // { ip: { address: timestamp } }
const WRITE_LOCK_MS = 1500; // หน่วง 1.5 วิ

export const cache = {};
export const firstPollFlags = {};
export let pollStates = [];

export async function connectAndPoll(
  ip,
  port,
  Start_Coils,
  Total_Coils,
  Start_DiscreteInput,
  Total_DiscreteInput,
  Start_HoldingRegisters,
  Total_HoldingRegisters,
  Start_InputRegisters,
  Total_InputRegisters,
  onChangeCallback
) {
  // mark pollStates old inactive
  pollStates.forEach((p) => {
    if (p.ip !== ip || p.port !== port) p.active = false;
  });

  const client = new ModbusRTU();

  try {
    await client.connectTCP(ip, { port });
    console.log(`Connected to ${ip}:${port}`);

    const isChange = updateModbusStatus(ip, 1);
    // if (isChange) {
    //   if (mainWindow && mainWindow.webContents) {
    //     const result = getModbusStatus(ip);
    //     mainWindow.webContents.send("modbus-status", result);
    //   }
    // }

    const interval = setInterval(() => {
      handlePolling(
        client,
        ip,
        port,
        Start_Coils,
        Total_Coils,
        Start_DiscreteInput,
        Total_DiscreteInput,
        Start_HoldingRegisters,
        Total_HoldingRegisters,
        Start_InputRegisters,
        Total_InputRegisters,
        onChangeCallback
      );
    }, POLLING_INTERVAL_MS);

    pollStates.push({ ip, port, client, pollInterval: interval, active: true });
  } catch (err) {
    console.error(`Failed to connect to ${ip}:${port}`, err.message);
    const isChange = updateModbusStatus(ip, 0);

    // if (isChange) {
    //   if (mainWindow && mainWindow.webContents) {
    //     const result = getModbusStatus(ip);
    //     mainWindow.webContents.send("modbus-status", result);
    //   }
    // }

    const timeout = setTimeout(() => {
      const state = pollStates.find(
        (p) => p.ip === ip && p.port === port && p.active
      );
      if (state) {
        connectAndPoll(
          ip,
          port,
          Start_Coils,
          Total_Coils,
          Start_DiscreteInput,
          Total_DiscreteInput,
          Start_HoldingRegisters,
          Total_HoldingRegisters,
          Start_InputRegisters,
          Total_InputRegisters,
          onChangeCallback
        );
      }
    }, RECONNECT_DELAY_MS);

    pollStates.push({
      ip,
      port,
      client,
      reconnectTimeout: timeout,
      active: true,
    });
  }

  stopOldPolling();
}

export function stopOldPolling() {
  for (let i = pollStates.length - 1; i >= 0; i--) {
    const p = pollStates[i];
    if (!p.active) {
      if (p.pollInterval) clearInterval(p.pollInterval);
      if (p.reconnectTimeout) clearTimeout(p.reconnectTimeout);
      p.client.close().catch(() => {});
      console.log(`Stopped old IP: ${p.ip}:${p.port}`);
      pollStates.splice(i, 1);
    }
  }
}

export async function handlePolling(
  client,
  ip,
  port,
  Start_Coils,
  Total_Coils,
  Start_DiscreteInput,
  Total_DiscreteInput,
  Start_HoldingRegisters,
  Total_HoldingRegisters,
  Start_InputRegisters,
  Total_InputRegisters,
  onChangeCallback
) {
  let task = null;
  try {
    if (!client.isOpen) {
      return reconnectClient(
        ip,
        port,
        Start_Coils,
        Total_Coils,
        Start_DiscreteInput,
        Total_DiscreteInput,
        Start_HoldingRegisters,
        Total_HoldingRegisters,
        Start_InputRegisters,
        Total_InputRegisters,
        onChangeCallback
      );
    }

    // while (hasQueue(ip)) {
    //   // if (hasQueue(ip)) {
    //   task = getNextFromQueue(ip);
    //   try {
    //     client.setID(task.slaveId);
    //     if (task.fc == 5) {
    //       await client.writeCoil(task.address, task.value);
    //     } else if (task.fc == 6) {
    //       await client.writeRegister(task.address, task.value);
    //     } else {
    //       console.warn(`Unsupported FC in write task: ${task.fc}`);
    //     }
    //     console.log(
    //       `Write success to ${ip}: FC ${task.fc}, Addr=${task.address}, Val=${task.value}`
    //     );
    //   } catch (err) {
    //     console.error(`Write failed (FC ${task.fc}) on ${ip}:`, err.message);
    //   }
    // }

    while (hasQueue(ip)) {
      task = getNextFromQueue(ip);

      try {
        client.setID(task.slaveId);

        if (task.fc == 5) {
          await client.writeCoil(task.address, task.value);
        } else if (task.fc == 6) {
          await client.writeRegister(task.address, task.value);
          await new Promise((r) => setTimeout(r, 100));
        } else if (task.fc == 16) {
          await client.writeRegisters(task.address, task.values);
        }

        // 🔥 lock address
        if (!writeLocks[ip]) writeLocks[ip] = {};
        writeLocks[ip][task.address] = Date.now();

        console.log(`Write success to ${ip}`, task);
      } catch (err) {
        console.error(`Write failed`, err.message);
      }
    }

    const changedData = await PoolModbusData(
      client,
      MODBUS_CHUNK_SIZE,
      ip,
      Start_Coils,
      Total_Coils,
      Start_DiscreteInput,
      Total_DiscreteInput,
      Start_HoldingRegisters,
      Total_HoldingRegisters,
      Start_InputRegisters,
      Total_InputRegisters
    );
    if (changedData && changedData.length > 0) {
      if (firstPollFlags[ip]) {
        console.log(changedData);
        onChangeCallback(ip, changedData);
      } else {
        await initData({ ip, changedData });
        firstPollFlags[ip] = true;
      }
    }
  } catch (err) {
    console.error(`Polling error on ${ip}:`, err.message);
    await reconnectClient(
      ip,
      port,
      Start_Coils,
      Total_Coils,
      Start_DiscreteInput,
      Total_DiscreteInput,
      Start_HoldingRegisters,
      Total_HoldingRegisters,
      Start_InputRegisters,
      Total_InputRegisters,
      onChangeCallback
    );
  }
}

export async function reconnectClient(
  ip,
  port,
  Start_Coils,
  Total_Coils,
  Start_DiscreteInput,
  Total_DiscreteInput,
  Start_HoldingRegisters,
  Total_HoldingRegisters,
  Start_InputRegisters,
  Total_InputRegisters,
  onChangeCallback
) {
  const existing = getPollIntervals().find(
    (e) => e.ip === ip && e.port === port
  );
  if (existing) {
    clearInterval(existing.pollInterval);
    try {
      if (existing.client.isOpen) await existing.client.close();
    } catch {}
    removePollInterval(ip, port);
  }
  setTimeout(
    () =>
      connectAndPoll(
        ip,
        port,
        Start_Coils,
        Total_Coils,
        Start_DiscreteInput,
        Total_DiscreteInput,
        Start_HoldingRegisters,
        Total_HoldingRegisters,
        Start_InputRegisters,
        Total_InputRegisters,
        onChangeCallback
      ),
    RECONNECT_DELAY_MS
  );
}

export async function PoolModbusData(
  client,
  chunkSize,
  ip,
  Start_Coils,
  Total_Coils,
  Start_DiscreteInput,
  Total_DiscreteInput,
  Start_HoldingRegisters,
  Total_HoldingRegisters,
  Start_InputRegisters,
  Total_InputRegisters
) {
  const newData = [];

  if (!cache[ip]) cache[ip] = {};

  const readConfigs = [
    { fc: "readCoils", key: 1, start: Start_Coils, total: Total_Coils },
    {
      fc: "readDiscreteInputs",
      key: 2,
      start: Start_DiscreteInput,
      total: Total_DiscreteInput,
    },
    {
      fc: "readInputRegisters",
      key: 4,
      start: Start_InputRegisters,
      total: Total_InputRegisters,
    },
    {
      fc: "readHoldingRegisters",
      key: 3,
      start: Start_HoldingRegisters,
      total: Total_HoldingRegisters,
    },
  ];

  for (const { fc, key, start, total } of readConfigs) {
    if (!cache[ip][key]) cache[ip][key] = {};

    for (let offset = 0; offset < total; offset += chunkSize) {
      const length = Math.min(chunkSize, total - offset);
      const address = start + offset;

      try {
        const res = await client[fc](address, length);

        for (let i = 0; i < res.data.length; i++) {
          const addr = address + i;
          const val = res.data[i];
          const now = Date.now();

          if (cache[ip][key][addr] !== val) {
            // 🔥 เช็ค lock ตรงนี้เท่านั้น
            const lockedAt = writeLocks[ip]?.[addr];

            if (lockedAt && now - lockedAt < WRITE_LOCK_MS) {
              continue; // ❌ ignore ค่าเด้ง
            }

            newData.push({
              address: addr,
              value: val,
              fc: key,
            });

            cache[ip][key][addr] = val;
          }
        }
      } catch (err) {
        console.error(
          `Read error (${fc}) on ${ip} at ${address}-${address + length - 1}:`,
          err.message
        );
        return null;
      }
    }
  }

  return newData;
}

export async function getCurrent() {
  return cache;
}

export async function getCurrentValue(ip, fc, address) {
  return cache[ip]?.[fc]?.[address];
}
