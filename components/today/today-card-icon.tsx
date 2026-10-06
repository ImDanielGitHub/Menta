import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

type TodayCardIconProps = {
  kind: 'personal' | 'approved';
  color: string;
  size?: number;
  testID?: string;
};

/** Approved Paper direction C: held promise and approval seal, on a 28pt grid. */
export function TodayCardIcon({
  kind,
  color,
  size = 28,
  testID,
}: TodayCardIconProps) {
  return (
    <Svg
      accessible={false}
      color={color}
      height={size}
      testID={testID}
      viewBox="0 0 28 28"
      width={size}
    >
      {kind === 'personal' ? (
        <G transform="translate(-1.8 -13.1) scale(.8)">
          <Path
            d="m4.95 39.84 3.51-3.25c2.41-2.21 5.92-2.39 8.73-0.74l1.47 0.86c0.62 0.36 1.33 0.55 2.04 0.55h2.86c1.25 0 2.19 0.79 2.19 1.93 0 1.25-1.06 2.04-2.19 2.04h-6.55"
            fill="none"
            stroke={color}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="m25.67 38.12 5.19-4.29c0.54-0.44 1.07-0.56 1.53-0.56 1.26 0 2.13 0.9 2.13 2.17 0 0.61-0.24 1.2-0.75 1.69l-7.63 7.51c-1.7 1.59-3.78 2.51-5.79 2.51-2.34 0-6.84-2.1-8.4-2.1-1 0-1.96 0.75-2.56 1.27"
            fill="none"
            stroke={color}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="m22.19 33.34c-0.25 0-0.49-0.1-0.69-0.24-2.26-1.65-6.51-5.01-6.51-8.46 0-2.15 1.62-3.67 3.53-3.67 1.64 0 3.18 1.22 3.71 2.4 0.56-1.18 2.09-2.4 3.75-2.4 1.88 0 3.46 1.47 3.46 3.6 0 3.37-4.6 6.99-6.55 8.5-0.21 0.17-0.46 0.27-0.7 0.27z"
            fill="none"
            stroke={color}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      ) : (
        <G transform="translate(-35.6 -13.2) scale(.8)">
          <Path
            d="m59.29 21.41c1.47-1.37 3.6-1.27 5.13 0.09 0.94 0.87 2.13 1.29 3.67 1.22 1.88-0.08 3.28 1.29 3.59 3.25 0.17 1.18 0.85 2.17 1.99 2.85 1.59 1 2.06 2.87 1.18 4.66-0.52 1.04-0.54 2.16-0.07 3.37 0.71 1.77 0.13 3.58-1.52 4.47-1.11 0.61-1.7 1.58-1.86 2.71-0.27 1.65-1.9 2.62-3.61 2.48-1.33-0.09-2.44 0.33-3.38 1.19-1.6 1.4-3.85 1.31-5.35-0.07-0.82-0.76-1.89-1.14-3.25-1.11-1.8 0.12-3.26-1-3.51-2.74-0.16-1.17-0.92-2.1-1.98-2.73-1.49-0.91-1.9-2.72-1.24-4.36 0.5-1.2 0.43-2.4-0.14-3.62-0.78-1.73-0.23-3.5 1.44-4.46 1.12-0.67 1.7-1.7 1.84-2.91 0.21-1.95 1.74-3.09 3.55-2.97 1.45 0.08 2.57-0.46 3.52-1.32z"
            fill="none"
            stroke={color}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="m56.18 35.1 3.98 3.92 8.4-8.38"
            fill="none"
            stroke={color}
            strokeWidth={3.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}
    </Svg>
  );
}
