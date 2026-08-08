import { redirect } from "next/navigation";

// A raiz do portal é porta de entrada pública: quem digita o domínio é
// parceiro novo, não administrador. Mandar para /admin/crm jogava um visitante
// numa rota de administração (que só o devolve para o login).
export default function Home() {
  redirect("/cadastro-parceiro");
}
