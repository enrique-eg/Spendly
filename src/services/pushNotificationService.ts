import supabase from './supabaseClient'

export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export async function registerPushSubscription(userId: string): Promise<void> {
  if (!isPushSupported()) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!vapidPublicKey) {
    console.warn('VITE_VAPID_PUBLIC_KEY is not set — push notifications disabled')
    return
  }

  const existingSub = await registration.pushManager.getSubscription()
  const subscription =
    existingSub ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }))

  const serialized = subscription.toJSON() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: serialized.endpoint,
      p256dh: serialized.keys.p256dh,
      auth: serialized.keys.auth,
    },
    { onConflict: 'endpoint' },
  )
}
