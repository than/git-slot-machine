module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  // Source uses ESM-style `.js` import extensions; map them back to TS sources
  // so the CommonJS test build can resolve them.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // The package builds as ESM (NodeNext), but Jest runs on CommonJS. Compile
  // test sources to CommonJS here, independent of the ESM build in tsconfig.
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: { module: 'commonjs' },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts'
  ]
};
