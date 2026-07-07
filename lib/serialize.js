export function serializeRecord(record) {
  return {
    id: record.id,
    locationQuery: record.locationQuery,
    resolvedName: record.resolvedName,
    latitude: record.latitude,
    longitude: record.longitude,
    startDate: record.startDate,
    endDate: record.endDate,
    weatherData: JSON.parse(record.weatherData),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
