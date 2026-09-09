import React, { useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import {
  MASCOT_SPRITE_FRAME_COUNT,
  type MascotSheetRow,
} from '@/components/ui/mascot-sprite-metadata';

export type { MascotSheetRow } from '@/components/ui/mascot-sprite-metadata';

const COMPANION_SHEETS: Record<MascotSheetRow, number> = {
  idle: require('@/assets/images/mascot/sheets/companion-idle.png'),
  wave: require('@/assets/images/mascot/sheets/companion-wave.png'),
  guide: require('@/assets/images/mascot/sheets/companion-guide.png'),
  gift: require('@/assets/images/mascot/sheets/companion-gift.png'),
};

export const MASCOT_SHEET_COLUMNS = MASCOT_SPRITE_FRAME_COUNT;

type MentaMascotSheetProps = {
  row: MascotSheetRow;
  testID?: string;
};

/** Renders the first sprite-sheet frame without scheduling animation work. */
export function MentaMascotSheet({ row, testID }: MentaMascotSheetProps) {
  const [size, setSize] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0 && next !== size) setSize(next);
  };

  return (
    <View
      onLayout={onLayout}
      style={styles.viewport}
      testID={testID ?? `menta-mascot-sheet-${row}`}
    >
      {size > 0 ? (
        <Image
          source={COMPANION_SHEETS[row]}
          resizeMode="stretch"
          style={{ width: size * MASCOT_SHEET_COLUMNS, height: size }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});
