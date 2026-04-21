import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import webPush from 'web-push'
import { Resend } from 'resend'

// ---------------------------------------------------------------------------
// Clients — initialised once per cold start
// ---------------------------------------------------------------------------

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

const resend = new Resend(process.env.RESEND_API_KEY)

// Service-role key bypasses RLS so we can read all users' data
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel automatically sends Authorization: Bearer <CRON_SECRET> for cron
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Day number of tomorrow (1-31)
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowDay = tomorrow.getUTCDate()

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('billing_day', tomorrowDay)
    .eq('is_active', true)

  if (error) {
    console.error('Failed to fetch subscriptions:', error)
    return res.status(500).json({ error: 'Failed to fetch subscriptions' })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({ processed: 0 })
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (sub: Record<string, unknown>) => {
      const userId = sub.user_id as string

      // Get user email via Supabase admin API
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.admin.getUserById(userId)

      if (userError || !user) return

      const pushTitle = `${sub.name as string} renews tomorrow`
      const pushBody = `${sub.currency as string} ${sub.amount as number} will be charged on day ${sub.billing_day as number}`

      // -----------------------------------------------------------------------
      // Push notifications
      // -----------------------------------------------------------------------
      const { data: pushSubs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId)

      if (pushSubs && pushSubs.length > 0) {
        await Promise.allSettled(
          pushSubs.map(async (ps: { endpoint: string; p256dh: string; auth: string }) => {
            try {
              await webPush.sendNotification(
                { endpoint: ps.endpoint, keys: { p256dh: ps.p256dh, auth: ps.auth } },
                JSON.stringify({
                  title: pushTitle,
                  body: pushBody,
                  url: '/subscriptions',
                }),
              )
            } catch (err: unknown) {
              // Remove expired / revoked subscriptions (HTTP 410 Gone)
              const statusCode = (err as { statusCode?: number })?.statusCode
              if (statusCode === 410 || statusCode === 404) {
                await supabase.from('push_subscriptions').delete().eq('endpoint', ps.endpoint)
              }
            }
          }),
        )
      }

      // -----------------------------------------------------------------------
      // Email
      // -----------------------------------------------------------------------
      if (user.email) {
        const appUrl = process.env.APP_URL ?? 'https://your-spendly-app.vercel.app'
        await resend.emails.send({
          from: 'Spendly <notifications@resend.dev>',
          to: user.email,
          subject: `Reminder: ${sub.name as string} renews tomorrow`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <tr>
          <td style="background:#2563eb;padding:24px 32px">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700">💸 Spendly</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:18px">Subscription reminder</h2>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6">
              Your subscription <strong style="color:#f1f5f9">${sub.name as string}</strong> will renew tomorrow:
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;padding:16px 20px;width:100%;box-sizing:border-box">
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding-bottom:8px">Amount</td>
                <td align="right" style="color:#60a5fa;font-size:18px;font-weight:700">${sub.currency as string} ${sub.amount as number}</td>
              </tr>
              <tr>
                <td style="color:#94a3b8;font-size:13px">Billing day</td>
                <td align="right" style="color:#f1f5f9;font-size:14px">Day ${sub.billing_day as number} of each month</td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#64748b;font-size:13px">Make sure you have enough balance in your account.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 32px 32px">
            <a href="${appUrl}/subscriptions" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
              View subscriptions
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #334155">
            <p style="margin:0;color:#475569;font-size:12px;text-align:center">You're receiving this because you have an active subscription in Spendly.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        })
      }
    }),
  )

  const settled = results.filter((r) => r.status === 'fulfilled').length
  return res.status(200).json({ processed: settled })
}
