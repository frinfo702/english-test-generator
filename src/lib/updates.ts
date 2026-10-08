/** The newest announcement. Bump `id` to make the hamster speak up again. */
export const LATEST_UPDATE = {
  id: "2026-10-08-introduce",
  path: "/updates/introduce",
  label: "English Test Practice is open",
};

const SEEN_KEY = "etp-update-seen";

// Storage can throw (private windows, blocked site data); then the bubble just
// shows every visit, which is the harmless side to fail on.
export function hasSeenLatestUpdate(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === LATEST_UPDATE.id;
  } catch {
    return false;
  }
}

export function markLatestUpdateSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, LATEST_UPDATE.id);
  } catch {
    // Nothing to keep; see hasSeenLatestUpdate.
  }
}
