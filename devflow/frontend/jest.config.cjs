module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', esModuleInterop: true } }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../../services/api$': '<rootDir>/src/tests/__mocks__/api.ts',
    '^../services/api$': '<rootDir>/src/tests/__mocks__/api.ts',
    '^../socket/socket$': '<rootDir>/src/tests/__mocks__/socket.ts',
    '^../../socket/socket$': '<rootDir>/src/tests/__mocks__/socket.ts',
  },
  testMatch: ['<rootDir>/src/tests/**/*.test.tsx', '<rootDir>/src/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
  testTimeout: 15000,
};