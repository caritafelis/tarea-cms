import { useSyncExternalStore } from 'react';

export type ApiEnvironment = 'live' | 'test';

const STORAGE_KEY = 'cms.api-environment';
const listeners = new Set<() => void>();

function read(): ApiEnvironment {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'test' ? 'test' : 'live';
  } catch {
    return 'live';
  }
}

export function setApiEnvironment(env: ApiEnvironment) {
  try {
    localStorage.setItem(STORAGE_KEY, env);
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shared between the API and Webhooks tabs so both always show the same environment. */
export function useApiEnvironment() {
  const env = useSyncExternalStore(subscribe, read, () => 'live' as ApiEnvironment);
  return [env, setApiEnvironment] as const;
}
