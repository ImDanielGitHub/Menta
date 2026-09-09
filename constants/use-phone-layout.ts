import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  resolvePhoneLayout,
  type PhoneLayoutMetrics,
} from '@/constants/phone-layout';

export const usePhoneLayout = (): PhoneLayoutMetrics => {
  const { fontScale, height, width } = useWindowDimensions();
  return useMemo(
    () => resolvePhoneLayout({ width, height, fontScale }),
    [fontScale, height, width]
  );
};
