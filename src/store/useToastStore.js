import { create } from 'zustand';

const TOAST_DURATION = 2200;

export const useToastStore = create((set, get) => ({
  toasts: [],
  show: (kind, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    set((state) => ({
      toasts: [...state.toasts, { id, kind, message }],
    }));

    setTimeout(() => {
      if (get().toasts.find((toast) => toast.id === id)) {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      }
    }, TOAST_DURATION);
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export const toast = {
  success: (message) => useToastStore.getState().show('success', message),
  error: (message) => useToastStore.getState().show('error', message),
  info: (message) => useToastStore.getState().show('info', message),
};
