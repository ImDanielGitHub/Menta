import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAndVerifyMainLocalSession } from '../main-recovery-quarantine';

it('removes owned credentials and orphan PKCE slots while preserving recovery and unrelated keys', async () => {
  await AsyncStorage.clear();
  const key = 'synthetic-main-auth';
  const owned = [
    key,
    `${key}-user`,
    `${key}-code-verifier`,
    `${key}-flows-code-verifier`,
    `${key}-flow-synthetic-orphan-code-verifier`,
  ];
  await AsyncStorage.multiSet([
    ...owned.map(k => [k, 'synthetic-value'] as [string, string]),
    ['isolated-recovery', 'keep'],
    [`${key}-unrelated`, 'keep'],
  ]);
  await clearAndVerifyMainLocalSession(key);
  expect(await AsyncStorage.multiGet(owned)).toEqual(owned.map(k => [k, null]));
  expect(await AsyncStorage.getItem('isolated-recovery')).toBe('keep');
  expect(await AsyncStorage.getItem(`${key}-unrelated`)).toBe('keep');
});
