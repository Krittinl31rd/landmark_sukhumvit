const writeQueues = {};

export function initQueue(ip) {
  if (!writeQueues[ip]) {
    writeQueues[ip] = [];
  }
}

export function addToQueue(ip, writeCommand) {
  initQueue(ip);
  writeQueues[ip].push(writeCommand);
}

export function getNextFromQueue(ip) {
  if (writeQueues[ip] && writeQueues[ip].length > 0) {
    return writeQueues[ip].shift();
  }
  return null;
}

export function hasQueue(ip) {
  return writeQueues[ip] && writeQueues[ip].length > 0;
}
