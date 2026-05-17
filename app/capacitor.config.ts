import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.valence.platform",
  appName: "Valence",
  webDir: "out",
  server: {
    androidScheme: "https"
  }
};

export default config;
