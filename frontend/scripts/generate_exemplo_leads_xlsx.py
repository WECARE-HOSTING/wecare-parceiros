"""Gera frontend/public/exemplo-leads.xlsx. Executar uma vez."""

from pathlib import Path

import openpyxl

HEADERS = ["Nome", "Email", "Telefone", "Cidade", "Estado"]
ROWS = [
    ["João Silva", "joao.silva@email.com", "(11) 99999-1111", "São Paulo", "SP"],
    ["Maria Souza", "maria.souza@email.com", "(21) 98888-2222", "Rio de Janeiro", "RJ"],
    ["Pedro Costa", "", "( 41) 97777-3333", "Curitiba", "PR"],
    ["Ana Lima", "ana.lima@email.com", "", "Florianópolis", "SC"],
    ["Carlos Rocha", "carlos.rocha@email.com", "(51) 96666-4444", "Porto Alegre", "RS"],
]

OUTPUT = Path(__file__).resolve().parent.parent / "public" / "exemplo-leads.xlsx"


def main() -> None:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Leads"
    ws.append(HEADERS)
    for row in ROWS:
        ws.append(row)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUTPUT)
    print(f"Gerado: {OUTPUT}")


if __name__ == "__main__":
    main()
