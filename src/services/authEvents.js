import { create } from "zustand";
import { formatDateTime } from "../shared/lib/format";
import { uid } from "../shared/lib/utils";

export const useAuthEventStore = create((set) => ({
  events: [],
  latest: null,
  pushEvent: (event) =>
    set((state) => {
      const next = { ...event, id: event.id || uid("auth_evt"), occurredAt: event.occurredAt || formatDateTime() };
      return {
        events: [...state.events, next].slice(-50),
        latest: next,
      };
    }),
  clearLatest: () => set({ latest: null }),
}));

export function logAuthEvent(event) {
  const payload = { ...event, occurredAt: event?.occurredAt || formatDateTime() };
  console.warn("[security]", payload);
  useAuthEventStore.getState().pushEvent(payload);
}
