/**
 * @format
 */

import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { LinkingScreen } from '../src/screens/LinkingScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
  },
}));

const mockUpdateUserID = jest.fn();

jest.mock('react-native-rook-sdk', () => ({
  RookSdk: { onRookMessage: () => ({ remove: () => {} }) },
  SDKDataSource: {
    HEALTH_CONNECT: 'HEALTH_CONNECT',
    SAMSUNG_HEALTH: 'SAMSUNG_HEALTH',
  },
  APIDataSource: {},
  useRookConfiguration: () => ({
    ready: true,
    updateUserID: mockUpdateUserID,
  }),
  useRookPermissions: () => ({}),
  useRookHealthConnect: () => ({}),
  useRookSamsungHealth: () => ({}),
  useRookSync: () => ({ sync: jest.fn() }),
  useRookAPISources: () => ({}),
}));

const hasText = (root: ReactTestRenderer.ReactTestInstance, text: string) =>
  root.findAll(node => node.props.children === text).length > 0;

const pressButton = (
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
) =>
  root
    .find(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function' &&
        node.findAll(child => child.props.children === label).length > 0,
    )
    .props.onPress();

test('a failed SDK call shows the error banner until the log is viewed', async () => {
  mockUpdateUserID.mockRejectedValue(new Error('user was not initialized'));

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <LinkingScreen onResetCredentials={jest.fn()} />,
    );
  });
  const root = renderer!.root;
  expect(hasText(root, '1 error in the log')).toBe(false);

  await ReactTestRenderer.act(async () => {
    root.findAllByType(TextInput)[0].props.onChangeText('sdklink_test_001');
  });
  await ReactTestRenderer.act(async () => {
    await pressButton(root, 'updateUserID');
  });
  expect(hasText(root, '1 error in the log')).toBe(true);

  await ReactTestRenderer.act(async () => {
    pressButton(root, 'View log');
  });
  expect(hasText(root, '1 error in the log')).toBe(false);
});
