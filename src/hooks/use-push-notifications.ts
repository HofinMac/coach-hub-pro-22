import { useCallback, useEffect, useState } from "react";
import {
  disablePush, enablePush, getCurrentSubscription, getPushSupport, sendTestNotification,
  syncPushSubscription, type PushSupport,
} from "@/lib/push";
import { useSession } from "@/hooks/use-current-profile";

/** Push state of this device for the signed-in user, plus actions for the Settings UI. */
export function usePushNotifications() {
  const session = useSession();
  const userId = session?.user.id;
  const [support] = useState<PushSupport>(() => getPushSupport());
  const [permission, setPermission] = useState<NotificationPermission | "unknown">(() =>
    "Notification" in window ? Notification.permission : "unknown");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (support !== "supported") return;
    setPermission(Notification.permission);
    setSubscribed(!!(await getCurrentSubscription()) && Notification.permission === "granted");
  }, [support]);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  return {
    support,
    permission,
    subscribed,
    busy,
    enable: () => run(() => enablePush(userId!)),
    disable: () => run(() => disablePush(userId!)),
    sendTest: () => run(sendTestNotification),
  };
}

/** Mount once inside the signed-in app: keeps this device's subscription registered. */
export function usePushSync(userId: string | undefined) {
  useEffect(() => {
    if (!userId || !("serviceWorker" in navigator)) return;
    syncPushSubscription(userId);
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "push-subscription-changed") syncPushSubscription(userId);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [userId]);
}
