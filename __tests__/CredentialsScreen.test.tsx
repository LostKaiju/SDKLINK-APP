/**
 * @format
 */

import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { CredentialsScreen } from '../src/screens/CredentialsScreen';

test('the Secret Word can be shown and hidden again', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <CredentialsScreen onSave={jest.fn()} />,
    );
  });
  const root = renderer!.root;
  const secretInput = () => root.findAllByType(TextInput)[1];
  const toggle = (label: string) =>
    root.find(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function' &&
        node.findAll(child => child.props.children === label).length > 0,
    );

  expect(secretInput().props.secureTextEntry).toBe(true);

  await ReactTestRenderer.act(async () => {
    toggle('Show Secret Word').props.onPress();
  });
  expect(secretInput().props.secureTextEntry).toBe(false);

  await ReactTestRenderer.act(async () => {
    toggle('Hide Secret Word').props.onPress();
  });
  expect(secretInput().props.secureTextEntry).toBe(true);
});
