type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export function showToast(message: string) {
  listeners.forEach((listener) => listener(message));
}

export function subscribeToast(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
