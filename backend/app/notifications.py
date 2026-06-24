import logging
import os

import resend

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "WeCare Parceiros <parceiros@wecarehosting.com.br>")
BASE_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _send(to: str, subject: str, html: str) -> None:
    if not RESEND_API_KEY:
        logger.info("[email simulado] para=%s | assunto=%s", to, subject)
        return
    resend.api_key = RESEND_API_KEY
    try:
        resend.Emails.send({"from": FROM_EMAIL, "to": [to], "subject": subject, "html": html})
    except Exception as exc:
        logger.error("Falha ao enviar e-mail para %s: %s", to, exc)


def _base(title: str, body: str) -> str:
    return f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#222">
      <div style="background:#E55A4F;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">WeCare Hosting — Programa de Parceria</h1>
      </div>
      <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px">
        <h2 style="color:#E55A4F;margin-top:0">{title}</h2>
        {body}
        <hr style="border:none;border-top:1px solid #ddd;margin:24px 0">
        <p style="font-size:12px;color:#666">
          WeCare Hosting Serviços LTDA · CNPJ 30.870.784/0001-70<br>
          Rua Sardenha 21, Cotia — SP
        </p>
      </div>
    </div>
    """


def notify_partner_registered(partner_email: str, partner_name: str, temp_password: str) -> None:
    body = f"""
    <p>Olá, <strong>{partner_name}</strong>!</p>
    <p>Seu cadastro no <strong>Programa de Parceria WeCare</strong> foi recebido e está em análise.</p>
    <p>Em até <strong>7 dias úteis</strong> você será notificado sobre a ativação.</p>
    <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
    <p><strong>Seus dados de acesso ao Portal:</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0">
      <tr>
        <td style="padding:8px 12px;background:#f0f0f0;border-radius:4px 0 0 4px;font-size:13px;color:#555;white-space:nowrap">E-mail</td>
        <td style="padding:8px 12px;background:#f0f0f0;border-radius:0 4px 4px 0;font-size:13px">{partner_email}</td>
      </tr>
      <tr><td colspan="2" style="padding:4px"></td></tr>
      <tr>
        <td style="padding:8px 12px;background:#f0f0f0;border-radius:4px 0 0 4px;font-size:13px;color:#555;white-space:nowrap">Senha temporária</td>
        <td style="padding:8px 12px;background:#f0f0f0;border-radius:0 4px 4px 0;font-size:15px;font-weight:bold;letter-spacing:1px">{temp_password}</td>
      </tr>
    </table>
    <p style="font-size:13px;color:#888">
      Por segurança, você será obrigado a criar uma nova senha no primeiro acesso.
    </p>
    <p style="margin-top:20px">
      <a href="{BASE_URL}/login"
         style="background:#E55A4F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px">
        Acessar o Portal
      </a>
    </p>
    """
    _send(
        partner_email,
        "Cadastro recebido — WeCare Programa de Parceria",
        _base("Cadastro recebido!", body),
    )


def notify_partner_activated(partner_email: str, partner_name: str, utm_link: str) -> None:
    body = f"""
    <p>Olá, <strong>{partner_name}</strong>!</p>
    <p>Seu cadastro foi <strong>ativado</strong>. Você já pode começar a indicar proprietários.</p>
    <p style="background:#fdf0ef;padding:12px;border-radius:6px;word-break:break-all">
      <a href="{utm_link}" style="color:#E55A4F">{utm_link}</a>
    </p>
    <p><a href="{BASE_URL}/dashboard"
         style="background:#E55A4F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
      Acessar Portal
    </a></p>
    """
    _send(partner_email, "Cadastro ativado — WeCare Parceria", _base("Bem-vindo!", body))


def notify_new_lead(
    partner_email: str, partner_name: str, lead_name: str, lead_city: str | None
) -> None:
    body = f"""
    <p>Olá, <strong>{partner_name}</strong>!</p>
    <p>Nova indicação registrada: <strong>{lead_name}</strong>
    {f'em <strong>{lead_city}</strong>' if lead_city else ''}.</p>
    <p><a href="{BASE_URL}/leads"
         style="background:#E55A4F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
      Ver meus leads
    </a></p>
    """
    _send(partner_email, f"Nova indicação — {lead_name}", _base("Nova indicação!", body))


def notify_commission_generated(
    partner_email: str,
    partner_name: str,
    commission_amount: str,
    property_city: str,
    payment_due_date: str,
) -> None:
    body = f"""
    <p>Olá, <strong>{partner_name}</strong>!</p>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Imóvel</strong></td>
          <td style="padding:8px;border-bottom:1px solid #eee">{property_city}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Valor</strong></td>
          <td style="padding:8px;border-bottom:1px solid #eee;color:#E55A4F;font-size:18px">
            <strong>{commission_amount}</strong></td></tr>
      <tr><td style="padding:8px"><strong>Pagamento até</strong></td>
          <td style="padding:8px">{payment_due_date}</td></tr>
    </table>
    <p style="margin-top:16px">Emita a NFS-e e envie para
      <a href="mailto:financeiro@wecarehosting.com.br">financeiro@wecarehosting.com.br</a>.
    </p>
    """
    _send(partner_email, f"Comissão apurada: {commission_amount}", _base("Comissão apurada!", body))


def notify_commission_paid(
    partner_email: str, partner_name: str, commission_amount: str, property_city: str
) -> None:
    body = f"""
    <p>Olá, <strong>{partner_name}</strong>! O pagamento foi <strong>confirmado</strong>.</p>
    <p>Imóvel: {property_city} · Valor: <strong>{commission_amount}</strong></p>
    """
    _send(partner_email, f"Pagamento confirmado: {commission_amount}", _base("Pagamento realizado!", body))


def notify_password_reset(partner_email: str, partner_name: str, reset_link: str) -> None:
    body = f"""
    <p>Olá, <strong>{partner_name}</strong>!</p>
    <p>Recebemos uma solicitação de redefinição de senha para sua conta.</p>
    <p>Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>60 minutos</strong>.</p>
    <p style="margin:24px 0">
      <a href="{reset_link}"
         style="background:#E55A4F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
        Redefinir senha
      </a>
    </p>
    <p style="font-size:12px;color:#888">Se você não solicitou esta redefinição, ignore este e-mail.</p>
    """
    _send(partner_email, "Redefinição de senha — WeCare Parceria", _base("Redefinir senha", body))


def notify_lead_invalidated(
    partner_email: str, partner_name: str, lead_name: str, reason: str
) -> None:
    body = f"""
    <p>Olá, <strong>{partner_name}</strong>!</p>
    <p>O lead <strong>{lead_name}</strong> foi marcado como inelegível.</p>
    <p><strong>Motivo:</strong> {reason}</p>
    """
    _send(partner_email, f"Lead inelegível — {lead_name}", _base("Lead inelegível", body))
