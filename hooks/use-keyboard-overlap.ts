import React from 'react';
import {
  Keyboard,
  Platform,
  TextInput,
  type KeyboardEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type View,
} from 'react-native';

type MeasuredBox = { y: number; height: number };

const measure = (view: View) =>
  new Promise<MeasuredBox>(resolve => {
    view.measureInWindow((_x, y, _width, height) => resolve({ y, height }));
  });

/**
 * Bottom padding that lifts `targetRef` (usually a fixed action footer) clear
 * of the iOS keyboard.
 *
 * Inside a modal sheet, layout measurements are relative to the sheet while
 * the keyboard reports screen coordinates, so KeyboardAvoidingView leaves the
 * footer under the keys. Comparing the keyboard's height with the target's
 * distance to the bottom of `rootRef` (a view that fills the screen or sheet)
 * keeps both numbers in the same space. Android keeps its window pan
 * behaviour, so this returns 0 there.
 */
export const useKeyboardOverlap = ({
  rootRef,
  targetRef,
  gapAboveKeyboard = 12,
  onShown,
}: {
  rootRef: React.RefObject<View | null>;
  targetRef: React.RefObject<View | null>;
  gapAboveKeyboard?: number;
  onShown?: () => void;
}): number => {
  const [overlap, setOverlap] = React.useState(0);
  const overlapRef = React.useRef(0);
  const onShownRef = React.useRef(onShown);
  onShownRef.current = onShown;

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const update = (next: number) => {
      overlapRef.current = next;
      setOverlap(next);
    };

    const showSubscription = Keyboard.addListener(
      'keyboardWillShow',
      (event: KeyboardEvent) => {
        const root = rootRef.current;
        const target = targetRef.current;
        if (!root || !target) return;
        void Promise.all([measure(root), measure(target)]).then(
          ([rootBox, targetBox]) => {
            // The target is already lifted by the current padding.
            const targetBottom =
              targetBox.y + targetBox.height + overlapRef.current;
            const distanceToBottom = rootBox.y + rootBox.height - targetBottom;
            update(
              Math.max(
                0,
                Math.round(
                  event.endCoordinates.height -
                    distanceToBottom +
                    gapAboveKeyboard
                )
              )
            );
            onShownRef.current?.();
          }
        );
      }
    );
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () =>
      update(0)
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [gapAboveKeyboard, rootRef, targetRef]);

  return overlap;
};

const FOCUSED_INPUT_MARGIN = 16;

type ScrollViewWithInnerRef = ScrollView & {
  getInnerViewRef?: () => View | null;
};

/**
 * Keeps the focused text input inside a ScrollView's visible area once the
 * keyboard padding has shrunk it. Spread the returned handlers onto the
 * ScrollView and pass `requestReveal` to `useKeyboardOverlap`.
 */
export const useRevealFocusedInput = (
  scrollRef: React.RefObject<ScrollView | null>
) => {
  const viewportHeightRef = React.useRef(0);
  const scrollOffsetRef = React.useRef(0);
  const pendingRef = React.useRef(false);

  const reveal = React.useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput();
    const scroll = scrollRef.current as ScrollViewWithInnerRef | null;
    const content = scroll?.getInnerViewRef?.();
    const viewport = viewportHeightRef.current;
    if (!input || !scroll || !content || viewport <= 0) return;
    input.measureLayout(content, (_x, y, _width, height) => {
      const offset = scrollOffsetRef.current;
      const bottom = y + height + FOCUSED_INPUT_MARGIN;
      if (bottom > offset + viewport) {
        scroll.scrollTo({ y: bottom - viewport, animated: true });
      } else if (y - FOCUSED_INPUT_MARGIN < offset) {
        scroll.scrollTo({
          y: Math.max(0, y - FOCUSED_INPUT_MARGIN),
          animated: true,
        });
      }
    });
  }, [scrollRef]);

  const requestReveal = React.useCallback(() => {
    // The viewport shrinks on the next layout pass; reveal again then.
    pendingRef.current = true;
    reveal();
  }, [reveal]);

  const onLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeightRef.current = event.nativeEvent.layout.height;
      if (pendingRef.current) {
        pendingRef.current = false;
        reveal();
      }
    },
    [reveal]
  );

  const onScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    },
    []
  );

  return { requestReveal, onLayout, onScroll };
};
