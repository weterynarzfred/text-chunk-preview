export default {
  transform: {
    "^.+\\.js$": ["@swc/jest"]
  },
  testEnvironment: "jsdom",
  setupFiles: ['./jest.setup.js'],
};
