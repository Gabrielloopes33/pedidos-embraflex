// Email service for sending notifications
// Supports multiple SMTP providers (SendGrid, AWS SES, custom SMTP)

import nodemailer from 'nodemailer';
import { Quote } from '../types/quote';

export interface EmailConfig {
  enabled: boolean;
  from: string;
  productionEmails: string[];
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  service?: 'sendgrid' | 'ses' | 'gmail' | 'custom';
}

export const EMAIL_CONFIG: EmailConfig = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  from: process.env.FROM_EMAIL || 'noreply@embraflex.com',
  productionEmails: process.env.PRODUCTION_EMAILS?.split(',').map(e => e.trim()) || [],
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  service: (process.env.EMAIL_SERVICE as EmailConfig['service']) || 'custom',
};

// Create transporter based on config
function createTransporter() {
  if (!EMAIL_CONFIG.enabled) {
    console.log('⚠️ Email service is disabled');
    return null;
  }

  // SendGrid
  if (EMAIL_CONFIG.service === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: EMAIL_CONFIG.smtpPassword,
      },
    });
  }

  // AWS SES
  if (EMAIL_CONFIG.service === 'ses') {
    return nodemailer.createTransport({
      host: EMAIL_CONFIG.smtpHost || 'email-smtp.us-east-1.amazonaws.com',
      port: EMAIL_CONFIG.smtpPort,
      auth: {
        user: EMAIL_CONFIG.smtpUser,
        pass: EMAIL_CONFIG.smtpPassword,
      },
    });
  }

  // Gmail (for development)
  if (EMAIL_CONFIG.service === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_CONFIG.smtpUser,
        pass: EMAIL_CONFIG.smtpPassword,
      },
    });
  }

  // Custom SMTP
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.smtpHost,
    port: EMAIL_CONFIG.smtpPort,
    secure: EMAIL_CONFIG.smtpPort === 465,
    auth: {
      user: EMAIL_CONFIG.smtpUser,
      pass: EMAIL_CONFIG.smtpPassword,
    },
  });
}

// Format currency for display
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Format date for display
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

// Send quote approved notification to production team
export async function sendQuoteApprovedEmail(quote: Quote, appUrl: string): Promise<void> {
  if (!EMAIL_CONFIG.enabled) {
    console.log('📧 Email disabled - would send quote approved notification:', quote.quoteNumber);
    return;
  }

  if (EMAIL_CONFIG.productionEmails.length === 0) {
    console.warn('⚠️ No production emails configured');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.error('❌ Failed to create email transporter');
    return;
  }

  const productsHtml = quote.products
    .map(
      (p) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.name} (${p.sku})</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(p.subtotal)}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #2563eb; margin: 0;">Novo Pedido Assinado</h1>
      </div>

      <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1f2937; margin-top: 0;">Cotação ${quote.quoteNumber}</h2>

        <div style="margin: 20px 0;">
          <strong>Cliente:</strong> ${quote.customerName}<br>
          ${quote.customerEmail ? `<strong>Email:</strong> ${quote.customerEmail}<br>` : ''}
          ${quote.customerPhone ? `<strong>Telefone:</strong> ${quote.customerPhone}<br>` : ''}
          <strong>Assinado em:</strong> ${formatDate(quote.signedAt || '')}
        </div>

        <h3 style="color: #1f2937; margin-top: 30px;">Produtos</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Produto</th>
              <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qtd</th>
              <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtml}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold; background-color: #f9fafb;">
              <td colspan="2" style="padding: 12px 8px; border-top: 2px solid #e5e7eb;">Total</td>
              <td style="padding: 12px 8px; text-align: right; border-top: 2px solid #e5e7eb;">${formatCurrency(quote.totalPrice)}</td>
            </tr>
          </tfoot>
        </table>

        ${quote.notes ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>Observações:</strong><br>
          ${quote.notes}
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding: 20px; background-color: #e0f2fe; border-radius: 8px; text-align: center;">
          <p style="margin: 0 0 15px 0;">Acesse o sistema para converter em pedido:</p>
          <a href="${appUrl}/cotacoes" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver Cotação no Sistema</a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
          <p>Dados da assinatura:</p>
          <p style="margin: 5px 0;">IP: ${quote.signatureData?.ip || 'N/A'}</p>
          <p style="margin: 5px 0;">Timestamp: ${formatDate(quote.signedAt || '')}</p>
        </div>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Este é um email automático do sistema Embraflex</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Novo Pedido Assinado - Cotação ${quote.quoteNumber}

Cliente: ${quote.customerName}
${quote.customerEmail ? `Email: ${quote.customerEmail}` : ''}
${quote.customerPhone ? `Telefone: ${quote.customerPhone}` : ''}
Assinado em: ${formatDate(quote.signedAt || '')}

PRODUTOS:
${quote.products.map((p) => `- ${p.name} (${p.sku}) x${p.quantity} - ${formatCurrency(p.subtotal)}`).join('\n')}

TOTAL: ${formatCurrency(quote.totalPrice)}

${quote.notes ? `\nObservações:\n${quote.notes}` : ''}

Acesse o sistema para converter em pedido: ${appUrl}/cotacoes

Dados da assinatura:
IP: ${quote.signatureData?.ip || 'N/A'}
Timestamp: ${formatDate(quote.signedAt || '')}
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Embraflex Sistema" <${EMAIL_CONFIG.from}>`,
      to: EMAIL_CONFIG.productionEmails.join(', '),
      subject: `Novo Pedido Assinado - ${quote.quoteNumber}`,
      text: textContent,
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

// Send quote rejected notification to salesperson (optional)
export async function sendQuoteRejectedEmail(
  quote: Quote,
  vendedorEmail: string,
  appUrl: string
): Promise<void> {
  if (!EMAIL_CONFIG.enabled || !vendedorEmail) {
    console.log('📧 Email disabled or no vendedor email - skipping rejection notification');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.error('❌ Failed to create email transporter');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #dc2626; margin: 0;">Cotação Recusada</h1>
      </div>

      <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p>Olá ${quote.createdByName || 'Vendedor'},</p>

        <p>A cotação <strong>${quote.quoteNumber}</strong> para o cliente <strong>${quote.customerName}</strong> foi recusada.</p>

        ${quote.rejectionReason ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
          <strong>Motivo da recusa:</strong><br>
          ${quote.rejectionReason}
        </div>
        ` : ''}

        <p>Valor da cotação: <strong>${formatCurrency(quote.totalPrice)}</strong></p>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${appUrl}/cotacoes" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver Minhas Cotações</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Embraflex Sistema" <${EMAIL_CONFIG.from}>`,
      to: vendedorEmail,
      subject: `Cotação ${quote.quoteNumber} foi recusada`,
      html: htmlContent,
    });

    console.log('✅ Rejection email sent to vendedor');
  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
    // Don't throw - rejection notification is optional
  }
}
