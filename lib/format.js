
export function displayTemp(celsius, unit) {
  if (celsius === undefined || celsius === null) return "—";
  const value = unit === "F" ? (celsius * 9) / 5 + 32 : celsius;
  return Math.round(value);
}

export function unitSuffix(unit) {
  return unit === "F" ? "°F" : "°C";
}
