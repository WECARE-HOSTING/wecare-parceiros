#!/usr/bin/env python3
"""TESTE 2 — Cadastro de Lead (/cadastro) — reteste visual + API."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import httpx
from playwright.sync_api import sync_playwright

BASE_URL = "https://cadastro.wecarehosting.com.br"
API_CANDIDATES = [
    f"{BASE_URL}/api/v1",
    "https://parceiros.wecarehosting.com.br/api/v1",
]
ADMIN_EMAIL = "felipe@wecarehosting.com.br"
ADMIN_PASSWORD = "Wecare@2026"

LEAD_NAME = "Lead Reteste Visual"
LEAD_EMAIL = "lead.reteste@teste.com"
LEAD_PHONE = "11966665555"

SCREENSHOT_DIR = Path(__file__).resolve().parent / "screenshots" / "teste_2"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def log(msg: str) -> None:
    print(msg, flush=True)


def resolve_api_base() -> str:
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for candidate in API_CANDIDATES:
            try:
                r = client.post(
                    f"{candidate}/auth/login",
                    data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                )
                if r.status_code == 200 and r.json().get("access_token"):
                    log(f"API base: {candidate}")
                    return candidate
            except Exception as exc:
                log(f"API candidata indisponível ({candidate}): {exc}")
    raise RuntimeError("Nenhuma API base respondeu ao login de admin.")


def admin_login(client: httpx.Client, api_base: str) -> str:
    r = client.post(
        f"{api_base}/auth/login",
        data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    r.raise_for_status()
    token = r.json()["access_token"]
    return token


def get_non_admin_utm(client: httpx.Client, api_base: str, token: str) -> tuple[str, str]:
    r = client.get(
        f"{api_base}/partners",
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    partners = r.json()
    for p in partners:
        if not p.get("is_admin"):
            utm = p.get("utm_code")
            if utm:
                return utm, p.get("full_name", "?")
    raise RuntimeError("Nenhum parceiro não-admin com utm_code encontrado.")


def find_lead_in_kanban(kanban: dict, name: str, email: str) -> dict | None:
    for column, cards in kanban.items():
        for card in cards:
            if card.get("full_name") == name and card.get("email") == email:
                return {"column": column, **card}
    return None


def main() -> int:
    results: list[tuple[str, bool, str]] = []
    lead_id: int | None = None
    utm_code = ""
    api_base = ""

    try:
        api_base = resolve_api_base()

        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            token = admin_login(client, api_base)
            utm_code, partner_name = get_non_admin_utm(client, api_base, token)
            log(f"utm_code: {utm_code} (parceiro: {partner_name})")
            results.append(("1. Login admin + utm_code", True, f"utm_code={utm_code}"))

        cadastro_url = f"{BASE_URL}/cadastro?utm_campaign={utm_code}"

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.goto(cadastro_url, wait_until="networkidle", timeout=60_000)

            page.screenshot(path=str(SCREENSHOT_DIR / "01_pagina_inicial.png"), full_page=True)
            results.append(("3. Screenshot inicial", True, str(SCREENSHOT_DIR / "01_pagina_inicial.png")))

            checks: list[tuple[str, bool, str]] = []

            header = page.locator("header")
            header_class = header.get_attribute("class") or ""
            header_inner = page.locator("header div").first
            inner_class = header_inner.get_attribute("class") or ""
            header_centered = "justify-center" in inner_class or "justify-center" in header_class
            header_text = page.locator("header").inner_text()
            checks.append((
                "Header centralizado",
                header_centered and "WeCare Hosting" in header_text,
                f"class inner={inner_class!r}, texto={header_text!r}",
            ))

            page_text = page.locator("body").inner_text()
            has_cpf = "CPF" in page_text.upper()
            checks.append(("Formulário sem campo CPF", not has_cpf, f"CPF presente={has_cpf}"))

            checks.append(("Campo Nome", page.get_by_text("Nome completo").count() > 0, ""))
            checks.append(("Campo Email", page.get_by_text("E-mail", exact=True).count() > 0, ""))
            checks.append(("Campo Telefone", page.get_by_text("Telefone / WhatsApp").count() > 0, ""))
            checks.append(("Checkbox LGPD", page.locator('input[type="checkbox"]').count() > 0, ""))

            all_ui_ok = all(c[1] for c in checks)
            for name, ok, detail in checks:
                results.append((f"4. {name}", ok, detail))
            results.append(("4. Verificação de elementos", all_ui_ok, ""))

            page.get_by_placeholder("Como consta no documento").fill(LEAD_NAME)
            page.get_by_placeholder("seu@email.com").fill(LEAD_EMAIL)
            page.get_by_placeholder("(11) 99999-9999").fill(LEAD_PHONE)
            page.locator('input[type="checkbox"]').check()
            page.get_by_role("button", name="Enviar indicação").click()

            page.wait_for_timeout(3000)

            success_visible = page.get_by_text("Indicação recebida!").count() > 0
            error_visible = page.get_by_text("Não foi possível enviar").count() > 0

            page.screenshot(path=str(SCREENSHOT_DIR / "02_resultado_submit.png"), full_page=True)
            results.append(("7. Screenshot resultado", True, str(SCREENSHOT_DIR / "02_resultado_submit.png")))

            if success_visible and not error_visible:
                results.append(("6. Tela de sucesso (sem 500)", True, "Indicação recebida!"))
            else:
                err_text = ""
                if error_visible:
                    err_text = page.locator("main").inner_text()[:300]
                results.append(("6. Tela de sucesso (sem 500)", False, err_text or "Tela de sucesso não exibida"))

            browser.close()

        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            token = admin_login(client, api_base)
            r = client.get(
                f"{api_base}/admin/kanban",
                headers={"Authorization": f"Bearer {token}"},
            )
            if r.status_code != 200:
                results.append(("8. Lead no kanban (API)", False, f"HTTP {r.status_code}: {r.text[:200]}"))
            else:
                kanban = r.json()
                lead = find_lead_in_kanban(kanban, LEAD_NAME, LEAD_EMAIL)
                if lead:
                    lead_id = lead.get("id")
                    results.append((
                        "8. Lead no kanban (API)",
                        True,
                        f"id={lead_id}, coluna={lead.get('column')}, email={lead.get('email')}",
                    ))
                else:
                    results.append(("8. Lead no kanban (API)", False, "Lead não encontrado na listagem"))

    except Exception as exc:
        results.append(("ERRO INESPERADO", False, str(exc)))

    log("\n" + "=" * 60)
    log("TESTE 2 — Cadastro de Lead")
    log("=" * 60)
    failed = False
    for step, ok, detail in results:
        icon = "✅" if ok else "❌"
        line = f"{icon} {step}"
        if detail:
            line += f" — {detail}"
        log(line)
        if not ok:
            failed = True

    log("=" * 60)
    if failed:
        log("❌ FALHOU")
        return 1

    log("✅ PASSOU")

    if lead_id:
        log(f"\nDados de teste criados — limpeza manual recomendada:")
        log(f"  Lead ID: {lead_id}")
        log(f"  Nome: {LEAD_NAME}")
        log(f"  Email: {LEAD_EMAIL}")
        log(f"  Telefone: {LEAD_PHONE}")
        log(f"  utm_code: {utm_code}")
        log("  (Sem acesso ao banco de produção — DELETE manual via admin ou SQL)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
