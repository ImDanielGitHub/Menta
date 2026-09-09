import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { UsersIcon } from '@/components/ui/icons';
import { IPadTwoPaneWorkspace } from '@/components/ipad/ipad-workspace';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypeScale,
} from '@/constants/MentaDesignSystem';
import { mentaFonts } from '@/lib/menta-fonts';

export type IpadEventsWorkspaceItem = {
  key: string;
  section: 'authored' | 'upcoming';
  title: string;
  description: string | null;
  when: string;
  venue: string | null;
  capacity: string;
  context: string;
  actionLabel: string;
  actionHint: string;
  onOpen: () => void;
};

type IpadEventsWorkspaceProps = {
  items: IpadEventsWorkspaceItem[];
  authoredLabel: string;
  upcomingLabel: string;
  onRefresh: () => void;
  refreshing: boolean;
};

const EventRow = ({
  item,
  selected,
  onSelect,
}: {
  item: IpadEventsWorkspaceItem;
  selected: boolean;
  onSelect: () => void;
}) => (
  <Pressable
    accessibilityHint={item.actionHint}
    accessibilityLabel={item.title}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={onSelect}
    style={({ pressed }) => [
      styles.eventRow,
      selected && styles.eventRowSelected,
      pressed && styles.pressed,
    ]}
    testID={`ipad-event-select-${item.key}`}
  >
    <Text numberOfLines={2} style={styles.eventTitle}>
      {item.title}
    </Text>
    <Text numberOfLines={2} style={styles.eventMeta}>
      {item.when}
      {item.venue ? ` · ${item.venue}` : ''}
    </Text>
    <Text style={styles.eventContext}>{item.context}</Text>
  </Pressable>
);

export function IpadEventsWorkspace({
  items,
  authoredLabel,
  upcomingLabel,
  onRefresh,
  refreshing,
}: IpadEventsWorkspaceProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(
    items[0]?.key ?? null
  );
  const selectedItem = useMemo(
    () => items.find(item => item.key === selectedKey) ?? items[0] ?? null,
    [items, selectedKey]
  );
  const authoredItems = items.filter(item => item.section === 'authored');
  const upcomingItems = items.filter(item => item.section === 'upcoming');

  if (!selectedItem) return null;

  return (
    <IPadTwoPaneWorkspace
      enabled
      primary={
        <ScrollView
          contentContainerStyle={styles.masterContent}
          refreshControl={
            <RefreshControl
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={mentaColors.action}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.masterScroll}
        >
          {authoredItems.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{authoredLabel}</Text>
              {authoredItems.map(item => (
                <EventRow
                  item={item}
                  key={item.key}
                  onSelect={() => setSelectedKey(item.key)}
                  selected={selectedItem.key === item.key}
                />
              ))}
            </View>
          ) : null}

          {upcomingItems.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{upcomingLabel}</Text>
              {upcomingItems.map(item => (
                <EventRow
                  item={item}
                  key={item.key}
                  onSelect={() => setSelectedKey(item.key)}
                  selected={selectedItem.key === item.key}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      }
      primaryStyle={styles.masterPane}
      secondary={
        <ScrollView
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
          style={styles.detailPane}
          testID={`ipad-event-detail-${selectedItem.key}`}
        >
          <Text accessibilityRole="header" style={styles.detailTitle}>
            {selectedItem.title}
          </Text>
          <Text style={styles.detailWhen}>{selectedItem.when}</Text>
          {selectedItem.venue ? (
            <Text style={styles.detailVenue}>{selectedItem.venue}</Text>
          ) : null}

          <View style={styles.factRow}>
            <View style={styles.factPill}>
              <UsersIcon color={mentaColors.text.secondary} size={17} />
              <Text style={styles.factText}>{selectedItem.capacity}</Text>
            </View>
            <View style={styles.factPill}>
              <Text style={styles.factText}>{selectedItem.context}</Text>
            </View>
          </View>

          {selectedItem.description ? (
            <Text style={styles.description}>{selectedItem.description}</Text>
          ) : null}

          <AppButton
            accessibilityHint={selectedItem.actionHint}
            fullWidth
            onPress={selectedItem.onOpen}
            size="large"
            testID={`ipad-event-open-${selectedItem.key}`}
            title={selectedItem.actionLabel}
            variant="primary"
          />
        </ScrollView>
      }
      secondaryStyle={styles.detailPane}
      style={styles.workspace}
      testID="ipad-events-workspace"
    />
  );
}

const styles = StyleSheet.create({
  workspace: {
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 0,
    minHeight: 560,
    overflow: 'hidden',
  },
  masterPane: {
    alignSelf: 'stretch',
    backgroundColor: mentaColors.surface,
    borderRightColor: mentaColors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    flex: 0,
    flexBasis: 390,
    maxWidth: 440,
    minWidth: 340,
  },
  masterScroll: { flex: 1 },
  masterContent: {
    gap: mentaSpacing[8],
    padding: mentaSpacing[5],
  },
  section: { gap: mentaSpacing[2] },
  sectionLabel: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.semibold,
    marginBottom: mentaSpacing[1],
    ...mentaTypeScale.bodySmall,
  },
  eventRow: {
    borderColor: 'transparent',
    borderRadius: mentaRadii.medium,
    borderWidth: 1,
    gap: mentaSpacing[1],
    minHeight: 104,
    padding: mentaSpacing[4],
  },
  eventRowSelected: {
    backgroundColor: mentaColors.actionSoft,
    borderColor: mentaColors.actionBorder,
  },
  eventTitle: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.semibold,
    ...mentaTypeScale.bodyLarge,
  },
  eventMeta: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.caption,
  },
  eventContext: {
    color: mentaColors.success,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.caption,
  },
  detailPane: { flex: 1 },
  detailContent: {
    alignItems: 'flex-start',
    flexGrow: 1,
    padding: mentaSpacing[12],
  },
  detailTitle: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.medium,
    maxWidth: 680,
    ...mentaTypeScale.display,
  },
  detailWhen: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.medium,
    marginTop: mentaSpacing[5],
    ...mentaTypeScale.bodyLarge,
  },
  detailVenue: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    marginTop: mentaSpacing[1],
    ...mentaTypeScale.body,
  },
  factRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[3],
    marginTop: mentaSpacing[6],
  },
  factPill: {
    alignItems: 'center',
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[2],
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[2],
  },
  factText: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.bodySmall,
  },
  description: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    marginBottom: mentaSpacing[8],
    marginTop: mentaSpacing[8],
    maxWidth: 680,
    ...mentaTypeScale.bodyLarge,
  },
  pressed: { opacity: 0.72 },
});
