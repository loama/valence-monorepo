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
      periodCheckDelay: 600,
      publicKey:
        "-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAyJkCSU/UcjG2ngteZpWvVvOD7lMw8Y7wc5WTle3iCyDJaiWi6Ahf\nYOPKhrEN0yg1GPzhZn2asQe1kzje7G/VKq3dcc5R+mrXYE/Dz5ygW1Be5LtNRGZ8\nLP8BS8+qZPV8YCJyxj/acVpy8BvaLqVQTcZBlLL/iNBZaqjCko/LmrQks2dKWsg/\nZ8xEFUHLN6TSKhy1nZNweaKxPQ0QaoWcuTCbdvY7gVNJ5ixunA0pgYMOvmfHrp6h\nHTEHvLZqn+04Xnuufdocl+WFv/orPID96jLDR70UeQa+X/l6oKrmVItZXf9llA5l\nuiGwT+JT89A4nAWakcTJxdnLtwbvZzsnYQIDAQAB\n-----END RSA PUBLIC KEY-----\n"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "banner", "list"]
    }
  }
};

export default config;
