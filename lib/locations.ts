export type PresetLocation = {
  id: string;
  label: string;
  lat: number;
  lon: number;
};

export const PRESET_LOCATIONS: readonly PresetLocation[] = [
  { id: "boon-keng", label: "Boon Keng", lat: 1.3191, lon: 103.8618 },
  { id: "lorong-chuan", label: "Lorong Chuan", lat: 1.3485, lon: 103.8643 },
  { id: "toa-payoh", label: "Toa Payoh", lat: 1.3333, lon: 103.8500 },
  { id: "tampines", label: "Tampines", lat: 1.3536, lon: 103.9458 },
  { id: "jurong-east", label: "Jurong East", lat: 1.3331, lon: 103.7420 },
  { id: "woodlands", label: "Woodlands", lat: 1.4380, lon: 103.7881 },
  { id: "clementi", label: "Clementi", lat: 1.3151, lon: 103.7624 },
  { id: "punggol", label: "Punggol", lat: 1.4053, lon: 103.9020 },
  { id: "bukit-panjang", label: "Bukit Panjang", lat: 1.3786, lon: 103.7616 },
] as const;

export type WeatherLocationSelection =
  | { type: "preset"; location: PresetLocation }
  | { type: "gps"; lat: number; lon: number; label: string };

export function resolveLocation(input: string | null | undefined): WeatherLocationSelection {
  if (!input) {
    return { type: "preset", location: PRESET_LOCATIONS[0] };
  }

  if (input.startsWith("gps:")) {
    const parts = input.slice(4).split(",");
    const lat = Number(parts[0]);
    const lon = Number(parts[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return {
        type: "gps",
        lat,
        lon,
        label: `GPS (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
      };
    }
  }

  const preset = PRESET_LOCATIONS.find((item) => item.id === input);
  if (preset) {
    return { type: "preset", location: preset };
  }

  // fallback to first preset
  return { type: "preset", location: PRESET_LOCATIONS[0] };
}

export function serializeLocation(selection: WeatherLocationSelection): string {
  if (selection.type === "gps") {
    return `gps:${selection.lat},${selection.lon}`;
  }
  return selection.location.id;
}