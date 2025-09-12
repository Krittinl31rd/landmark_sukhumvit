let pollIntervals = [];

export function addPollInterval(entry) {
  pollIntervals.push(entry);
}

export function removePollInterval(ip, port) {
  pollIntervals = pollIntervals.filter(
    (item) => !(item.ip === ip && item.port === port)
  );
}

export function getPollIntervals() {
  return pollIntervals;
}
