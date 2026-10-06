jest.mock('react-native-date-picker', () => {
  throw new Error('RNDatePicker native module is absent');
});
it('does not evaluate the Android date picker on iOS', () => {
  expect(() => require('../AppFields')).not.toThrow();
});
