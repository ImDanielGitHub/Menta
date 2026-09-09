import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { mentaColors } from '@/constants/MentaDesignSystem';

export type AppReceiptSparklesProps = {
  color?: string;
  height?: number;
  testID?: string;
  width?: number;
};

export const AppReceiptSparkles: React.FC<AppReceiptSparklesProps> = ({
  color = mentaColors.action,
  height = 22,
  testID,
  width = 34,
}) => (
  <Svg
    accessible={false}
    accessibilityElementsHidden
    height={height}
    importantForAccessibility="no-hide-descendants"
    pointerEvents="none"
    testID={testID}
    viewBox="0 0 150 149.6"
    width={width}
  >
    <Path
      d="m73.4 47.7c1.5 11.7 3.6 16.4 8.4 20.5 4.9 4.2 15.9 5.6 16.9 5.8v0.1c-9.7 0.9-14.6 2.3-18.1 5.4-5.3 4.5-6.4 11.5-7.2 21.4l-0.3-0.9c-1.7-11.7-4.3-16-8.1-19.2-4.9-3.7-9.4-4.4-16.6-5.8v-0.1c11.7-1.6 15.5-3.9 18.2-6.6 4.2-4.3 5.5-9.8 6.6-20.6h0.2zm20.8 33.1h-0.1c-0.6 4.4-1.1 7.2-4.2 9s-5.7 2-6.7 2.2v0.2c4.5 0.6 6.6 1.4 8.1 3.3 1.6 1.8 2.2 4.1 2.8 8.3h0.1c0.4-3.8 1.1-6.5 2.5-8 1.5-1.9 3.3-3 8.3-3.7v-0.1c-6.5-0.7-8.1-3.1-9.3-5.1-0.8-1.9-1.3-5.4-1.5-6.1zm0-35.1c-0.5 4.5-1.3 6.7-3.1 8.5-2.1 2.3-5.9 3.2-8 3.6v0.3c5.6 0.4 7.6 2.5 8.6 3.7 1.4 1.8 2 4.3 2.4 7.9h0.1c0.6-5.3 1.7-6.8 2.8-8 2.2-2.4 4.6-3.1 8-3.8v-0.1c-5.1-0.6-6.2-1.6-7.7-3-1.8-1.9-2.5-4.5-3.1-9.1z"
      fill={color}
    />
  </Svg>
);
