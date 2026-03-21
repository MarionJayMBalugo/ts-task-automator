const path = require('node:path');

const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
const packageJson = require(packageJsonPath);

const APP_CONFIG = {
  title: "TMS Pulse",
  width: 950,
  height: 750,
  bgColor: '#f0f2f5',
  appId: packageJson.build?.appId || `com.tsautomation.${packageJson.name}`,
  icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
  uiPath: path.join(__dirname, '..', 'ui', 'index.html'),
  preload: path.join(__dirname, '..', 'preload', 'preload.js'),
  platform: {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux'
  }
};

module.exports = APP_CONFIG;