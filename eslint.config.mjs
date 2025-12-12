import nextConfig from "eslint-config-next";

const ignores = [
  "node_modules/**",
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
];

const config = [
  {
    ignores,
  },
  ...nextConfig,
  {
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
