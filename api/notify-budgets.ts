import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import webPush from 'web-push'
import nodemailer from 'nodemailer'

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER!,
    pass: process.env.BREVO_SMTP_KEY!,
  },
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Current month range
  const now = new Date()
  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).toISOString().split('T')[0]
  const thisMonthPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  // Fetch all active monthly budgets
  const { data: budgets, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('period', 'monthly')

  if (error) {
    console.error('Failed to fetch budgets:', error)
    return res.status(500).json({ error: 'Failed to fetch budgets' })
  }

  if (!budgets || budgets.length === 0) {
    return res.status(200).json({ processed: 0 })
  }

  const results = await Promise.allSettled(
    budgets.map(async (budget: Record<string, unknown>) => {
      const userId = budget.user_id as string
      const limitAmount = Number(budget.limit_amount)
      if (!limitAmount) return

      // Skip if already notified this calendar month
      const lastNotified = budget.last_notified_at as string | null
      if (lastNotified && lastNotified.startsWith(thisMonthPrefix)) return

      // Calculate spent amount for this month
      let spent = 0

      if (budget.account_id) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('amount')
          .eq('account_id', budget.account_id)
          .eq('type', 'expense')
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd)
        spent = (txs ?? []).reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0)
      } else if (budget.category_id) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('category_id', budget.category_id)
          .eq('type', 'expense')
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd)
        spent = (txs ?? []).reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0)
      }

      if (spent < limitAmount) return

      // Budget exceeded — get user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.admin.getUserById(userId)
      if (userError || !user) return

      // Determine budget label
      let budgetLabel = 'Your budget'
      if (budget.category_id) {
        const { data: cat } = await supabase
          .from('categories')
          .select('name')
          .eq('id', budget.category_id)
          .maybeSingle()
        if (cat) budgetLabel = `${(cat as { name: string }).name} category budget`
      } else if (budget.account_id) {
        const { data: acc } = await supabase
          .from('accounts')
          .select('name')
          .eq('id', budget.account_id)
          .maybeSingle()
        if (acc) budgetLabel = `${(acc as { name: string }).name} account budget`
      }

      const pct = Math.round((spent / limitAmount) * 100)
      const pushTitle = `Budget limit exceeded`
      const pushBody = `${budgetLabel}: ${budget.currency as string} ${spent.toFixed(2)} / ${limitAmount.toFixed(2)} (${pct}%)`

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
                JSON.stringify({ title: pushTitle, body: pushBody, url: '/budgets' }),
              )
            } catch (err: unknown) {
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
        await transporter.sendMail({
          from: `"Spendly" <${process.env.BREVO_SMTP_USER!}>`,
          to: user.email,
          subject: `Budget limit exceeded: ${budgetLabel}`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <tr>
          <td style="background:#dc2626;padding:24px 32px">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700">⚠️ Spendly</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:18px">Budget limit exceeded</h2>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6">
              Your <strong style="color:#f1f5f9">${budgetLabel}</strong> has gone over its monthly limit:
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;padding:16px 20px;width:100%;box-sizing:border-box">
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding-bottom:8px">Spent</td>
                <td align="right" style="color:#f87171;font-size:18px;font-weight:700">${budget.currency as string} ${spent.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding-bottom:8px">Limit</td>
                <td align="right" style="color:#f1f5f9;font-size:14px">${budget.currency as string} ${limitAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color:#94a3b8;font-size:13px">Over by</td>
                <td align="right" style="color:#f87171;font-size:14px;font-weight:600">${budget.currency as string} ${(spent - limitAmount).toFixed(2)} (${pct}%)</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 32px 32px">
            <a href="${appUrl}/budgets" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
              View budgets
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #334155">
            <p style="margin:0;color:#475569;font-size:12px;text-align:center">You're receiving this because you have an active budget in Spendly.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        })
      }

      // Mark notified so we don't spam again this month
      await supabase
        .from('budgets')
        .update({ last_notified_at: now.toISOString() })
        .eq('id', budget.id as string)
    }),
  )

  const settled = results.filter((r) => r.status === 'fulfilled').length
  return res.status(200).json({ processed: settled })
}
