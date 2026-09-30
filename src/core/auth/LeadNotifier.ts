/**
 * ZEROPDF OWNER NOTIFICATION ENGINE
 * 
 * Automatically sends instant email alerts to sarthaksmn@gmail.com for:
 * 1. User Sign-Ins (Free Tier registration)
 * 2. Purchase / Upgrade Intents (Pro $4.99 & Lifetime $49)
 * 3. Completed License Payments
 * 4. User Feedback & Bug Reports
 * 
 * Anonymous free users who do not sign in generate 0 network requests (100% private).
 */

const OWNER_EMAIL = 'sarthaksmn@gmail.com';
const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${OWNER_EMAIL}`;

export interface NotificationPayload {
  event: 'USER_SIGN_IN' | 'PURCHASE_INTENT' | 'PAYMENT_COMPLETED' | 'FEEDBACK_SUBMITTED';
  email: string;
  name?: string;
  tier?: string;
  planName?: string;
  amount?: string;
  message?: string;
  details?: string;
}

export class LeadNotifier {
  /**
   * Dispatches instant email notification to the owner
   */
  public static async sendAlert(payload: NotificationPayload): Promise<void> {
    try {
      const subject = payload.event === 'PAYMENT_COMPLETED'
        ? `💰 [PAYMENT SUCCESS] ${payload.planName || payload.tier} from ${payload.email}`
        : payload.event === 'PURCHASE_INTENT'
        ? `👑 [PURCHASE INTENT] ${payload.planName || payload.tier} by ${payload.email}`
        : payload.event === 'FEEDBACK_SUBMITTED'
        ? `💬 [FEEDBACK] ${payload.name || 'User'} sent feedback`
        : `🟢 [NEW SIGN-IN] ${payload.name || 'User'} (${payload.email})`;

      console.log(`[LeadNotifier] 📡 Dispatching alert to ${OWNER_EMAIL}:`, subject);

      // Save locally to localStorage for redundancy
      try {
        const history = JSON.parse(localStorage.getItem('zeropdf_owner_notifications') || '[]');
        history.unshift({ ...payload, timestamp: new Date().toISOString() });
        localStorage.setItem('zeropdf_owner_notifications', JSON.stringify(history.slice(0, 50)));
      } catch (e) {
        console.warn('Could not save notification history locally:', e);
      }

      // Send live email alert via FormSubmit AJAX
      await fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          _subject: `⚡ ZEROPDF // ${subject}`,
          _template: 'table',
          _captcha: 'false',
          'Event Type': payload.event,
          'User Email': payload.email,
          'User Name': payload.name || 'Anonymous',
          'Plan / Tier': payload.tier || 'Free',
          'Amount': payload.amount || 'N/A',
          'Message / Note': payload.message || payload.details || 'N/A',
          'Timestamp': new Date().toLocaleString(),
        }),
      });

    } catch (err) {
      console.warn('[LeadNotifier] Alert dispatch error (handled gracefully):', err);
    }
  }

  public static notifySignIn(email: string, name: string, tier: string = 'free') {
    return this.sendAlert({
      event: 'USER_SIGN_IN',
      email,
      name,
      tier,
      details: 'User explicitly created an account / signed in.',
    });
  }

  public static notifyPurchaseIntent(email: string, tier: string, planName: string, amount: string) {
    return this.sendAlert({
      event: 'PURCHASE_INTENT',
      email,
      tier,
      planName,
      amount,
      details: 'User opened secure checkout to purchase a license.',
    });
  }

  public static notifyPaymentCompleted(email: string, tier: string, planName: string, amount: string) {
    return this.sendAlert({
      event: 'PAYMENT_COMPLETED',
      email,
      tier,
      planName,
      amount,
      details: 'License successfully activated in-app.',
    });
  }

  public static notifyFeedback(email: string, type: string, message: string) {
    return this.sendAlert({
      event: 'FEEDBACK_SUBMITTED',
      email: email || 'anonymous@user.com',
      name: type.toUpperCase(),
      message,
    });
  }
}
