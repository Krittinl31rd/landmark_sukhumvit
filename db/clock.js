import db from "./db";

const getColckMaster = async () => {
  await db.read();
  return db.data.clockMaster;
};

export { getColckMaster };
