export type PresetLocation = {
  id: string;
  label: string;
  lat: number;
  lon: number;
};

export const PRESET_LOCATIONS: readonly PresetLocation[] = [
  { id: "ang-mo-kio", label: "Ang Mo Kio", lat: 1.3691, lon: 103.8454 },
  { id: "bedok", label: "Bedok", lat: 1.3246, lon: 103.9305 },
  { id: "bishan", label: "Bishan", lat: 1.3508, lon: 103.8480 },
  { id: "boon-keng", label: "Boon Keng", lat: 1.3191, lon: 103.8618 },
  { id: "bukit-panjang", label: "Bukit Panjang", lat: 1.3786, lon: 103.7616 },
  { id: "bukit-timah", label: "Bukit Timah", lat: 1.3294, lon: 103.8021 },
  { id: "changi-airport", label: "Changi Airport", lat: 1.3570, lon: 103.9886 },
  { id: "clementi", label: "Clementi", lat: 1.3151, lon: 103.7624 },
  { id: "hougang", label: "Hougang", lat: 1.3711, lon: 103.8860 },
  { id: "jurong-east", label: "Jurong East", lat: 1.3331, lon: 103.7420 },
  { id: "kallang", label: "Kallang", lat: 1.3112, lon: 103.8660 },
  { id: "lorong-chuan", label: "Lorong Chuan", lat: 1.3485, lon: 103.8643 },
  { id: "marina-bay", label: "Marina Bay", lat: 1.2823, lon: 103.8585 },
  { id: "marine-parade", label: "Marine Parade", lat: 1.3037, lon: 103.9058 },
  { id: "pasir-ris", label: "Pasir Ris", lat: 1.3721, lon: 103.9493 },
  { id: "punggol", label: "Punggol", lat: 1.4053, lon: 103.9020 },
  { id: "queenstown", label: "Queenstown", lat: 1.2941, lon: 103.8053 },
  { id: "sengkang", label: "Sengkang", lat: 1.3914, lon: 103.8953 },
  { id: "sentosa", label: "Sentosa", lat: 1.2494, lon: 103.8303 },
  { id: "tampines", label: "Tampines", lat: 1.3536, lon: 103.9458 },
  { id: "toa-payoh", label: "Toa Payoh", lat: 1.3333, lon: 103.8500 },
  { id: "woodlands", label: "Woodlands", lat: 1.4380, lon: 103.7881 },
  { id: "yishun", label: "Yishun", lat: 1.4295, lon: 103.8350 }
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
