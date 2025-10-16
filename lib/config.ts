export const BUS_STOPS = [
  { id: "66039", label: "66039" },
  { id: "66369", label: "66369" },
] as const;

export const REFRESH_INTERVALS = {
  weather: 5 * 60 * 1000,
  trains: 60 * 1000,
  bus: 15 * 1000,
};
