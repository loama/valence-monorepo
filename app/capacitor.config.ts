import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.valence.platform",
  appName: "Valence",
  webDir: "out",
  server: {
    androidScheme: "https"
  },
  ios: {
    scheme: "Valence"
  }
};

export default config;
