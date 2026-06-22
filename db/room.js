import { createDefaultSchedule } from "../helpers/helper";
import db from "./db";

const getRooms = async () => {
  await db.read();
  return db.data.rooms;
};

const getRoomById = async (id) => {
  await db.read();
  const data = db.data.rooms;
  const result = data.find((item) => item.id == id);
  if (!result) {
    return {
      result: {
        success: false,
        message: `This room ${id} not found.`,
      },
    };
  }

  return result;
};

const addRoom = async (room) => {
  await db.read();
  const data = db.data.rooms;
  const isData = data.find((item) => item.name == room.name);
  if (isData)
    return {
      result: {
        success: false,
        message: `This ${room.name} is already exists.`,
      },
    };
  room.id = db.data.rooms.length + 1;
  room.schedule = createDefaultSchedule();
  db.data.rooms.push(room);
  await db.write();

  return {
    result: {
      success: true,
      message: `Add room success.`,
    },
  };
};

const addRoomCSV = async (room) => {
  await db.read();
  room.forEach((item) => {
    db.data.rooms.push(item);
  });
  await db.write();

  return {
    result: {
      success: true,
      message: `Add room success.`,
    },
  };
};

const updateRoom = async (room) => {
  await db.read();

  const index = db.data.rooms.findIndex((item) => item.id == room.id);
  if (index == -1) {
    return {
      result: {
        success: false,
        message: `room with id ${room.id} not found.`,
      },
    };
  }

  const isDuplicateName = db.data.rooms.some(
    (item, idx) => item.id == room.id && idx != index
  );
  if (isDuplicateName) {
    return {
      result: {
        success: false,
        message: `This name ${room.name} already exists in another name.`,
      },
    };
  }

  db.data.rooms[index] = { ...db.data.rooms[index], ...room };

  await db.write();

  return {
    result: {
      success: true,
      message: `Room with id ${room.id} updated successfully.`,
    },
  };
};

const deleteRoom = async (id) => {
  await db.read();

  db.data.rooms = db.data.rooms.filter((item) => item.id !== id);

  await db.write();

  return {
    result: {
      success: true,
      message: `Room with id ${id} deleted.`,
    },
  };
};

const deleteAllRoom = async () => {
  await db.read();
};
const updateRoomSchedule = async (roomId, schedule) => {
  await db.read();

  const room = db.data.rooms.find((item) => Number(item.id) === Number(roomId));

  if (!room) {
    return {
      result: {
        success: false,
        message: `Room ${roomId} not found.`,
      },
    };
  }

  room.schedule = schedule;

  await db.write();

  return {
    result: {
      success: true,
      message: "Schedule updated successfully.",
    },
  };
};

export {
  getRooms,
  getRoomById,
  addRoom,
  updateRoom,
  deleteRoom,
  addRoomCSV,
  updateRoomSchedule,
};
