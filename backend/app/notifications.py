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


_NAVY  = "#0C2330"
_GOLD  = "#B79152"
_IVORY = "#F2EAD9"
_SAND  = "#EDE5D4"


def _base(title: str, body: str) -> str:
    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:{_NAVY};background:{_IVORY};border-radius:10px;overflow:hidden;border:1px solid {_SAND}">
      <!-- Header -->
      <div style="background:{_NAVY};padding:28px 32px;text-align:center">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:{_GOLD};font-weight:600">
          Programa de Parceria
        </p>
        <h1 style="color:{_IVORY};margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px">
          WeCare Hosting
        </h1>
      </div>
      <!-- Gold accent bar -->
      <div style="height:3px;background:linear-gradient(90deg,{_GOLD},{_NAVY})"></div>
      <!-- Body -->
      <div style="padding:32px">
        <h2 style="color:{_NAVY};margin:0 0 20px;font-size:18px;font-weight:700;border-bottom:2px solid {_GOLD};padding-bottom:10px;display:inline-block">
          {title}
        </h2>
        <div style="color:{_NAVY};line-height:1.7;font-size:15px">
          {body}
        </div>
        <hr style="border:none;border-top:1px solid {_SAND};margin:28px 0 20px">
        <p style="font-size:11px;color:#4A5F6D;margin:0;line-height:1.6">
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
        <td style="padding:8px 12px;background:#EDE5D4;border-radius:4px 0 0 4px;font-size:13px;color:#4A5F6D;white-space:nowrap">E-mail</td>
        <td style="padding:8px 12px;background:#EDE5D4;border-radius:0 4px 4px 0;font-size:13px">{partner_email}</td>
      </tr>
      <tr><td colspan="2" style="padding:4px"></td></tr>
      <tr>
        <td style="padding:8px 12px;background:#EDE5D4;border-radius:4px 0 0 4px;font-size:13px;color:#4A5F6D;white-space:nowrap">Senha temporária</td>
        <td style="padding:8px 12px;background:#EDE5D4;border-radius:0 4px 4px 0;font-size:15px;font-weight:bold;letter-spacing:1px;color:#0C2330">{temp_password}</td>
      </tr>
    </table>
    <p style="font-size:13px;color:#4A5F6D">
      Por segurança, você será obrigado a criar uma nova senha no primeiro acesso.
    </p>
    <p style="margin-top:20px">
      <a href="{BASE_URL}/login"
         style="background:#B79152;color:#0C2330;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.3px">
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
    <p style="background:#EDE5D4;padding:12px 16px;border-radius:6px;word-break:break-all;border-left:3px solid #B79152">
      <a href="{utm_link}" style="color:#0C2330;font-weight:600">{utm_link}</a>
    </p>
    <p><a href="{BASE_URL}/leads"
         style="background:#B79152;color:#0C2330;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700">
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
         style="background:#B79152;color:#0C2330;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700">
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
      <tr><td style="padding:8px;border-bottom:1px solid #EDE5D4"><strong>Imóvel</strong></td>
          <td style="padding:8px;border-bottom:1px solid #EDE5D4">{property_city}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #EDE5D4"><strong>Valor</strong></td>
          <td style="padding:8px;border-bottom:1px solid #EDE5D4;color:#B79152;font-size:18px">
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
         style="background:#B79152;color:#0C2330;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700">
        Redefinir senha
      </a>
    </p>
    <p style="font-size:12px;color:#4A5F6D">Se você não solicitou esta redefinição, ignore este e-mail.</p>
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
