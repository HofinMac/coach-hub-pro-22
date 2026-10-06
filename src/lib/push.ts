/**
 * Web push: subscribe this device and register it for the signed-in user.
 * Delivery happens server-side (supabase/functions/send-push); the service worker
 * handlers live in public/push-sw.js.
 */
import { from, rpc } from "@/lib/db";

/** Public half of the VAPID key pair; the private half is the VAPID_PRIVATE_KEY function secret. */
export const VAPID_PUBLIC_KEY =
  "BM9TQzsheHXVJm_VHlNqa6ojjaFUx_7eaotmkFm1uXkMqSNIQG-rT2UTPnuhFBNQCGG10dAJkPVTSjayGkoVt20";

export type PushSupport =
  | "supported"
  | "ios-needs-install" // iOS/iPadOS Safari: push works only from the home-screen app (iOS 16.4+)
  | "unsupported";

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function getPushSupport(): PushSupport {
  const hasApis = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (isIOS() && !isStandalone()) return "ios-needs-install";
  return hasApis ? "supported" : "unsupported";
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

// Per-user opt-in on this device, so sync never subscribes someone who did not ask for it.
const optInKey = (userId: string) => `coach-hub-push-opt-in:${userId}`;
const setOptIn = (userId: string, on: boolean) => {
  try {
    if (on) localStorage.setItem(optInKey(userId), "1");
    else localStorage.removeItem(optInKey(userId));
  } catch { /* storage unavailable */ }
};
const hasOptIn = (userId: string) => {
  try { return localStorage.getItem(optInKey(userId)) === "1"; } catch { return false; }
};

async function registration() {
  return navigator.serviceWorker.ready;
}

export async function getCurrentSubscription() {
  if (getPushSupport() !== "supported") return null;
  return (await registration()).pushManager.getSubscription();
}

async function saveSubscription(sub: PushSubscription) {
  const json = sub.toJSON();
  const { error } = await rpc("register_push_subscription", {
    _endpoint: sub.endpoint,
    _p256dh: json.keys?.p256dh ?? "",
    _auth: json.keys?.auth ?? "",
    _user_agent: navigator.userAgent,
  });
  if (error) throw error;
}

/** Asks for permission (must run from a user gesture) and registers this device. */
export async function enablePush(userId: string): Promise<NotificationPermission> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const reg = await registration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  await saveSubscription(sub);
  setOptIn(userId, true);
  return permission;
}

/** Stops push on this device: removes it from the account and from the browser. */
export async function disablePush(userId: string) {
  setOptIn(userId, false);
  const sub = await getCurrentSubscription();
  if (!sub) return;
  await from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

/**
 * Before sign-out: detach this device from the account so the next person to
 * sign in here does not get the previous user's notifications. Never throws.
 */
export async function detachPushBeforeSignOut() {
  try {
    const sub = await getCurrentSubscription();
    if (sub) await from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  } catch (err) {
    console.warn("Push detach failed", err);
  }
}

/**
 * Keeps the server copy in sync for a user who opted in on this device: re-registers
 * this device for the signed-in user, re-subscribing if the browser dropped or rotated it.
 */
export async function syncPushSubscription(userId: string) {
  try {
    if (getPushSupport() !== "supported" || Notification.permission !== "granted" || !hasOptIn(userId)) return;
    const reg = await registration();
    const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await saveSubscription(sub);
  } catch (err) {
    console.warn("Push sync failed", err);
  }
}

export async function sendTestNotification() {
  const { error } = await rpc("send_test_notification");
  if (error) throw error;
}
