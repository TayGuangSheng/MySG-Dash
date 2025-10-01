export type ThemeDefinition = {
  id: string;
  label: string;
  background: string;
  foreground: string;
  cardBackground: string;
  cardBorder: string;
  accent: string;
  accentMuted: string;
  highlight: string;
};

export const THEMES: readonly ThemeDefinition[] = [
  {
    id: "aurora",
    label: "Aurora",
    background:
      "radial-gradient(circle at 20% 20%, #163d5c 0%, #0a101d 50%, #04070d 100%)",
    foreground: "#eff5ff",
    cardBackground: "rgba(11, 23, 38, 0.7)",
    cardBorder: "rgba(210, 229, 255, 0.12)",
    accent: "#68d7ff",
    accentMuted: "rgba(104, 215, 255, 0.16)",
    highlight: "#94ffde",
  },
  {
    id: "sunset",
    label: "Sunset",
    background:
      "linear-gradient(135deg, #1d042f 0%, #45113f 45%, #ff7e4c 100%)",
    foreground: "#fff2ed",
    cardBackground: "rgba(28, 5, 33, 0.68)",
    cardBorder: "rgba(255, 192, 166, 0.2)",
    accent: "#ffaf87",
    accentMuted: "rgba(255, 175, 135, 0.2)",
    highlight: "#ffd166",
  },
  {
    id: "dawn",
    label: "Dawn",
    background:
      "linear-gradient(160deg, #021124 0%, #123a5f 35%, #67b5ff 100%)",
    foreground: "#f1f6ff",
    cardBackground: "rgba(5, 19, 36, 0.7)",
    cardBorder: "rgba(223, 237, 255, 0.14)",
    accent: "#80d4ff",
    accentMuted: "rgba(128, 212, 255, 0.22)",
    highlight: "#f9f871",
  },
  {
    id: "midnight",
    label: "Midnight",
    background: "radial-gradient(circle at 35% 20%, #1a2740, #070b16 70%, #04050a)",
    foreground: "#e4e8ff",
    cardBackground: "rgba(7, 12, 25, 0.78)",
    cardBorder: "rgba(161, 173, 255, 0.15)",
    accent: "#709bff",
    accentMuted: "rgba(112, 155, 255, 0.2)",
    highlight: "#4be1ff",
  },
  {
    id: "forest",
    label: "Forest",
    background:
      "linear-gradient(140deg, #03130e 0%, #0f3b2d 45%, #2a6f4d 100%)",
    foreground: "#e8fff5",
    cardBackground: "rgba(5, 29, 21, 0.72)",
    cardBorder: "rgba(207, 255, 234, 0.18)",
    accent: "#79d2a6",
    accentMuted: "rgba(121, 210, 166, 0.22)",
    highlight: "#b4ff6f",
  },
  {
    id: "mono",
    label: "Mono",
    background: "#0e111a",
    foreground: "#fcfcff",
    cardBackground: "rgba(14, 17, 26, 0.82)",
    cardBorder: "rgba(255, 255, 255, 0.12)",
    accent: "#8f9eff",
    accentMuted: "rgba(143, 158, 255, 0.18)",
    highlight: "#ffcf6f",
  },
] as const;

export const DEFAULT_THEME_ID = "aurora";

export function getThemeById(id: string | null | undefined): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}