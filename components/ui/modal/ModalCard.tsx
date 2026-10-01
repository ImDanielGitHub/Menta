import { useMentaPalette } from '@/constants/use-menta-palette';
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  View,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
  type StyleProp,
  type ModalProps,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mentaRadii, mentaSpacing } from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import type { ModalSurface } from '@/components/ui/modal/types';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import {
  IPAD_BOUNDED_SHEET_MAX_WIDTH,
  shouldUseBoundedIPadSheet,
} from '@/constants/responsive-layout';

type ModalCardProps = {
  visible: boolean;
  onClose: () => void;
  onDismiss?: ModalProps['onDismiss'];
  children: React.ReactNode;
  maxWidth?: number;
  dismissOnBackdrop?: boolean;
  surface?: ModalSurface;
  /** Regular-width iPads default to a bounded task surface. Edge is explicit. */
  presentationRole?: 'edge' | 'bounded';
  animationType?: ModalProps['animationType'];
  accessibilityLabel?: string;
  overlayStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

export const ModalCard: React.FC<ModalCardProps> = ({
  visible,
  onClose,
  onDismiss,
  children,
  maxWidth = 440,
  dismissOnBackdrop = true,
  surface = 'dialog',
  presentationRole = 'bounded',
  animationType = 'fade',
  accessibilityLabel,
  overlayStyle,
  cardStyle,
  testID,
}) => {
  const mentaColors = useMentaPalette();

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const motion = useMotionPreferences();
  const isSheet = surface === 'sheet';
  const isFullScreen = surface === 'full_screen';
  // A locked full-screen surface has no backdrop action. Let descendant
  // scroll views own touches instead of wrapping them in press responders.
  const isStaticSurface = isFullScreen && !dismissOnBackdrop;
  const Container = isStaticSurface ? View : Pressable;
  const isBoundedIPadSheet =
    isSheet &&
    presentationRole === 'bounded' &&
    shouldUseBoundedIPadSheet(width, Platform.OS === 'ios' && Platform.isPad);
  const isEdgeSheet = isSheet && !isBoundedIPadSheet;
  const isBoundedCard = !isFullScreen && (!isSheet || isBoundedIPadSheet);
  const resolvedAnimationType = motion.reduceMotion ? 'none' : animationType;
  const handleRequestClose = () => {
    if (dismissOnBackdrop) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={resolvedAnimationType}
      onRequestClose={handleRequestClose}
      onDismiss={onDismiss}
      presentationStyle="overFullScreen"
      supportedOrientations={
        Platform.OS === 'ios' && Platform.isPad
          ? [
              'portrait',
              'portrait-upside-down',
              'landscape-left',
              'landscape-right',
            ]
          : ['portrait']
      }
      accessibilityLabel={accessibilityLabel}
      accessibilityViewIsModal
      testID={testID}
    >
      <Container
        testID={testID ? `${testID}-backdrop` : 'modal-card-backdrop'}
        style={[
          styles.overlay,
          {
            backgroundColor:
              theme.colors.background.overlay || mentaColors.scrim,
            justifyContent: isEdgeSheet ? 'flex-end' : 'center',
            alignItems: isEdgeSheet || isFullScreen ? 'stretch' : 'center',
            paddingHorizontal:
              isEdgeSheet || isFullScreen ? 0 : mentaSpacing[6],
            paddingVertical: isEdgeSheet || isFullScreen ? 0 : mentaSpacing[6],
          },
          overlayStyle,
        ]}
        accessible={false}
        importantForAccessibility="no"
        {...(!isStaticSurface && {
          onPress: () => {
            if (dismissOnBackdrop) onClose();
          },
        })}
      >
        <Container
          testID={testID ? `${testID}-surface` : 'modal-card-surface'}
          {...(!isStaticSurface && {
            onPress: (event: GestureResponderEvent) => event.stopPropagation(),
          })}
          accessible={false}
          accessibilityViewIsModal
          importantForAccessibility="no"
          style={[
            styles.card,
            {
              width: '100%',
              maxWidth: isBoundedIPadSheet
                ? Math.max(maxWidth, IPAD_BOUNDED_SHEET_MAX_WIDTH)
                : isBoundedCard
                  ? maxWidth
                  : undefined,
              marginHorizontal: 0,
              borderWidth: isBoundedCard ? 1 : 0,
              borderTopWidth: isEdgeSheet
                ? StyleSheet.hairlineWidth
                : isFullScreen
                  ? 0
                  : 1,
              borderLeftWidth: isBoundedCard ? 1 : 0,
              borderRightWidth: isBoundedCard ? 1 : 0,
              borderBottomWidth: isBoundedCard ? 1 : 0,
              borderRadius: isBoundedCard ? mentaRadii.large : 0,
              borderTopLeftRadius: isEdgeSheet
                ? mentaRadii.large
                : isFullScreen
                  ? 0
                  : mentaRadii.large,
              borderTopRightRadius: isEdgeSheet
                ? mentaRadii.large
                : isFullScreen
                  ? 0
                  : mentaRadii.large,
              borderBottomLeftRadius:
                isEdgeSheet || isFullScreen ? 0 : mentaRadii.large,
              borderBottomRightRadius:
                isEdgeSheet || isFullScreen ? 0 : mentaRadii.large,
              backgroundColor:
                isSheet || isFullScreen
                  ? theme.colors.surface.primary
                  : theme.colors.background.secondary,
              borderColor: theme.colors.border.primary,
              alignSelf: isEdgeSheet || isFullScreen ? 'stretch' : 'center',
              flex: isFullScreen ? 1 : undefined,
              paddingBottom: isEdgeSheet ? insets.bottom : undefined,
            },
            cardStyle,
          ]}
        >
          {children}
        </Container>
      </Container>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  card: {
    overflow: 'hidden',
  },
});

export default ModalCard;
