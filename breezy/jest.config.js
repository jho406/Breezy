// jest.config.js
// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  verbose: true,
};

module.exports = config;

// Or async function
module.exports = async () => {
  return {
    modulePathIgnorePatterns: ["<rootDir>/dist/"],
    verbose: true,
    testEnvironment: 'jsdom',
    setupFiles: [
      "<rootDir>/spec/helpers/setup.js",
      "<rootDir>/spec/helpers/polyfill.js"
    ]
  };
};

