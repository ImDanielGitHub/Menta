import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { CreateTabBridgeState } from '@/components/challenge/promise-runtime-states';
import { showToast } from '@/components/ui/Toast';
import { useGroupCooldownCheck } from '@/hooks/useGroupCooldownCheck';
import {
  openCreateGroup,
  openCreateGroupChallenge,
  openCreateSoloChallenge,
} from '@/lib/navigation/create-entry';
import { useGroupStore } from '@/store/group-store';

import { backOrReplace } from '@/lib/navigation/safe-back';
export default function CreateScreen() {
  const router = useRouter();
  const groups = useGroupStore(state => state.groups);
  const [workingAction, setWorkingAction] = useState<string | null>(null);

  const checkCooldown = useGroupCooldownCheck({
    onCooldown: notice => {
      showToast.info(notice.title, notice.message);
    },
  });

  const firstActiveGroupId = useMemo(
    () => groups.find(group => group.status === 'active')?.id ?? null,
    [groups]
  );

  const runAction = useCallback(
    async (key: string, action: () => void | Promise<void>) => {
      if (workingAction) return;
      setWorkingAction(key);
      try {
        await action();
      } finally {
        setWorkingAction(null);
      }
    },
    [workingAction]
  );

  const createPromise = useCallback(() => {
    openCreateSoloChallenge({
      router,
      source: 'create_tab',
    });
  }, [router]);

  const startWithGroup = useCallback(async () => {
    if (firstActiveGroupId) {
      openCreateGroupChallenge({
        router,
        source: 'create_tab',
        groupId: firstActiveGroupId,
      });
      return;
    }

    await openCreateGroup({
      router,
      source: 'create_tab',
      checkGroupCooldown: checkCooldown,
    });
  }, [checkCooldown, firstActiveGroupId, router]);

  return (
    <CreateTabBridgeState
      onCreatePromise={() => void runAction('promise', createPromise)}
      onJoinSoloChallenge={() =>
        void runAction('solo-run', () => router.push('/solo-challenges'))
      }
      onStartWithGroup={() => void runAction('group', startWithGroup)}
      onLearn={() =>
        void runAction('learn', () =>
          router.push({
            pathname: '/support',
            params: { source: 'create_tab' },
          })
        )
      }
      onBack={() => backOrReplace(router, '/(tabs)')}
    />
  );
}
