import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { ChallengeSubmissionsModal } from '@/components/challenge/ChallengeSubmissionsModal';
import { ChallengeSubmissions } from '@/components/challenge/detail/ChallengeSubmissions';
import {
  PromiseActiveState,
  PromiseCompleteState,
  PromiseDetailSkeletonState,
  PromiseHistoryState,
  PromiseProofDetailState,
  PromiseRulesState,
  PromiseUnavailableState,
  PromiseWaitingReviewState,
  type PromiseProofDay,
} from '@/components/challenge/promise-runtime-states';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getThemeAppearance } from '@/lib/shop/catalogSupport';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/components/ui/SignedImage', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');

  return {
    SignedImage: ({ alt }: { alt?: string }) => (
      <View accessibilityLabel={alt} />
    ),
  };
});

const renderWithTheme = (node: React.ReactElement, equippedThemeSku?: string) =>
  render(
    <ThemeProvider equippedThemeSku={equippedThemeSku}>{node}</ThemeProvider>
  );

const proofWeek: readonly PromiseProofDay[] = [
  { label: 'M', state: 'approved' },
  { label: 'T', state: 'approved' },
  { label: 'W', state: 'waiting' },
  { label: 'T', state: 'future' },
  { label: 'F', state: 'future' },
  { label: 'S', state: 'future' },
  { label: 'S', state: 'future' },
];

describe('proof evidence history', () => {
  it('renders the real text body, never media_url, and opens that exact proof', () => {
    const { getAllByText, getByTestId, getByText, queryByText } =
      renderWithTheme(
        <ChallengeSubmissions
          mode="full"
          verifications={[
            {
              id: 'text-proof',
              media_type: 'text',
              media_url: 'private/object-key-that-is-not-proof-copy',
              submission_text: 'Walked the river loop before work.',
              status: 'pending',
              submission_date: '2026-08-11T07:42:00.000Z',
            },
          ]}
        />
      );

    expect(getAllByText('Walked the river loop before work.')).toHaveLength(1);
    expect(queryByText('private/object-key-that-is-not-proof-copy')).toBeNull();

    const row = getByTestId('challenge-proof-text-proof');
    const rowStyle = StyleSheet.flatten(row.props.style);
    const thumbnailStyle = StyleSheet.flatten(
      getByTestId('challenge-proof-text-proof-thumbnail').props.style
    );
    expect(rowStyle.minHeight).toBe(92);
    expect(thumbnailStyle.width).toBe(66);
    expect(thumbnailStyle.height).toBe(66);

    fireEvent.press(row);
    expect(getByTestId('proof-evidence-viewer')).toBeTruthy();
    expect(getAllByText('Walked the river loop before work.')).toHaveLength(1);
    expect(queryByText('private/object-key-that-is-not-proof-copy')).toBeNull();
  });

  it('uses the white waiting receipt as the only proof action', () => {
    const onViewProof = jest.fn();
    const onDelete = jest.fn();
    const { getAllByText, getByTestId, getByText, queryByText } =
      renderWithTheme(
        <PromiseWaitingReviewState
          promiseTitle="Walk after work"
          reviewerName="Eli"
          sentLabel="Sent 12 minutes ago"
          proofTitle="Text proof"
          proofId="waiting-text-proof"
          proofMediaType="text"
          proofText="Completed the full twenty-minute route."
          submittedLabel="Today · 8:36 pm"
          week={proofWeek}
          onViewProof={onViewProof}
          onProofHistory={jest.fn()}
          onRules={jest.fn()}
          onPeople={jest.fn()}
          onDelete={onDelete}
        />
      );

    expect(queryByText('View proof')).toBeNull();
    expect(queryByText('PROOF RECEIPT')).toBeNull();
    expect(getByText('This day counts only after approval.')).toBeTruthy();
    expect(
      getAllByText('Completed the full twenty-minute route.')
    ).toHaveLength(1);
    fireEvent.press(getByTestId('waiting-promise-delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('waiting-proof-evidence'));
    expect(onViewProof).toHaveBeenCalledTimes(1);
    expect(getByTestId('proof-evidence-viewer')).toBeTruthy();
    expect(
      getAllByText('Completed the full twenty-minute route.')
    ).toHaveLength(1);
  });

  it('keeps an active solo promise on one dark action panel with evidence and route actions', () => {
    const onAddProof = jest.fn();
    const onProofHistory = jest.fn();
    const onRules = jest.fn();
    const onDelete = jest.fn();
    const { getByTestId, getByText } = renderWithTheme(
      <PromiseActiveState
        promiseTitle="Read for 20 minutes before bed"
        dueLabel="Proof due today"
        progressLabel="Day 4 of 14"
        scheduleLabel="Sun, Tue, Thu"
        proofLabel="Note proof"
        visibilityLabel="Private"
        week={proofWeek}
        onAddProof={onAddProof}
        onProofHistory={onProofHistory}
        onRules={onRules}
        onDelete={onDelete}
      />
    );

    expect(
      StyleSheet.flatten(getByTestId('active-promise-sheet').props.style)
        .backgroundColor
    ).toBe(mentaColors.raised);
    expect(getByText('Read for 20 minutes before bed')).toBeTruthy();
    expect(getByText('Proof due today')).toBeTruthy();
    expect(getByText('Day 4 of 14')).toBeTruthy();
    expect(getByTestId('promise-proof-week')).toBeTruthy();

    fireEvent.press(getByTestId('active-promise-add-proof'));
    fireEvent.press(getByText('Proof history'));
    fireEvent.press(getByText('Rules and schedule'));
    fireEvent.press(getByTestId('active-promise-delete'));
    expect(onAddProof).toHaveBeenCalledTimes(1);
    expect(onProofHistory).toHaveBeenCalledTimes(1);
    expect(onRules).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('never substitutes an older proof when pending evidence is unavailable', () => {
    const screen = renderWithTheme(
      <PromiseWaitingReviewState
        promiseTitle="Walk after work"
        sentLabel="Pending review confirmed"
        proofTitle="Proof submitted"
        submittedLabel="Submission time unavailable"
        proofAvailable={false}
        evidenceUnavailableMessage="The proof list did not refresh."
        week={proofWeek}
        onProofHistory={jest.fn()}
        onRules={jest.fn()}
        onPeople={jest.fn()}
      />
    );

    expect(screen.getByTestId('waiting-proof-unavailable')).toBeTruthy();
    expect(screen.getByText('The proof list did not refresh.')).toBeTruthy();
    expect(screen.queryByTestId('waiting-proof-evidence')).toBeNull();
  });

  it('renders the Paper route stage with compact accountability lanes and usable actions', () => {
    const onChangeSchedule = jest.fn();
    const onBack = jest.fn();
    const onManagePeople = jest.fn();
    const { getByTestId, getByText } = renderWithTheme(
      <PromiseRulesState
        promiseTitle="Read before bed"
        promiseSummary="Read for 20 minutes before bed."
        proofType="Note proof"
        proofDescription="Write what you read."
        rows={[
          {
            label: 'Schedule',
            value: 'Every day',
            onChange: onChangeSchedule,
          },
          { label: 'Proof type', value: 'Note proof' },
          { label: 'Reviewed by', value: 'You' },
          { label: 'Visibility', value: 'Only you' },
          { label: 'Length', value: '14 days' },
          { label: 'Reminder', value: '8:00 pm' },
          { label: 'People', value: 'Just you' },
        ]}
        onBack={onBack}
        onManagePeople={onManagePeople}
      />
    );

    const documentStyle = StyleSheet.flatten(
      getByTestId('promise-rules-document').props.style
    );
    expect(documentStyle).toEqual(
      expect.objectContaining({
        backgroundColor: mentaColors.paper,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        flexGrow: 1,
        width: '100%',
      })
    );
    expect(documentStyle.borderRadius).toBeUndefined();
    expect(documentStyle.shadowOpacity).toBeUndefined();
    expect(getByTestId('promise-rules-heading').props.accessibilityRole).toBe(
      'header'
    );
    expect(getByText('Schedule')).toBeTruthy();
    expect(getByText('Every day')).toBeTruthy();
    expect(getByText('Read for 20 minutes before bed.')).toBeTruthy();
    expect(
      getByText('Note proof · a day counts only after the proof is approved')
    ).toBeTruthy();
    expect(
      StyleSheet.flatten(getByTestId('promise-rule-row-0').props.style)
    ).toEqual(
      expect.objectContaining({
        alignItems: 'flex-start',
        flexDirection: 'column',
        gap: 4,
        minHeight: 58,
      })
    );
    expect(
      StyleSheet.flatten(getByTestId('promise-rule-row-0-label').props.style)
        .width
    ).toBe('100%');
    expect(
      StyleSheet.flatten(
        getByTestId('promise-rule-row-0-value-lane').props.style
      )
    ).toEqual(expect.objectContaining({ flex: 1, minWidth: 0, width: '100%' }));

    fireEvent.press(getByText('Every day'));
    expect(onChangeSchedule).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('promise-rules-back'));
    fireEvent.press(getByTestId('promise-rules-manage-people'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onManagePeople).toHaveBeenCalledTimes(1);
  });

  it('keeps long promise, proof and role copy flexible for compact and large-type layouts', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <PromiseRulesState
        promiseTitle="Read before bed"
        promiseSummary="Read for 20 minutes before bed, even when the day runs late."
        proofType="Written note proof"
        proofDescription="Name the book and chapter, explain what happened, and write the main idea you took from it."
        rows={[
          { label: 'Schedule', value: 'Sunday, Tuesday and Thursday' },
          { label: 'Proof type', value: 'Written note proof' },
          {
            label: 'Reviewed by',
            value: 'A trusted accountability partner with a long name',
          },
          { label: 'Visibility', value: 'Only you and invited people' },
          { label: 'Length', value: '14 opportunities' },
          { label: 'Reminder', value: '7:30 pm' },
          { label: 'People', value: 'You and one accountability partner' },
        ]}
      />
    );

    expect(
      getByText('Read for 20 minutes before bed, even when the day runs late.')
        .props.numberOfLines
    ).toBeUndefined();
    expect(
      getByText(
        'Name the book and chapter, explain what happened, and write the main idea you took from it.'
      ).props.numberOfLines
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(getByTestId('promise-rules-document').props.style)
        .height
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(getByTestId('promise-rule-row-2').props.style).height
    ).toBeUndefined();
  });

  it('uses a physical proof receipt and opens the exact proof record', () => {
    const onViewProof = jest.fn();
    const onProofHistory = jest.fn();
    const { getAllByText, getByTestId } = renderWithTheme(
      <PromiseProofDetailState
        proof={{
          id: 'accepted-note',
          mediaType: 'text',
          submissionText: 'Read two chapters of The Dispossessed.',
          state: 'approved',
          submittedLabel: 'Today · 8:47 pm',
          evidenceTitle: 'Note proof',
          reviewerName: 'Eli',
        }}
        onViewProof={onViewProof}
        onProofHistory={onProofHistory}
      />
    );

    expect(
      StyleSheet.flatten(getByTestId('promise-proof-receipt').props.style)
        .backgroundColor
    ).toBe(mentaColors.paper);
    fireEvent.press(getByTestId('promise-proof-detail-history'));
    expect(onProofHistory).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('promise-proof-detail-evidence'));
    expect(onViewProof).toHaveBeenCalledTimes(1);
    expect(getByTestId('proof-evidence-viewer')).toBeTruthy();
    expect(getAllByText('Read two chapters of The Dispossessed.')).toHaveLength(
      1
    );
  });

  it('keeps history explicit and tappable while exposing empty, loading, and stale states', () => {
    const loaded = renderWithTheme(
      <PromiseHistoryState
        durationLabel="14-day promise"
        promiseTitle="Walk after work"
        staleMessage="The latest refresh failed."
        entries={[
          {
            id: 'approved-text-proof',
            dayLabel: 'TODAY',
            timeLabel: '8:34 pm',
            detail: 'Text proof',
            evidenceTitle: 'Text proof',
            submissionText: 'Finished the route beside the river.',
            mediaType: 'text',
            mediaUrl: 'private/not-displayable-as-text',
            reviewerName: 'Eli',
            status: 'approved',
          },
          {
            id: 'missed-day',
            kind: 'outcome',
            dayLabel: 'Tuesday, 11 Aug',
            timeLabel: 'Day outcome',
            detail:
              'Proof was not received by the deadline. The previous run ended at 4 days.',
            status: 'missed',
          },
          {
            id: 'protected-day',
            kind: 'outcome',
            dayLabel: 'Monday, 10 Aug',
            timeLabel: 'Day outcome',
            detail:
              'A Streak Freeze protected this day. The streak remained at 4 days.',
            status: 'protected',
          },
        ]}
      />
    );

    expect(loaded.getByText('Proof history may be out of date')).toBeTruthy();
    expect(loaded.getByText('Newest first')).toBeTruthy();
    expect(loaded.getByTestId('promise-history-ledger')).toBeTruthy();
    expect(loaded.getByText('14-day promise')).toBeTruthy();
    expect(loaded.queryByText('14-DAY PROMISE')).toBeNull();
    expect(loaded.getByText('Approved by Eli')).toBeTruthy();
    expect(loaded.queryByText('APPROVED')).toBeNull();
    expect(loaded.queryByText('private/not-displayable-as-text')).toBeNull();
    expect(
      loaded.getByTestId('promise-history-outcome-missed-day')
    ).toBeTruthy();
    expect(
      loaded.getByTestId('promise-history-outcome-protected-day')
    ).toBeTruthy();

    fireEvent.press(
      loaded.getByTestId('promise-history-proof-approved-text-proof')
    );
    expect(loaded.getByTestId('proof-evidence-viewer')).toBeTruthy();
    expect(
      loaded.getAllByText('Finished the route beside the river.')
    ).toHaveLength(1);

    loaded.unmount();

    const empty = renderWithTheme(
      <PromiseHistoryState
        durationLabel="14-day promise"
        promiseTitle="Walk after work"
        entries={[]}
      />
    );
    expect(empty.getByText('No history yet')).toBeTruthy();
    empty.unmount();

    const loading = renderWithTheme(
      <PromiseHistoryState
        durationLabel="14-day promise"
        promiseTitle="Walk after work"
        entries={[]}
        loading
      />
    );
    expect(loading.getByLabelText('Loading proof history')).toBeTruthy();
  });

  it('hands the exact history proof to a dedicated detail route when provided', () => {
    const onOpenProof = jest.fn();
    const screen = renderWithTheme(
      <PromiseHistoryState
        durationLabel="14-day promise"
        promiseTitle="Read after work"
        entries={[
          {
            id: 'approved-proof',
            dayLabel: 'Today',
            timeLabel: '8:47 pm',
            detail: 'Approved by Eli',
            reviewerName: 'Eli',
            status: 'approved',
            mediaType: 'text',
            submissionText: 'Read chapter six.',
          },
        ]}
        onOpenProof={onOpenProof}
      />
    );

    fireEvent.press(screen.getByTestId('promise-history-proof-approved-proof'));

    expect(onOpenProof).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'approved-proof',
        state: 'approved',
        submissionText: 'Read chapter six.',
      })
    );
    expect(screen.queryByTestId('proof-evidence-viewer')).toBeNull();
  });

  it('shows the server-read completion tally without inventing a reward', () => {
    const onShareResult = jest.fn();
    const onMakeAnother = jest.fn();
    const onBackToToday = jest.fn();
    const onProofHistory = jest.fn();
    const onDelete = jest.fn();
    const { getAllByTestId, getByTestId, getByText, queryByText } =
      renderWithTheme(
        <PromiseCompleteState
          record={{
            source: 'server-readback',
            approvedDays: 12,
            totalDays: 14,
            visibility: 'Private',
            reviewerSummary: 'you reviewed your own proof',
          }}
          onShareResult={onShareResult}
          onMakeAnother={onMakeAnother}
          onBackToToday={onBackToToday}
          onProofHistory={onProofHistory}
          onDelete={onDelete}
        />
      );

    expect(getByTestId('promise-completion-tally')).toBeTruthy();
    expect(getAllByTestId(/promise-completion-day-/)).toHaveLength(14);
    expect(getByText('12 of 14 days were approved.')).toBeTruthy();
    expect(queryByText(/reward/i)).toBeNull();
    expect(queryByText(/Momenta/i)).toBeNull();

    fireEvent.press(getByText('Share result'));
    fireEvent.press(getByText('Make another promise'));
    fireEvent.press(getByText('Back to Today'));
    fireEvent.press(getByText('View proof history'));
    fireEvent.press(getByTestId('complete-promise-delete'));
    expect(onShareResult).toHaveBeenCalledTimes(1);
    expect(onMakeAnother).toHaveBeenCalledTimes(1);
    expect(onBackToToday).toHaveBeenCalledTimes(1);
    expect(onProofHistory).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('keeps local-proof recovery actions distinct and preserves every callback', () => {
    const onRetry = jest.fn();
    const onCheckProofStatus = jest.fn();
    const onBackToToday = jest.fn();
    const onReportProblem = jest.fn();
    const { getByTestId, getByText, queryByText } = renderWithTheme(
      <PromiseUnavailableState
        hasLocalProof
        onRetry={onRetry}
        onCheckProofStatus={onCheckProofStatus}
        onBackToToday={onBackToToday}
        onReportProblem={onReportProblem}
      />
    );

    expect(
      StyleSheet.flatten(
        getByTestId('promise-unavailable-local-proof').props.style
      ).backgroundColor
    ).toBe(mentaColors.paper);
    expect(getByText('Delivery not confirmed')).toBeTruthy();
    expect(getByText('Your proof is still saved on this phone.')).toBeTruthy();
    expect(queryByText(/resend/i)).toBeNull();

    fireEvent.press(getByText('Check again'));
    fireEvent.press(getByText('Check proof status'));
    fireEvent.press(getByText('Back to Today'));
    fireEvent.press(getByText('Report a problem'));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onCheckProofStatus).toHaveBeenCalledTimes(1);
    expect(onBackToToday).toHaveBeenCalledTimes(1);
    expect(onReportProblem).toHaveBeenCalledTimes(1);
  });

  it('does not imply a delivery attempt when no local proof exists', () => {
    const screen = renderWithTheme(
      <PromiseUnavailableState
        hasLocalProof={false}
        onRetry={jest.fn()}
        onCheckProofStatus={jest.fn()}
        onBackToToday={jest.fn()}
        onReportProblem={jest.fn()}
      />
    );

    expect(screen.getByText('Promise status unavailable')).toBeTruthy();
    expect(screen.queryByText('Delivery not confirmed')).toBeNull();
  });

  it('keeps the initial skeleton on the loaded task lane without an eyebrow or 82pt action', () => {
    const { getAllByTestId, UNSAFE_getAllByType } = renderWithTheme(
      <PromiseDetailSkeletonState />
    );

    const weekCells = getAllByTestId('promise-skeleton-week-cell');
    expect(weekCells).toHaveLength(7);
    weekCells.forEach(cell => {
      expect(StyleSheet.flatten(cell.props.style)).toMatchObject({
        flex: 1,
        minWidth: 0,
      });
    });

    const skeletonBones = UNSAFE_getAllByType(SkeletonLoader);
    expect(
      skeletonBones.some(
        bone => bone.props.width === 112 && bone.props.height === 24
      )
    ).toBe(false);
    expect(skeletonBones.some(bone => bone.props.height === 82)).toBe(false);
    expect(skeletonBones.some(bone => bone.props.height === 52)).toBe(true);
  });

  it('keeps the modal proof rows full-lane and opens the selected record', () => {
    const emberTheme = getThemeAppearance('profile_theme_ember');
    const { getAllByText, getByTestId, getByText, queryByText } =
      renderWithTheme(
        <ChallengeSubmissionsModal
          visible
          onClose={jest.fn()}
          title="Morning walk"
          staleMessage="Saved history is shown while refresh is unavailable."
          submissions={[
            {
              id: 'modal-text-proof',
              challenge_id: 'challenge-1',
              status: 'rejected',
              submission_date: '2026-08-10T20:11:00.000Z',
              media_type: 'text',
              media_url: 'private/modal-object-key',
              submission_text: 'I walked the hill route after dinner.',
              review_notes: 'Add the finish point next time.',
            },
          ]}
        />,
        'profile_theme_ember'
      );

    const modalSurface = StyleSheet.flatten(
      getByTestId('modal-card-surface').props.style
    );
    const proofRow = getByTestId('submissions-modal-proof-modal-text-proof');
    const rowStyle = StyleSheet.flatten(proofRow.props.style);
    const thumbnailStyle = StyleSheet.flatten(
      getByTestId('submissions-modal-proof-modal-text-proof-thumbnail').props
        .style
    );

    expect(modalSurface.backgroundColor).toBe(emberTheme?.surfacePrimary);
    expect(rowStyle.backgroundColor).toBe(emberTheme?.surfacePrimary);
    expect(thumbnailStyle.backgroundColor).toBe(
      emberTheme?.backgroundSecondary
    );
    expect(getAllByText('Needs another try').length).toBeGreaterThan(0);
    expect(queryByText('Needs retry')).toBeNull();
    expect(getByText('Proof history may be out of date')).toBeTruthy();
    expect(queryByText('private/modal-object-key')).toBeNull();

    fireEvent.press(proofRow);
    expect(getByTestId('proof-evidence-viewer')).toBeTruthy();
    expect(
      StyleSheet.flatten(
        getByTestId('proof-evidence-viewer-surface').props.style
      ).backgroundColor
    ).toBe(emberTheme?.surfacePrimary);
    expect(getAllByText('I walked the hill route after dinner.')).toHaveLength(
      2
    );
    expect(queryByText('private/modal-object-key')).toBeNull();
  });

  it('keeps a missing photo preview classified as photo proof', () => {
    const { getByTestId, getByText, queryByText } = renderWithTheme(
      <ChallengeSubmissionsModal
        visible
        onClose={jest.fn()}
        submissions={[
          {
            id: 'photo-without-preview',
            challenge_id: 'challenge-1',
            status: 'pending',
            submission_date: '2026-08-10T20:11:00.000Z',
            media_type: 'photo',
            media_url: null,
            submission_text: null,
          },
        ]}
      />
    );

    expect(getByText('Photo proof')).toBeTruthy();
    expect(queryByText('Text proof')).toBeNull();

    fireEvent.press(
      getByTestId('submissions-modal-proof-photo-without-preview')
    );
    expect(
      getByText('The proof preview is temporarily unavailable.')
    ).toBeTruthy();
    expect(queryByText('The written proof is unavailable.')).toBeNull();
  });
});
