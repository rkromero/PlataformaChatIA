function getResendKey(): string {
  return process.env[String('RESEND_API_KEY')] ?? '';
}

function getBaseUrl(): string {
  return process.env[String('NEXT_PUBLIC_APP_URL')] ?? 'http://localhost:3000';
}

function getFromEmail(): string {
  return process.env[String('EMAIL_FROM')] ?? 'ChatPlatform <noreply@chatplatform.com>';
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = getResendKey();
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set, skipping email to:', to);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Email send failed:', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const url = `${getBaseUrl()}/reset-password?token=${token}`;
  return sendEmail(email, 'Restablecer tu contraseña - ChatPlatform', `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Restablecer contraseña</h2>
      <p>Recibimos un pedido para restablecer tu contraseña.</p>
      <a href="${url}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Restablecer contraseña
      </a>
      <p style="color: #666; font-size: 14px;">Este link expira en 1 hora. Si no pediste esto, ignorá este email.</p>
    </div>
  `);
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const url = `${getBaseUrl()}/verify-email?token=${token}`;
  return sendEmail(email, 'Verificá tu email - ChatPlatform', `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Verificá tu email</h2>
      <p>Gracias por registrarte. Hacé clic en el botón para verificar tu email.</p>
      <a href="${url}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Verificar email
      </a>
      <p style="color: #666; font-size: 14px;">Este link expira en 24 horas.</p>
    </div>
  `);
}

export async function sendTeamInviteEmail(email: string, token: string, tenantName: string, role: string): Promise<boolean> {
  const url = `${getBaseUrl()}/invite?token=${token}`;
  return sendEmail(email, `Te invitaron a ${tenantName} - ChatPlatform`, `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Invitación al equipo</h2>
      <p>Te invitaron a unirte a <strong>${tenantName}</strong> como <strong>${role}</strong>.</p>
      <a href="${url}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Aceptar invitación
      </a>
      <p style="color: #666; font-size: 14px;">Este link expira en 7 días.</p>
    </div>
  `);
}

export async function sendUsageLimitEmail(email: string, tenantName: string, percent: number): Promise<boolean> {
  const isOver = percent >= 100;
  const subject = isOver
    ? `Límite de mensajes alcanzado - ${tenantName}`
    : `${percent}% del límite de mensajes - ${tenantName}`;

  return sendEmail(email, subject, `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: ${isOver ? '#ef4444' : '#f59e0b'};">${isOver ? 'Límite alcanzado' : 'Casi al límite'}</h2>
      <p>${isOver
        ? `Tu cuenta <strong>${tenantName}</strong> alcanzó el 100% del límite mensual de mensajes. El bot dejará de responder hasta el próximo mes.`
        : `Tu cuenta <strong>${tenantName}</strong> usó el ${percent}% del límite mensual de mensajes.`
      }</p>
      <a href="${getBaseUrl()}/dashboard/plan" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        ${isOver ? 'Upgrade tu plan' : 'Ver mi plan'}
      </a>
    </div>
  `);
}
