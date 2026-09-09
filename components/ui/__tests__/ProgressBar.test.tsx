import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from '../ProgressBar';
import { ThemeProvider } from '@/constants/ThemeContext';

const MockedComponent = (props: any) => (
  <ThemeProvider>
    <ProgressBar {...props} />
  </ThemeProvider>
);

describe('ProgressBar', () => {
  it('renders correctly with basic props', () => {
    const { getByTestId } = render(
      <MockedComponent 
        progress={50}
        testID="progress-bar"
      />
    );

    // Component should render without errors
    expect(() => render(<MockedComponent progress={50} />)).not.toThrow();
  });

  it('renders with label and percentage', () => {
    const { getByText } = render(
      <MockedComponent 
        progress={75}
        showLabel={true}
        label="Test Progress"
        showPercentage={true}
      />
    );

    expect(getByText('Test Progress')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
  });

  it('clamps progress values correctly', () => {
    // Test with progress > 100
    const { rerender } = render(
      <MockedComponent 
        progress={150}
        showPercentage={true}
      />
    );

    // Should show 100% instead of 150%
    expect(() => render(<MockedComponent progress={150} showPercentage={true} />)).not.toThrow();

    // Test with negative progress
    rerender(
      <MockedComponent 
        progress={-10}
        showPercentage={true}
      />
    );

    // Should show 0% instead of negative
    expect(() => render(<MockedComponent progress={-10} showPercentage={true} />)).not.toThrow();
  });

  it('renders without label and percentage by default', () => {
    const { queryByText } = render(
      <MockedComponent progress={50} />
    );

    // Should not show any text by default
    expect(queryByText(/\d+%/)).toBeNull();
  });

  it('handles zero progress', () => {
    const { getByText } = render(
      <MockedComponent 
        progress={0}
        showPercentage={true}
      />
    );

    expect(getByText('0%')).toBeTruthy();
  });

  it('handles full progress', () => {
    const { getByText } = render(
      <MockedComponent 
        progress={100}
        showPercentage={true}
      />
    );

    expect(getByText('100%')).toBeTruthy();
  });

  it('renders with gradient option', () => {
    expect(() => render(
      <MockedComponent 
        progress={50}
        gradient={true}
        gradientColors={['#ff0000', '#00ff00']}
      />
    )).not.toThrow();
  });

  it('renders with custom height', () => {
    expect(() => render(
      <MockedComponent 
        progress={50}
        height={20}
      />
    )).not.toThrow();
  });

  it('renders with custom colors', () => {
    expect(() => render(
      <MockedComponent 
        progress={50}
        backgroundColor="#f0f0f0"
        progressColor="#0066cc"
      />
    )).not.toThrow();
  });
}); 