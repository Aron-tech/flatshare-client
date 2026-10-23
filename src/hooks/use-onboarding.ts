import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "onboarding_done";

type OnboardingStatus = "loading" | "open" | "done";

let status: OnboardingStatus = "loading";
let loadStarted = false;
const listeners = new Set<() => void>();

function setStatus(next: OnboardingStatus) {
  status = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function load() {
  if (loadStarted) return;
  loadStarted = true;
  AsyncStorage.getItem(STORAGE_KEY)
    .then((done) => setStatus(done ? "done" : "open"))
    .catch(() => setStatus("done"));
}

export function finishOnboarding() {
  setStatus("done");
  AsyncStorage.setItem(STORAGE_KEY, "1").catch(() => {});
}

/** Reopens the tour from Settings. */
export function replayOnboarding() {
  setStatus("open");
}

/** Shared state of the first-run tour; the notification prompt waits until it is `done`. */
export function useOnboarding() {
  useEffect(load, []);
  return useSyncExternalStore(subscribe, () => status);
}
