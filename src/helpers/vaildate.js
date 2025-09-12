export function validate(config) {
  for (const key in config) {
    if (typeof config[key] === "string" && config[key].trim() === "") {
      return { valid: false, field: key };
    }
  }
  return { valid: true };
}
