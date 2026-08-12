/**
 * Abstraction EmailService — OTP et notifications
 * Implémentations : Nodemailer (dev) ou Resend (prod)
 * TOUS les codes OTP sont envoyés PAR E-MAIL (jamais SMS)
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailService {
  send(options: SendEmailOptions): Promise<void>;
}

/** Provider Nodemailer — développement local */
class NodemailerEmailService implements EmailService {
  async send(options: SendEmailOptions): Promise<void> {
    // Import dynamique pour éviter le chargement côté client
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "localhost",
      port: Number(process.env.SMTP_PORT ?? 1025),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "noreply@depannage-express.bj",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}

/** Provider Resend — production */
class ResendEmailService implements EmailService {
  async send(options: SendEmailOptions): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY manquant");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Dépannage Express <noreply@depannage-express.bj>",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }
  }
}

/** Provider console — développement sans SMTP (n'expose jamais le code en HTTP) */
class ConsoleEmailService implements EmailService {
  async send(options: SendEmailOptions): Promise<void> {
    console.info("[email:console]", {
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
  }
}

/** Factory — choisit le provider selon EMAIL_PROVIDER */
export function createEmailService(): EmailService {
  const provider = process.env.EMAIL_PROVIDER ?? "nodemailer";
  if (provider === "resend") return new ResendEmailService();
  if (provider === "console") return new ConsoleEmailService();
  return new NodemailerEmailService();
}

/** Envoie un code OTP par e-mail */
export async function sendOTPEmail(email: string, code: string): Promise<void> {
  const service = createEmailService();
  await service.send({
    to: email,
    subject: `${code} — Votre code Dépannage Express`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #1E73BE; font-size: 24px;">Dépannage Express</h1>
        <p style="color: #5a6778;">Votre code de vérification :</p>
        <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0E1116;">${code}</p>
        <p style="color: #9BA7B8; font-size: 14px;">Ce code expire dans 10 minutes. Ne le partagez avec personne.</p>
      </div>
    `,
    text: `Votre code Dépannage Express : ${code}. Expire dans 10 minutes.`,
  });
}
