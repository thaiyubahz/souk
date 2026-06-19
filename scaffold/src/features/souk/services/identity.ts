/**
 * Prototype identity (no login).
 *
 * The full Souk needs to know "who is this visitor?" for features like Saved,
 * My Listings, and chat — but the prototype has no login. So we give each
 * browser a stable random ID (a "name tag"), stored in localStorage. It stays
 * the same across refreshes on this device. When the Souk is merged into the
 * logged-in main app, this is the one piece we swap for the real user's ID.
 */
const DEVICE_ID_KEY = "souk_device_id";

export function getDeviceId(): string {
  if (typeof localStorage === "undefined") return "anon";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** A short, friendly display name derived from the device ID (e.g. "Guest-4F2A"). */
export function getDeviceName(): string {
  const id = getDeviceId();
  return `Guest-${id.slice(-4).toUpperCase()}`;
}
