const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    // Correctly unpacks your .bat files so they can execute outside the ASAR archive
    asar: {
      unpackDir: 'resources' 
    },
    // The path to your icon (without extension)
    icon: './src/assets/icon',
    // Forces the app to request Administrator rights on launch
    win32metadata: {
      'ProductName': 'TMS Pulse',
      'InternalName': 'TMS Pulse'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // This must match the name used in your AppUserModelId in main.js
        name: 'ts_automation_app',
        // Sets the icon used for the installer
        setupIcon: './src/assets/icon.ico',
        // This sets the name shown in the 'Add or Remove Programs' menu
        title: 'TMS Pulse'
      },
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
