/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Native modules are not available under Jest.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeMany: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('react-native-rook-sdk', () => ({
  RookSyncGate: ({ children }: { children: React.ReactNode }) => children,
  SDKDataSource: {
    HEALTH_CONNECT: 'HEALTH_CONNECT',
    SAMSUNG_HEALTH: 'SAMSUNG_HEALTH',
  },
  APIDataSource: {},
}));

test('shows the credentials screen when none are stored', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const texts = renderer!.root.findAll(
    node => typeof node.props.children === 'string',
  );
  expect(
    texts.some(node => node.props.children === 'Save and initialize SDK'),
  ).toBe(true);
});
