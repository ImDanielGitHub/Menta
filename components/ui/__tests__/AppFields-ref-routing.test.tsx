import React, { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { AppTextField, type AppTextFieldRef } from '../AppFields';

// Model the native imperative boundary, including its visible focus/value effects.
jest.mock('react-native', () => {
  const ReactModule = require('react') as typeof import('react');
  const actual = jest.requireActual(
    'react-native'
  ) as typeof import('react-native');
  return Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(actual),
      TextInput: {
        configurable: true,
        enumerable: true,
        value: ReactModule.forwardRef(
          (props: import('react-native').TextInputProps, ref) => {
            const [text, setText] = ReactModule.useState(
              props.defaultValue ?? ''
            );
            ReactModule.useImperativeHandle(ref, () => ({
              focus: () => props.onFocus?.({ nativeEvent: {} } as never),
              blur: () => props.onBlur?.({ nativeEvent: {} } as never),
              clear: () => setText(''),
            }));
            return <actual.TextInput {...props} value={props.value ?? text} />;
          }
        ),
      },
    }
  );
});
jest.mock('@expo/ui/swift-ui', () => {
  const ReactModule = require('react') as typeof import('react');
  return {
    useNativeState: (initial: string) => {
      const value = ReactModule.useRef(initial);
      return ReactModule.useMemo(
        () => ({
          get: () => value.current,
          set: (next: string) => {
            value.current = next;
          },
        }),
        []
      );
    },
    TextField: 'SwiftUIField',
    SecureField: 'SwiftUISecureField',
    Host: 'SwiftUIHost',
    Toggle: 'SwiftUIToggle',
    DatePicker: 'SwiftUIDatePicker',
  };
});

it('routes constrained-field focus, blur and clear to the rendered native input', () => {
  const ref = createRef<AppTextFieldRef>();
  const change = jest.fn();
  const view = render(
    <ThemeProvider>
      <AppTextField
        ref={ref}
        testID="native-code"
        defaultValue="Clear me"
        maxLength={512}
        onChangeText={change}
      />
    </ThemeProvider>
  );
  act(() => ref.current?.focus());
  expect(ref.current?.isFocused()).toBe(true);
  act(() => ref.current?.blur());
  expect(ref.current?.isFocused()).toBe(false);
  act(() => ref.current?.clear());
  expect(view.getByTestId('native-code').props.value).toBe('');
  expect(change).toHaveBeenLastCalledWith('');
});
it('moves Return focus to a constrained next field', () => {
  const next = createRef<AppTextFieldRef>();
  const view = render(
    <ThemeProvider>
      <AppTextField testID="first" maxLength={5} nextInputRef={next} />
      <AppTextField ref={next} testID="second" maxLength={5} />
    </ThemeProvider>
  );
  fireEvent(view.getByTestId('first'), 'submitEditing');
  expect(next.current?.isFocused()).toBe(true);
});
