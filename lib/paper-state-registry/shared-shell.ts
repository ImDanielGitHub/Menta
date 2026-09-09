export const SHARED_SHELL_PAPER_STATES = [
  {
    id: 'SHELL-TAB-01',
    paperNodeId: '520-0',
    artboardName: 'Shared Bottom Navigation',
    route: '/(tabs)',
    kind: 'bottom-tabs',
    sourceOfTruth: 'Expo Router tab state',
  },
] as const;

export type SharedShellPaperStateId =
  (typeof SHARED_SHELL_PAPER_STATES)[number]['id'];
