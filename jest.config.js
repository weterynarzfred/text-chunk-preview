export default {
  transform: {
    "^.+\\.js$": ["@swc/jest"]
  },
  testEnvironment: "jsdom"
};
