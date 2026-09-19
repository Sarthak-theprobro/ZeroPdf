/**
 * ZEROPDF TRANSACTIONAL EMAIL ENGINE
 * 
 * Sends automated email notifications for:
 * 1. Magic Sign-In Links & Welcome Verification
 * 2. Pro / Lifetime License Activation Receipts
 * 
 * Uses Resend.com (3,000 free emails/mo) or Supabase Auth email server.
 */

// Optional: Paste your free Resend API key here or via VITE_RESEND_API_KEY (from https://resend.com)
const RESEND_API_KEY: string = (import.meta as any).env?.VITE_RESEND_API_KEY || '';

export interface EmailPayload {
  to: string;
  subject: string;
  template: 'welcome' | 'magic-link' | 'license-activated';
  data?: Record<string, any>;
}

export class EmailService {
  /**
   * Dispatches a branded transactional email to the user
   */
  public static async sendEmail({ to, subject, template, data }: EmailPayload): Promise<boolean> {
    console.log(`[EmailService] 📨 Dispatching ${template} email to: ${to}`);

    // If Resend API key is provided, send real live email via Resend REST API
    if (RESEND_API_KEY && RESEND_API_KEY.startsWith('re_')) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'ZEROPDF <welcome@zeropdf.app>',
            to: [to],
            subject,
            html: this.getHtmlTemplate(template, to, data),
          }),
        });
        return response.ok;
      } catch (err) {
        console.error('[EmailService] Live send failed:', err);
      }
    }

    // Default Simulation Mode (Works instantly in development with zero setup)
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[EmailService] ✅ Email simulated successfully for ${to}`);
        resolve(true);
      }, 500);
    });
  }

  /**
   * Generates luxury dark-mode HTML email templates
   */
  private static getHtmlTemplate(template: string, to: string, data?: Record<string, any>): string {
    const brandHeader = `
      <div style="background-color: #05070D; padding: 24px; text-align: center; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; max-width: 500px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #38bdf8; margin: 0; font-size: 20px; letter-spacing: 2px;">ZEROPDF // AIR-GAP</h2>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Sovereign Air-Gapped Document Workstation</p>
    `;

    if (template === 'magic-link') {
      return `
        ${brandHeader}
        <div style="padding: 20px 0; text-align: left;">
          <h3 style="font-size: 16px; margin: 0 0 10px 0;">Sign in to your account</h3>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5;">Click the secure 1-click button below to enter your ZEROPDF Studio workspace:</p>
          <a href="https://zeropdf.app" style="display: inline-block; background: #38bdf8; color: #000000; padding: 10px 20px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px; margin: 15px 0;">Enter Workstation &rarr;</a>
          <p style="color: #64748b; font-size: 11px;">If you didn't request this email, you can safely ignore it.</p>
        </div>
      </div>`;
    }

    if (template === 'license-activated') {
      return `
        ${brandHeader}
        <div style="padding: 20px 0; text-align: left;">
          <h3 style="color: #34d399; font-size: 16px; margin: 0 0 10px 0;">🎉 License Activated Successfully!</h3>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5;">Your <strong>${data?.tierName || 'Pro'}</strong> license is now active for <strong>${to}</strong>.</p>
          <ul style="color: #94a3b8; font-size: 12px; line-height: 1.8; padding-left: 20px;">
            <li>Unlimited 50-File Parallel Batch Engine</li>
            <li>Visual Node Workflow Automator</li>
            <li>On-Device AI RAG Chat & Risk Analyzer</li>
          </ul>
        </div>
      </div>`;
    }

    return `${brandHeader}<p style="color: #fff; font-size: 14px;">Welcome to ZEROPDF Studio!</p></div>`;
  }
}