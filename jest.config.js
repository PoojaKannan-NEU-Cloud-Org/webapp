// jest.config.js
module.exports = {
    setupFilesAfterEnv: ['./tests/setup.js'],
    maxWorkers: 1,
    testEnvironment: 'node',
    // The glob patterns Jest uses to detect test files
    testMatch: [
      "**/?(*.)+(spec|test).[jt]s?(x)"
    ],
  
    // An array of regexp pattern strings that are matched against all test paths before executing the test
    testPathIgnorePatterns: [
      "/node_modules/",
      "/app.js"
    ],
  
    // Indicates whether each individual test should be reported during the run
    verbose: true
  };
  