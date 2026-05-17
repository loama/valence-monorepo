import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.valencedev.platform",
  appName: "Valence",
  webDir: "out",
  server: {
    androidScheme: "https"
  },
  ios: {
    scheme: "Valence"
  },
  plugins: {
    CapacitorUpdater: {
      appId: "com.valencedev.platform",
      autoUpdate: true,
      defaultChannel: "production",
      directUpdate: false,
      keepUrlPathAfterReload: true,
      periodCheckDelay: 600
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "banner", "list"]
    }
  }
};

export default config;
