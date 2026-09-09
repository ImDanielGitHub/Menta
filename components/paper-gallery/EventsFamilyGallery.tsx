import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, SkeletonLoader, SkeletonText } from '@/components/ui';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  eventProductPaperStateContracts,
  type EventProductPaperStateContract,
  type EventProductPaperStateId,
} from '@/lib/paper-state-registry/events';

export type EventsFamilyAction = {
  id:
    | 'add_event_photo'
    | 'browse_events'
    | 'choose_event_photo'
    | 'replace_event_photo'
    | 'return_to_event'
    | 'open_attendee_album'
    | 'open_event_recap'
    | 'review_next_post'
    | 'retry_same_request'
    | 'try_another_code'
    | 'scan_event_qr'
    | 'create_event_draft';
  paperId: string;
};

type EventsFamilyGalleryProps = {
  states?: readonly EventProductPaperStateContract[];
  onAction?: (action: EventsFamilyAction) => void;
};

const stateCopy: Record<
  EventProductPaperStateId,
  { eyebrow: string; title: string; detail: string; action: string }
> = {
  '89T-0': {
    eyebrow: 'ATTENDANCE RECEIPT',
    title: 'You’re here.',
    detail:
      'Your event check-in is confirmed. Post one moment when you are ready.',
    action: 'Add event photo',
  },
  '89U-0': {
    eyebrow: 'EVENT MOMENT',
    title: 'Share one event moment.',
    detail:
      'Choose a photo and optional caption. It remains local until a receipt confirms the post.',
    action: 'Choose one photo',
  },
  '89V-0': {
    eyebrow: 'POSTING PARTICIPATION',
    title: 'Posting your moment.',
    detail: 'Menta is waiting for the same request’s event-service receipt.',
    action: 'Checking receipt',
  },
  '89W-0': {
    eyebrow: 'PARTICIPATION CONFIRMED',
    title: 'Your post was approved.',
    detail: 'The event service returned an approved participation receipt.',
    action: 'Back to event',
  },
  '89X-0': {
    eyebrow: 'ORGANISER REVIEW',
    title: 'Your post is safe.',
    detail:
      'The event service received it and returned a pending-review receipt.',
    action: 'Back to event',
  },
  '89Y-0': {
    eyebrow: 'EVENT PROOF NOT SENT',
    title: 'Your post has not been sent.',
    detail:
      'The photo remains on this device. Nothing is visible to attendees.',
    action: 'Try upload again',
  },
  '89Z-0': {
    eyebrow: 'ATTENDEE ALBUM',
    title: 'Everyone who showed up.',
    detail:
      'Checked-in attendees can open approved moments through one-minute private links.',
    action: 'Open attendee album',
  },
  '8A0-0': {
    eyebrow: 'ORGANISER REVIEW',
    title: 'Review participation fairly.',
    detail:
      'Only role-scoped server queue items and private previews appear here.',
    action: 'Review next post',
  },
  '8A1-0': {
    eyebrow: 'EVENT POLICY',
    title: 'Make approval predictable.',
    detail: 'Approve only media with a confirmed check-in and upload receipt.',
    action: 'Back to event',
  },
  '922-0': {
    eyebrow: 'EVENT CHECK-IN',
    title: 'Scan organiser QR.',
    detail:
      'The camera reads one organiser QR. Menta still waits for a server-owned attendance receipt.',
    action: 'Scan organiser QR',
  },
  'H1I-0': {
    eyebrow: 'CAMERA ACCESS',
    title: 'Allow camera access.',
    detail:
      'Menta uses the camera only while you scan this event’s organiser code. You can enter the code manually instead.',
    action: 'Allow camera',
  },
  'H2L-0': {
    eyebrow: 'CHECK-IN NOT ACCEPTED',
    title: 'No attendance receipt was created.',
    detail:
      'The organiser code may be expired, used, or for another occurrence.',
    action: 'Try another code',
  },
  'H3O-0': {
    eyebrow: 'CONNECTION NEEDED',
    title: 'Cannot confirm check-in yet.',
    detail:
      'Reconnect and retry the same code. No attendance receipt was created.',
    action: 'Retry check-in',
  },
  '923-0': {
    eyebrow: 'ORGANISER SETUP',
    title: 'Create a place to participate.',
    detail:
      'Set the occurrence, attendee visibility, check-in window and verification policy before sharing the event.',
    action: 'Create event draft',
  },
  'H4R-0': {
    eyebrow: 'EVENT RULES',
    title: 'Make participation predictable.',
    detail:
      'Save location, check-in window, photo posting and review policy in an owner-scoped draft. Publishing is unavailable.',
    action: 'Save event rules',
  },
  '924-0': {
    eyebrow: 'EVENT COMPLETE',
    title: 'The organiser recap is ready.',
    detail:
      'Joined, checked-in, posted and verified counts come from the latest ended occurrence.',
    action: 'Open event recap',
  },
  '925-0': {
    eyebrow: 'MORE EVIDENCE NEEDED',
    title: 'Your attendance is confirmed.',
    detail:
      'The organiser could not verify the current photo. Your original post is preserved while you add clearer evidence.',
    action: 'Replace event photo',
  },
  '926-0': {
    eyebrow: 'EVENT UNAVAILABLE',
    title: 'This event is no longer accepting participation.',
    detail:
      'It may be full, cancelled or outside its check-in window. Any unsent photo remains only on this device.',
    action: 'Find another event',
  },
};

const actionByPaperId: Partial<Record<string, EventsFamilyAction['id']>> = {
  '89T-0': 'add_event_photo',
  '89U-0': 'choose_event_photo',
  '89W-0': 'return_to_event',
  '89X-0': 'return_to_event',
  '89Y-0': 'retry_same_request',
  '89Z-0': 'open_attendee_album',
  '8A0-0': 'review_next_post',
  '8A1-0': 'return_to_event',
  'H2L-0': 'try_another_code',
  'H3O-0': 'retry_same_request',
  '925-0': 'replace_event_photo',
  '926-0': 'browse_events',
  '922-0': 'scan_event_qr',
  'H1I-0': 'scan_event_qr',
  '923-0': 'create_event_draft',
  'H4R-0': 'create_event_draft',
  '924-0': 'open_event_recap',
};

/** Dev-only deterministic preview surface. It intentionally has no route. */
export const EventsFamilyGallery = ({
  states = eventProductPaperStateContracts,
  onAction,
}: EventsFamilyGalleryProps) => (
  <View style={styles.gallery} testID="events-family-gallery">
    {states.map(state => (
      <EventsFamilyStatePreview
        key={state.paperId}
        onAction={onAction}
        state={state}
      />
    ))}
  </View>
);

export const EventsFamilyStatePreview = ({
  state,
  onAction,
}: {
  state: EventProductPaperStateContract;
  onAction?: (action: EventsFamilyAction) => void;
}) => {
  const copy = stateCopy[state.paperId];
  const loading = state.paperId === '89V-0';
  const actionId = actionByPaperId[state.paperId];

  return (
    <View
      accessibilityLabel={`${copy.eyebrow}. ${copy.title}. ${copy.detail}`}
      style={styles.state}
      testID={`events-paper-${state.paperId}`}
    >
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      {loading ? (
        <View accessibilityRole="progressbar" style={styles.loading}>
          <SkeletonLoader height={mentaSpacing[12]} />
          <SkeletonText lines={2} width="86%" />
        </View>
      ) : (
        <>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.detail}>{copy.detail}</Text>
          <View style={styles.rows}>
            <ReceiptRow label="Source of truth" value={state.sourceOfTruth} />
            <ReceiptRow
              label="Route"
              value={state.route.replace('/events/', '')}
              last
            />
          </View>
        </>
      )}
      <AppButton
        disabled={loading || !actionId}
        fullWidth
        onPress={() =>
          actionId ? onAction?.({ id: actionId, paperId: state.paperId }) : null
        }
        title={copy.action}
        variant="primary"
      />
    </View>
  );
};

const ReceiptRow = ({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={[styles.row, last ? null : styles.rowDivider]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  gallery: {
    alignSelf: 'center',
    gap: mentaSpacing[8],
    maxWidth: mentaLayout.focusedLane,
    width: '100%',
  },
  state: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[8],
  },
  eyebrow: {
    ...mentaTypography.labelBold,
    color: mentaColors.action,
  },
  title: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  detail: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  loading: { gap: mentaSpacing[3] },
  rows: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    gap: mentaSpacing[1],
    paddingVertical: mentaSpacing[3],
  },
  rowDivider: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    ...mentaTypography.label,
    color: mentaColors.text.secondary,
  },
  rowValue: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.primary,
  },
});
