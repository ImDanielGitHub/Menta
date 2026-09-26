import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityElement,
  accessibilityHidden,
  accessibilityLabel,
  aspectRatio,
  containerBackground,
  font,
  fixedSize,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  resizable,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { StreakWidgetSnapshot } from '@/lib/widgets/widget-model';

/** Paper: Menta Home Screen Widget / 02 — Streak widgets — All sizes. */
const MentaStreakWidget = (
  props: StreakWidgetSnapshot,
  environment: WidgetEnvironment
) => {
  'widget';
  // WidgetKit executes this function outside the app runtime. Keep constants and
  // helpers here, and send pre-localised, privacy-filtered data through props.
  const family = environment.widgetFamily;
  const compact = family === 'systemSmall';
  const accessory = family.startsWith('accessory');
  const large = family === 'systemLarge' || family === 'systemExtraLarge';
  const extraLarge = family === 'systemExtraLarge';
  const monochrome =
    environment.widgetRenderingMode === 'vibrant' ||
    environment.widgetRenderingMode === 'accented';
  const light = environment.colorScheme === 'light' && !accessory;
  const foreground = monochrome ? '#FFFFFF' : light ? '#080909' : '#F8F7F1';
  const muted = monochrome ? '#E0E0E0' : light ? '#565650' : '#B7B6AF';
  const accent = monochrome ? foreground : light ? '#6742A8' : '#B88CFF';
  const background = light ? '#F8F7F1' : '#181919';
  const numberColor =
    props.state === 'risk' && !monochrome
      ? light
        ? '#866000'
        : '#E8C66A'
      : foreground;
  const statusColor = monochrome
    ? foreground
    : props.statusTone === 'warning'
      ? light
        ? '#866000'
        : '#E8C66A'
      : props.statusTone === 'success'
        ? light
          ? '#1F7A4D'
          : '#8DE7B7'
        : props.statusTone === 'muted'
          ? muted
          : accent;
  const title = props.title || 'Menta';
  const heading = props.heading || 'Give your streak a home.';
  const detail = props.detail || 'Choose a promise in Menta.';
  const action = props.action || 'Open Menta';
  const streak = props.streak || '';
  const streakLabel = props.streakLabel || 'day streak';
  const modifiers = [
    widgetURL(props.url || 'menta://home-widget'),
    accessibilityElement('ignore'),
    accessibilityLabel(props.accessibilityText || `${heading} ${detail}`),
    ...(accessory ? [] : [containerBackground(background, 'widget')]),
  ];

  if (family === 'accessoryInline') {
    return (
      <Text
        modifiers={[
          ...modifiers,
          font({ textStyle: 'caption', weight: 'semibold' }),
          lineLimit(1),
        ]}
      >
        {props.inlineText || heading}
      </Text>
    );
  }
  if (family === 'accessoryCircular') {
    return (
      <VStack spacing={0} modifiers={modifiers}>
        <Text
          modifiers={[
            font({ size: 28, weight: 'bold' }),
            minimumScaleFactor(0.6),
            lineLimit(1),
            foregroundStyle(foreground),
          ]}
        >
          {streak || '↗'}
        </Text>
        <Text
          modifiers={[
            font({ size: 10, weight: 'semibold' }),
            minimumScaleFactor(0.8),
            lineLimit(1),
            foregroundStyle(foreground),
          ]}
        >
          {streak ? props.status || streakLabel : action}
        </Text>
      </VStack>
    );
  }
  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={2} modifiers={modifiers}>
        <Text
          modifiers={[
            font({ textStyle: 'headline', weight: 'bold' }),
            lineLimit(1),
            minimumScaleFactor(0.75),
            foregroundStyle(foreground),
          ]}
        >
          {streak ? `${streak} ${streakLabel}` : heading}
        </Text>
        <Text
          modifiers={[
            font({ textStyle: 'caption' }),
            lineLimit(1),
            foregroundStyle(foreground),
          ]}
        >
          {title}
        </Text>
        <Text
          modifiers={[
            font({ textStyle: 'caption2', weight: 'semibold' }),
            lineLimit(1),
            foregroundStyle(foreground),
          ]}
        >
          {props.status || action}
        </Text>
      </VStack>
    );
  }

  // Paper 19 / W02. Only primitives this widget already used, so the layout
  // stays safe for the native widget runtime shipped in the binary.
  const status = props.status || action;
  const showMascot =
    Boolean(props.mascotUri) &&
    Boolean(streak) &&
    !environment.isLuminanceReduced &&
    !monochrome;
  const mascotSize = extraLarge ? 150 : large ? 110 : compact ? 64 : 0;
  const count = (
    <VStack alignment="leading" spacing={0}>
      <Text
        modifiers={[
          font({
            family: 'Newsreader-SemiBold',
            size: extraLarge
              ? 104
              : large
                ? 82
                : streak.length > 2
                  ? 44
                  : compact
                    ? 52
                    : 56,
          }),
          foregroundStyle(numberColor),
          lineLimit(1),
          minimumScaleFactor(0.65),
        ]}
      >
        {streak}
      </Text>
      <Text
        modifiers={[
          font({ size: large ? 15 : 13, weight: 'medium' }),
          foregroundStyle(muted),
          lineLimit(1),
        ]}
      >
        {streakLabel}
      </Text>
    </VStack>
  );
  const statusLine = (
    <Text
      modifiers={[
        font({ size: large ? 17 : 14, weight: 'semibold' }),
        foregroundStyle(statusColor),
        lineLimit(1),
        minimumScaleFactor(0.8),
      ]}
    >
      {status}
    </Text>
  );
  const promiseLine = (
    <Text
      modifiers={[
        font({ size: large ? 14 : 12 }),
        foregroundStyle(muted),
        lineLimit(1),
      ]}
    >
      {title}
    </Text>
  );
  const promiseTitle = (
    <Text
      modifiers={[
        font({
          family: 'Newsreader-SemiBold',
          size: extraLarge ? 30 : large ? 24 : 20,
        }),
        foregroundStyle(foreground),
        lineLimit(2),
        minimumScaleFactor(0.8),
        fixedSize({ horizontal: false, vertical: true }),
      ]}
    >
      {title}
    </Text>
  );
  const mascot = showMascot ? (
    <Image
      uiImage={props.mascotUri}
      modifiers={[
        resizable(),
        aspectRatio({ ratio: 1, contentMode: 'fit' }),
        frame({ width: mascotSize, height: mascotSize }),
        accessibilityHidden(),
      ]}
    />
  ) : null;
  const week = props.history?.length ? (
    <HStack spacing={extraLarge ? 22 : large ? 14 : 8}>
      {props.history.map((day, index) => (
        <VStack key={index} spacing={3}>
          <Text
            modifiers={[
              font({ textStyle: 'caption2' }),
              foregroundStyle(muted),
            ]}
          >
            {day.label}
          </Text>
          <Text
            modifiers={[
              font({ size: large ? 17 : 13 }),
              foregroundStyle(accent),
              accessibilityLabel(day.description),
            ]}
          >
            {day.mark}
          </Text>
        </VStack>
      ))}
    </HStack>
  ) : null;
  const fill = frame({
    maxWidth: 10000,
    maxHeight: 10000,
    alignment: 'topLeading',
  });

  // No streak yet (empty, choose, signed-out, stale): one clear invitation.
  if (!streak) {
    return (
      <VStack
        alignment="leading"
        spacing={compact ? 6 : 8}
        modifiers={[...modifiers, fill]}
      >
        <Text
          modifiers={[
            font({
              family: 'Newsreader-SemiBold',
              size: extraLarge ? 34 : large ? 29 : compact ? 20 : 24,
            }),
            foregroundStyle(foreground),
            lineLimit(large ? 3 : 2),
            minimumScaleFactor(0.8),
            fixedSize({ horizontal: false, vertical: true }),
          ]}
        >
          {heading}
        </Text>
        {!compact ? (
          <Text
            modifiers={[
              font({ size: large ? 16 : 14 }),
              foregroundStyle(muted),
              lineLimit(2),
            ]}
          >
            {detail}
          </Text>
        ) : null}
        <Spacer minLength={0} />
        <Text
          modifiers={[
            font({ size: large ? 16 : 13, weight: 'semibold' }),
            foregroundStyle(accent),
            lineLimit(2),
            minimumScaleFactor(0.85),
          ]}
        >
          {action}
        </Text>
      </VStack>
    );
  }

  if (compact) {
    return (
      <VStack alignment="leading" spacing={0} modifiers={[...modifiers, fill]}>
        <HStack alignment="top" spacing={0}>
          {count}
          <Spacer minLength={0} />
          {mascot}
        </HStack>
        <Spacer minLength={0} />
        {statusLine}
        {promiseLine}
      </VStack>
    );
  }

  if (!large) {
    return (
      <HStack alignment="top" spacing={16} modifiers={[...modifiers, fill]}>
        <VStack alignment="leading" spacing={0}>
          {count}
          <Spacer minLength={0} />
          {statusLine}
        </VStack>
        <VStack alignment="leading" spacing={4}>
          {promiseTitle}
          <Text
            modifiers={[
              font({ size: 13 }),
              foregroundStyle(muted),
              lineLimit(2),
            ]}
          >
            {detail}
          </Text>
          <Spacer minLength={0} />
          {week}
        </VStack>
      </HStack>
    );
  }

  return (
    <VStack
      alignment="leading"
      spacing={extraLarge ? 16 : 12}
      modifiers={[...modifiers, fill]}
    >
      <HStack alignment="top" spacing={0}>
        {count}
        <Spacer minLength={0} />
        {mascot}
      </HStack>
      {statusLine}
      {promiseTitle}
      <Text
        modifiers={[
          font({ size: extraLarge ? 17 : 15 }),
          foregroundStyle(muted),
          lineLimit(2),
        ]}
      >
        {detail}
      </Text>
      <Spacer minLength={0} />
      {week}
    </VStack>
  );
};

export default createWidget<StreakWidgetSnapshot>(
  'MentaStreak',
  MentaStreakWidget
);
