module.exports = {
  //"compilerOptions": {
  //  "allowJs": true
  //},
  "roots": [
    "<rootDir>/src"
  ],
  "testMatch": [
    "**/__tests__/**/*.+(ts|tsx)",
    "**/?(*.)+(spec|test).+(ts|tsx)"
  ],
  moduleFileExtensions: [
    'ts',
    'js',
  ],
  "transform": {
    "^.+\\.(ts|tsx|js)$": "ts-jest",
    "^.+\\.worker.[t|j]sx?$": "workerloader-jest-transformer"
  },
  // transformIgnorePatterns: ['^.+\\.js$'],
  testTimeout: 30000
}