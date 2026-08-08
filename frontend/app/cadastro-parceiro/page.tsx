"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowDown,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  FileText,
  Upload,
  X,
  Handshake,
  ShieldCheck,
  Eye,
  HeartHandshake,
} from "lucide-react";
import { registerPartner, uploadPartnerDocument, RegisterPartnerError } from "@/lib/api";
import { formatPhone } from "@/lib/utils";

const TERM_VERSION = "1.1";

const SEGMENTS = [
  "Assessoria e Consultoria Imobiliária",
  "Corretor de Imóveis",
  "Gestor Financeiro / Wealth Manager",
  "Empresa de Turnkey",
  "Arquiteto / Escritório de Arquitetura",
  "Construtor / Empresa de Reforma",
  "Contabilidade / BPO Financeiro",
  "Móveis Planejados / Design de Interiores",
  "Incorporadora / Construtora",
  "Advogado / Consultoria Patrimonial",
  "Síndico / Administradora de Condomínios",
  "Outro",
];

const DOC_TYPES = [
  { value: "rg_cpf", label: "RG ou CPF" },
  { value: "contrato_social", label: "Contrato Social" },
  { value: "comprovante_endereco", label: "Comprovante de Endereço" },
];

const STEPS = [
  { num: "01", title: "Você indica", desc: "Apresenta a WeCare ao proprietário. Só isso — a partir daqui, é com a gente." },
  { num: "02", title: "A WeCare opera", desc: "Avaliação, contrato, anúncio, precificação, hóspede, limpeza, manutenção e financeiro. Ponta a ponta." },
  { num: "03", title: "Você é remunerado e informado", desc: "Recebe pela indicação que vira cliente e acompanha cada passo do atendimento." },
];

const PROOFS = [
  { value: "Superhost", label: "há 10 anos" },
  { value: "Zero", label: "reclamações no Reclame Aqui" },
  { value: "< 1%", label: "de churn — quem entra, fica" },
];

const ADVANTAGES = [
  { icon: Handshake, title: "Você só indica", desc: "A WeCare cuida de tudo: avaliação do imóvel, contrato, anúncio, precificação, hóspede, limpeza, manutenção e financeiro." },
  { icon: ShieldCheck, title: "Indique sem medo", desc: "Quem você indica entra no Padrão WeCare: Superhost há 10 anos, zero reclamação no Reclame Aqui, churn abaixo de 1%." },
  { icon: Eye, title: "Você fica sabendo de tudo", desc: "Feedback de cada indicação — se foi atendido, se fechou, se está satisfeito. Você nunca é surpreendido." },
  { icon: HeartHandshake, title: "Sem perfil, sem constrangimento", desc: "Se o imóvel não tiver vocação, a WeCare declina com elegância — sem nunca te queimar com o seu cliente." },
];

// ── Conteúdo dos termos ───────────────────────────────────────────────────────

const TERMO_PARCERIA = `TERMO DE PARCERIA — PROGRAMA DE INDICAÇÃO WECARE HOSTING
Versão ${TERM_VERSION} · Vigência a partir de 01/04/2025

1. PARTES
1.1 WECARE HOSTING SERVIÇOS LTDA, inscrita no CNPJ 30.870.784/0001-70, com sede em Cotia — SP ("WeCare").
1.2 O Parceiro, pessoa física ou jurídica que aceita este Termo ao concluir o cadastro no Portal de Parceria ("Parceiro").

2. OBJETO
2.1 O presente Termo regula a participação do Parceiro no Programa de Indicação WeCare, pelo qual o Parceiro indica proprietários de imóveis interessados nos serviços de gestão de hospedagem de curta temporada da WeCare, recebendo comissão conforme cláusula 4.

3. OBRIGAÇÕES DO PARCEIRO
3.1 Realizar indicações de boa-fé, apresentando apenas proprietários genuinamente interessados nos serviços da WeCare.
3.2 Não realizar promessas ou declarações em nome da WeCare sem autorização prévia e expressa.
3.3 Não praticar qualquer forma de captação enganosa, spam ou comunicação massiva não solicitada.
3.4 Manter seus dados cadastrais atualizados no portal.
3.5 Emitir nota fiscal de serviços (NFS-e) em nome da WeCare para o recebimento de comissões, quando exigido pela legislação aplicável.

4. COMISSÃO
4.1 A cada indicação que resulte em contrato de gestão assinado, o Parceiro escolhe uma das duas formas de remuneração:
    (a) R$ 1.500,00 (mil e quinhentos reais), em pagamento único; ou
    (b) 10% (dez por cento) da taxa de administração cobrada pela WeCare sobre o imóvel indicado, durante os 12 (doze) primeiros meses de operação.
4.2 A escolha é feita por indicação, e não por parceria: o Parceiro pode optar por caminhos diferentes a cada nova indicação.
4.3 O pagamento da modalidade (a) ocorre em até 30 (trinta) dias da assinatura do contrato pelo proprietário indicado. Os pagamentos da modalidade (b) ocorrem mensalmente, em até 30 (trinta) dias do repasse de cada mês, condicionados à adimplência do proprietário.
4.4 A indicação é atribuída ao Parceiro quando registrada por seu link exclusivo no Portal ou quando por ele comunicada à WeCare antes do primeiro contato do proprietário com a empresa, observado o prazo de atribuição de 90 (noventa) dias.
4.5 Não haverá comissão em casos de cancelamento do contrato antes do início da operação, fraude comprovada ou estorno.

5. PROPRIEDADE INTELECTUAL E SIGILO
5.1 O acesso ao portal não transfere ao Parceiro qualquer direito sobre marcas, logotipos ou materiais da WeCare.
5.2 O Parceiro compromete-se a não divulgar informações confidenciais da WeCare obtidas por meio do portal.

6. VIGÊNCIA E RESCISÃO
6.1 Este Termo vigorará por prazo indeterminado, podendo ser rescindido por qualquer das partes mediante comunicação com 15 (quinze) dias de antecedência.
6.2 A WeCare pode suspender ou encerrar o acesso do Parceiro imediatamente em caso de violação das cláusulas deste Termo.

7. DISPOSIÇÕES GERAIS
7.1 Este Termo é regido pelas leis da República Federativa do Brasil.
7.2 Fica eleito o foro da Comarca de Cotia — SP para dirimir quaisquer controvérsias.
7.3 A aceitação eletrônica deste Termo, com registro de IP, data/hora e versão, constitui manifestação de vontade válida nos termos da MP 2.200-2/2001 e da Lei 14.063/2020.`;

const TERMO_LGPD = `POLÍTICA DE PRIVACIDADE E CONSENTIMENTO LGPD
Programa de Parceria WeCare Hosting — Versão ${TERM_VERSION}

1. CONTROLADOR DE DADOS
WECARE HOSTING SERVIÇOS LTDA, CNPJ 30.870.784/0001-70, Cotia — SP.
Contato do encarregado (DPO): contato@wecarehosting.com.br

2. DADOS COLETADOS
Coletamos os seguintes dados pessoais no momento do cadastro e durante a vigência da parceria:
• Nome completo, CPF/CNPJ, e-mail e telefone — para identificação, comunicação e emissão de pagamentos.
• Razão social e segmento de atuação — para personalização da parceria.
• Endereço IP e data/hora de aceite — para registro de consentimento eletrônico, conforme exigência legal.
• Documentos enviados (RG, CPF, Contrato Social) — para validação cadastral e cumprimento de obrigações legais.

3. FINALIDADES DO TRATAMENTO
Os dados são tratados para as seguintes finalidades:
• Execução do contrato de parceria e pagamento de comissões.
• Comunicação sobre leads, imóveis e oportunidades de parceria.
• Cumprimento de obrigações legais e regulatórias (ex.: emissão de pagamentos, retenção de IR).
• Segurança da conta e prevenção a fraudes.

4. BASE LEGAL (Art. 7º, LGPD)
• Execução de contrato (inciso V) — para operação do programa de parceria.
• Cumprimento de obrigação legal (inciso II) — para obrigações fiscais e contábeis.
• Consentimento (inciso I) — para comunicações de marketing e novidades do programa.

5. COMPARTILHAMENTO DE DADOS
Seus dados poderão ser compartilhados com:
• Prestadores de serviços tecnológicos (hospedagem, e-mail transacional) — estritamente para operação do portal.
• Autoridades públicas — quando exigido por lei ou ordem judicial.
Não vendemos, alugamos ou cedemos seus dados a terceiros para fins de marketing.

6. RETENÇÃO DE DADOS
Os dados serão mantidos pelo prazo da parceria e por, no mínimo, 5 (cinco) anos após o encerramento, para atendimento de obrigações legais e fiscais.

7. SEUS DIREITOS (Art. 18, LGPD)
Você tem direito a:
• Confirmar a existência de tratamento e acessar seus dados.
• Corrigir dados incompletos, inexatos ou desatualizados.
• Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.
• Revogar o consentimento a qualquer momento, sem prejuízo das finalidades legais.
• Solicitar a portabilidade dos dados a outro fornecedor.
Para exercer seus direitos, entre em contato: contato@wecarehosting.com.br

8. SEGURANÇA
Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda ou destruição, incluindo criptografia de dados em trânsito e restrição de acesso por função.

9. COOKIES E RASTREAMENTO
O portal utiliza cookies estritamente necessários para autenticação e segurança da sessão. Não utilizamos cookies de rastreamento ou publicidade comportamental.

10. ALTERAÇÕES DESTA POLÍTICA
Esta política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas por e-mail com antecedência mínima de 15 dias. A versão aceita no momento do cadastro fica registrada em nosso sistema.`;

// ── Componentes auxiliares ────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[15px] font-medium text-[#161513] font-[family-name:var(--font-inter)]">
      {children}
      {required && <span className="text-[#C0392B] ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-[14px] py-3 rounded-lg border border-[#C9BBA4] bg-white text-[15px] text-[#161513] placeholder:text-[#8A857C] focus:outline-none focus:ring-2 focus:ring-[#B79152] focus:ring-offset-1 transition font-[family-name:var(--font-inter)] ${className}`}
      {...props}
    />
  );
}

function SelectEl({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-[14px] py-3 rounded-lg border border-[#B79152] bg-white text-[15px] text-[#161513] focus:outline-none focus:ring-2 focus:ring-[#B79152] focus:ring-offset-1 transition font-[family-name:var(--font-inter)] ${className}`}
      {...props}
    />
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <Icon size={18} className="text-[#B79152] shrink-0" />
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#B79152] font-[family-name:var(--font-inter)]">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function FormDivider() {
  return <hr className="border-0 border-t border-[rgba(22,21,19,0.1)] my-2" />;
}

function PageFooter() {
  return (
    <footer className="bg-[#0C2330] px-6 py-8 text-center">
      <p className="text-sm text-[#C9BBA4] font-[family-name:var(--font-inter)]">
        wecare. — patrimônio em boas mãos
      </p>
      <p className="mt-3 text-xs text-[#C9BBA4]/70 font-[family-name:var(--font-inter)]">
        WeCare Hosting Serviços LTDA · CNPJ 30.870.784/0001-70 · Cotia — SP
        <br />
        Dúvidas?{" "}
        <a href="mailto:contato@wecarehosting.com.br" className="underline text-[#B79152] hover:text-[#C9A96B] transition">
          contato@wecarehosting.com.br
        </a>
      </p>
    </footer>
  );
}

function HeroHeader({ rightLink }: { rightLink?: { href: string; label: string } }) {
  function scrollToForm() {
    const target = document.getElementById("form-parceiro");
    if (target) {
      const y = target.getBoundingClientRect().top + window.pageYOffset - 24;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  return (
    <header className="bg-[#0C2330] text-[#F2EAD9] px-6">
      <div className="max-w-[1080px] mx-auto pt-7 flex items-center justify-between gap-4">
        <Image src="/logo.png" alt="WeCare Hosting" width={140} height={30} className="h-[30px] w-auto" priority />
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs tracking-[0.2em] uppercase text-[#C9BBA4] font-[family-name:var(--font-inter)]">
            Programa de Parceiros
          </span>
          {rightLink && (
            <Link
              href={rightLink.href}
              className="text-xs tracking-[0.14em] uppercase text-[#B79152] hover:text-[#C9A96B] transition font-[family-name:var(--font-inter)]"
            >
              {rightLink.label}
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto pt-16 pb-14 md:pt-[88px] md:pb-[72px]">
        <div className="flex items-center gap-3.5 mb-7">
          <span className="block w-12 h-px bg-[#B79152]" />
          <span className="text-xs tracking-[0.22em] uppercase text-[#B79152] font-[family-name:var(--font-inter)]">
            Para quem indica com a própria reputação
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-spectral)] font-medium text-[clamp(2.75rem,7vw,4.75rem)] leading-[1.05] mb-6 max-w-[15ch] text-[#F2EAD9]">
          Indique <em className="text-[#B79152] font-[family-name:var(--font-spectral)] italic">sem medo</em>.
        </h1>
        <p className="text-[19px] leading-relaxed text-[rgba(242,234,217,0.85)] max-w-[58ch] mb-4 font-[family-name:var(--font-inter)]">
          A WeCare é uma gestora boutique de aluguel por temporada. Opera o imóvel do proprietário de ponta a ponta —{" "}
          <em className="font-[family-name:var(--font-spectral)] italic text-[#C9BBA4]">como se fosse próprio</em>.
        </p>
        <p className="text-[19px] leading-relaxed text-[rgba(242,234,217,0.85)] max-w-[56ch] mb-4 font-[family-name:var(--font-inter)]">
          Você tem a relação. A gente tem o padrão. Indique um proprietário e a WeCare assume a operação inteira — enquanto você fica sabendo de cada passo.
        </p>
        <p className="text-[17px] leading-relaxed text-[rgba(242,234,217,0.7)] max-w-[56ch] mb-10 font-[family-name:var(--font-inter)]">
          Casa ou apartamento, de médio a alto padrão, na capital, no litoral ou no campo. Se o imóvel tiver vocação para temporada, a gente avalia.
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex items-center gap-2.5 bg-[#B79152] hover:bg-[#C9A96B] text-[#0C2330] font-semibold text-base px-7 py-3.5 rounded-lg transition duration-[220ms] ease-[cubic-bezier(.25,.46,.45,.94)] font-[family-name:var(--font-inter)]"
          >
            Quero indicar
            <ArrowDown size={18} />
          </button>
          <span className="text-sm text-[#C9BBA4] font-[family-name:var(--font-inter)]">Sem exclusividade. Sem meta.</span>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto border-t border-[rgba(183,145,82,0.4)] py-9 pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {STEPS.map((step) => (
          <div key={step.num} className="flex flex-col gap-2.5">
            <span className="font-[family-name:var(--font-spectral)] text-[15px] text-[#B79152]">{step.num}</span>
            <span className="font-[family-name:var(--font-spectral)] text-[21px] text-[#F2EAD9]">{step.title}</span>
            <span className="text-sm leading-[1.55] text-[rgba(242,234,217,0.65)] font-[family-name:var(--font-inter)]">{step.desc}</span>
          </div>
        ))}
      </div>
    </header>
  );
}

function ProofsStrip() {
  return (
    <section className="bg-white border-b border-[rgba(22,21,19,0.08)] px-6 py-7">
      <div className="max-w-[1080px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
        {PROOFS.map((p) => (
          <div key={p.value} className="flex flex-col gap-0.5 text-center">
            <span className="font-[family-name:var(--font-spectral)] text-[26px] font-medium text-[#0C2330]">{p.value}</span>
            <span className="text-[13px] tracking-[0.14em] uppercase text-[#6B675E] font-[family-name:var(--font-inter)]">{p.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdvantagesSection() {
  return (
    <section className="px-6 py-14 md:py-20">
      <div className="max-w-[1080px] mx-auto">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs tracking-[0.22em] uppercase text-[#B79152] font-[family-name:var(--font-inter)]">Por que indicar</span>
          <h2 className="font-[family-name:var(--font-spectral)] font-medium text-[34px] leading-[1.2] mt-3 text-[#0C2330]">
            Sua indicação vale a sua reputação. A gente trata assim.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ADVANTAGES.map((adv) => (
            <div
              key={adv.title}
              className="bg-white border border-[rgba(22,21,19,0.08)] rounded-lg p-7 flex flex-col gap-3.5 shadow-[0_1px_3px_rgba(12,35,48,0.06)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(12,35,48,0.10)] transition duration-[220ms] ease-[cubic-bezier(.25,.46,.45,.94)]"
            >
              <adv.icon size={24} className="text-[#B79152]" />
              <h3 className="font-[family-name:var(--font-spectral)] font-semibold text-xl text-[#0C2330]">{adv.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#4A463F] font-[family-name:var(--font-inter)]">{adv.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RemunerationSection() {
  function scrollToForm() {
    const target = document.getElementById("form-parceiro");
    if (target) {
      const y = target.getBoundingClientRect().top + window.pageYOffset - 24;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  return (
    <section className="px-6 pt-0 pb-14 md:pb-[88px]">
      <div className="max-w-[1080px] mx-auto bg-[#0C2330] rounded-lg p-8 md:p-16 text-[#F2EAD9]">
        <div className="max-w-[640px] mb-11">
          <span className="text-xs tracking-[0.22em] uppercase text-[#B79152] font-[family-name:var(--font-inter)]">Novo na parceria</span>
          <h2 className="font-[family-name:var(--font-spectral)] font-medium text-[clamp(1.75rem,4vw,2.375rem)] leading-[1.2] mt-3 mb-3.5">
            Como você quer ser remunerado?{" "}
            <em className="italic text-[#B79152]">Você decide.</em>
          </h2>
          <p className="text-base leading-relaxed text-[rgba(242,234,217,0.8)] font-[family-name:var(--font-inter)]">
            A cada indicação que vira cliente, você escolhe um dos dois caminhos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[rgba(242,234,217,0.05)] border border-[rgba(183,145,82,0.45)] rounded-lg p-8 flex flex-col gap-2.5">
            <span className="text-xs tracking-[0.2em] uppercase text-[#C9BBA4] font-[family-name:var(--font-inter)]">Caminho 1 · À vista</span>
            <span className="font-[family-name:var(--font-spectral)] font-medium text-[clamp(2.375rem,5vw,3.25rem)] text-[#F2EAD9] leading-[1.1]">
              R$ 1.500
            </span>
            <span className="w-10 h-px bg-[#B79152] my-1.5" />
            <p className="text-[15px] leading-relaxed text-[rgba(242,234,217,0.75)] font-[family-name:var(--font-inter)]">
              Pagamento único assim que o contrato é assinado. Para quem prefere o ganho imediato.
            </p>
          </div>
          <div className="bg-[rgba(242,234,217,0.05)] border border-[rgba(183,145,82,0.45)] rounded-lg p-8 flex flex-col gap-2.5">
            <span className="text-xs tracking-[0.2em] uppercase text-[#C9BBA4] font-[family-name:var(--font-inter)]">Caminho 2 · Recorrente</span>
            <span className="font-[family-name:var(--font-spectral)] font-medium text-[clamp(2.375rem,5vw,3.25rem)] text-[#F2EAD9] leading-[1.1]">
              10% <span className="text-[22px] text-[rgba(242,234,217,0.7)]">/ 12 meses</span>
            </span>
            <span className="w-10 h-px bg-[#B79152] my-1.5" />
            <p className="text-[15px] leading-relaxed text-[rgba(242,234,217,0.75)] font-[family-name:var(--font-inter)]">
              10% da taxa de administração da WeCare pelo primeiro ano. Para quem prefere ganhar mais ao longo dos meses.
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-6 flex-wrap">
          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex items-center gap-2.5 bg-[#B79152] hover:bg-[#C9A96B] text-[#0C2330] font-semibold text-base px-7 py-3.5 rounded-lg transition duration-[220ms] ease-[cubic-bezier(.25,.46,.45,.94)] font-[family-name:var(--font-inter)]"
          >
            Seja parceiro WeCare
          </button>
          <span className="text-sm text-[rgba(242,234,217,0.6)] font-[family-name:var(--font-inter)]">
            A escolha vale por indicação — você pode alternar.
          </span>
        </div>
      </div>
    </section>
  );
}

function TermModal({
  title,
  content,
  onAccept,
  onClose,
}: {
  title: string;
  content: string;
  onAccept: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C2330]/60">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh] border border-[rgba(22,21,19,0.08)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(22,21,19,0.1)] shrink-0">
          <h2 className="font-semibold text-[#0C2330] text-sm font-[family-name:var(--font-spectral)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B675E] hover:text-[#0C2330] transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <pre className="text-xs text-[#4A463F] leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-inter)]">
            {content}
          </pre>
        </div>

        <div className="px-6 py-4 border-t border-[rgba(22,21,19,0.1)] flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-[#C9BBA4] text-[#161513] text-sm font-medium hover:bg-[#F2EAD9]/50 transition font-[family-name:var(--font-inter)]"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 py-3 rounded-lg bg-[#0C2330] hover:bg-[#14384D] text-[#F2EAD9] text-sm font-semibold transition font-[family-name:var(--font-inter)]"
          >
            Li e aceito
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(12,35,48,0.06)] border border-[rgba(22,21,19,0.08)] max-w-2xl w-full p-8 md:p-10">
      {children}
    </div>
  );
}

// ── Tipos e estado principal ──────────────────────────────────────────────────

type Phase = "form" | "submitting" | "upload" | "done" | "error";

export default function CadastroParceiro() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; document?: string }>({});
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [selectedDocType, setSelectedDocType] = useState("rg_cpf");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showTermModal, setShowTermModal] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    document: "",
    email: "",
    phone: "",
    company_name: "",
    segment: "",
    term_consent: false,
    lgpd_consent: false,
  });
  const [segmentChoice, setSegmentChoice] = useState("");

  const canSubmit = form.term_consent && form.lgpd_consent;

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPhase("submitting");
    setFieldErrors({});
    setErrorMsg("");
    try {
      const res = await registerPartner({
        full_name: form.full_name,
        document: form.document,
        email: form.email,
        phone: form.phone || undefined,
        company_name: form.company_name || undefined,
        segment: form.segment || undefined,
        lgpd_consent: true,
        term_version: TERM_VERSION,
      });
      setPartnerId(res.partner_id);
      setPhase("done");
    } catch (err: unknown) {
      if (err instanceof RegisterPartnerError && err.field) {
        setFieldErrors({ [err.field]: err.message });
        setPhase("form");
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
      setPhase("error");
    }
  }

  async function handleFileUpload(file: File) {
    if (!partnerId) return;
    setUploading(true);
    setUploadError("");
    try {
      await uploadPartnerDocument(partnerId, selectedDocType, file);
      setUploadedFiles((prev) => [...prev, file.name]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  }

  if (showTermModal) {
    return (
      <>
        <PageShell />
        <TermModal
          title={`Termo de Parceria WeCare (v${TERM_VERSION})`}
          content={TERMO_PARCERIA}
          onClose={() => setShowTermModal(false)}
          onAccept={() => {
            setForm((prev) => ({ ...prev, term_consent: true }));
            setShowTermModal(false);
          }}
        />
      </>
    );
  }

  if (showLgpdModal) {
    return (
      <>
        <PageShell />
        <TermModal
          title="Política de Privacidade e Consentimento LGPD"
          content={TERMO_LGPD}
          onClose={() => setShowLgpdModal(false)}
          onAccept={() => {
            setForm((prev) => ({ ...prev, lgpd_consent: true }));
            setShowLgpdModal(false);
          }}
        />
      </>
    );
  }

  if (phase === "error") {
    return (
      <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
        <HeroHeader rightLink={{ href: "/login", label: "Já sou parceiro" }} />
        <div className="flex items-center justify-center px-6 py-12">
          <StatusCard>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F0DED9] flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-[#8A3A33]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0C2330] font-[family-name:var(--font-spectral)]">Não foi possível cadastrar</h1>
              <p className="text-[#8A3A33] text-sm">{errorMsg}</p>
              <button onClick={() => setPhase("form")} className="text-sm text-[#B79152] underline hover:text-[#8F6E37] transition">
                Tentar novamente
              </button>
            </div>
          </StatusCard>
        </div>
        <PageFooter />
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
        <HeroHeader />
        <div className="flex items-center justify-center px-6 py-12">
          <StatusCard>
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#E4EAE2] flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-[#4C6B52]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0C2330] font-[family-name:var(--font-spectral)]">
                Cadastro realizado! Bem-vindo à WeCare.
              </h1>
              <div className="bg-[#F2EAD9]/60 rounded-lg p-4 text-sm text-[#4A463F] text-left space-y-3 border border-[rgba(22,21,19,0.08)]">
                <div>
                  <p className="text-xs text-[#6B675E] uppercase tracking-[0.14em] font-medium">E-mail de acesso</p>
                  <p className="font-medium text-[#0C2330] mt-0.5">{form.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B675E] uppercase tracking-[0.14em] font-medium">Senha temporária</p>
                  <p className="text-[#0C2330] mt-0.5">Enviada agora para este e-mail.</p>
                </div>
              </div>
              <p className="text-sm font-medium text-[#9A6A2E] bg-[#F1E6D2] border border-[rgba(183,145,82,0.3)] rounded-lg px-4 py-3">
                No primeiro acesso você cria a sua senha definitiva.
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(`/login?email=${encodeURIComponent(form.email)}&prefill=true`)
                }
                className="inline-flex items-center justify-center w-full py-4 rounded-lg bg-[#0C2330] hover:bg-[#14384D] text-[#F2EAD9] text-base font-semibold transition"
              >
                Acessar o portal
              </button>
            </div>
          </StatusCard>
        </div>
        <PageFooter />
      </main>
    );
  }

  if (phase === "upload") {
    return (
      <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
        <HeroHeader />
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#E4EAE2] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-[#4C6B52]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0C2330] font-[family-name:var(--font-spectral)]">Cadastro recebido!</h1>
            <p className="text-[#4A463F] text-base leading-relaxed">
              Verifique seu e-mail — suas credenciais de acesso já foram enviadas.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[rgba(22,21,19,0.08)] shadow-[0_1px_3px_rgba(12,35,48,0.06)] p-8 space-y-5">
            <Section icon={Upload} title="Documentos (opcional, mas recomendado)">
              <p className="text-[15px] text-[#4A463F] leading-relaxed">
                Envie seu RG/CPF ou Contrato Social para agilizar a validação do seu cadastro.
                Você pode pular e enviar depois do primeiro login.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label>Tipo de documento</Label>
                <SelectEl value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value)}>
                  {DOC_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </SelectEl>
              </div>

              <div
                className="border-2 border-dashed border-[#C9BBA4] rounded-lg p-6 text-center cursor-pointer hover:border-[#B79152] transition"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) handleFileUpload(f);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                    e.target.value = "";
                  }}
                />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-[#6B675E]">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Enviando…</span>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="mx-auto text-[#B79152]/50 mb-2" />
                    <p className="text-sm text-[#4A463F]">
                      Arraste um arquivo ou <span className="text-[#B79152] font-medium">clique aqui</span>
                    </p>
                    <p className="text-xs text-[#8A857C] mt-1">PDF, JPEG ou PNG · máx. 5 MB</p>
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-sm text-[#8A3A33] bg-[#F0DED9] border border-[#F0DED9] rounded-lg px-3 py-2">
                  {uploadError}
                </p>
              )}

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((name) => (
                    <div key={name} className="flex items-center gap-2 text-sm bg-[#E4EAE2] rounded-lg px-3 py-2">
                      <CheckCircle2 size={14} className="text-[#4C6B52] shrink-0" />
                      <span className="text-[#0C2330] truncate">{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setPhase("done")}
                className="flex-1 py-3 rounded-lg border border-[#C9BBA4] text-[#161513] text-sm font-medium hover:bg-[#F2EAD9]/50 transition"
              >
                Pular esta etapa
              </button>
              {uploadedFiles.length > 0 && (
                <button
                  onClick={() => setPhase("done")}
                  className="flex-1 py-3 rounded-lg bg-[#0C2330] hover:bg-[#14384D] text-[#F2EAD9] text-sm font-semibold transition"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        </div>
        <PageFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
      <HeroHeader rightLink={{ href: "/login", label: "Já sou parceiro" }} />
      <ProofsStrip />
      <AdvantagesSection />
      <RemunerationSection />

      <section id="form-parceiro" className="px-6 pb-24">
        <form
          onSubmit={handleSubmit}
          className="max-w-[720px] mx-auto bg-white rounded-xl p-6 md:p-12 shadow-[0_1px_3px_rgba(12,35,48,0.06)] flex flex-col gap-5"
        >
          <Section icon={User} title="Seus dados">
            <div className="flex flex-col gap-1.5">
              <Label required>Nome completo</Label>
              <Input
                value={form.full_name}
                onChange={set("full_name")}
                placeholder="Como consta no documento"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label required>CPF ou CNPJ</Label>
                <Input
                  value={form.document}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
                    setForm((prev) => ({ ...prev, document: digits }));
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={14}
                  placeholder="00000000000"
                  required
                />
                <p className="text-xs text-[#8A857C]">Digite apenas números</p>
                {fieldErrors.document && (
                  <p className="text-xs text-[#8A3A33]">{fieldErrors.document}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={formatPhone(form.phone)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setForm((prev) => ({ ...prev, phone: digits }));
                  }}
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label required>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="voce@empresa.com.br"
                required
              />
              {fieldErrors.email && (
                <p className="text-xs text-[#8A3A33]">{fieldErrors.email}</p>
              )}
            </div>
          </Section>

          <FormDivider />

          <Section icon={Briefcase} title="Atuação profissional">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Empresa / Nome profissional</Label>
                <Input
                  value={form.company_name}
                  onChange={set("company_name")}
                  placeholder="Razão social ou nome fantasia"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Segmento</Label>
                <SelectEl
                  value={segmentChoice}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSegmentChoice(value);
                    if (value === "Outro") {
                      setForm((prev) => ({ ...prev, segment: "" }));
                    } else {
                      setForm((prev) => ({ ...prev, segment: value }));
                    }
                  }}
                >
                  <option value="">Selecione...</option>
                  {SEGMENTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </SelectEl>
                {segmentChoice === "Outro" && (
                  <Input
                    className="mt-1"
                    value={form.segment}
                    onChange={(e) => setForm((prev) => ({ ...prev, segment: e.target.value }))}
                    placeholder="Descreva seu segmento"
                  />
                )}
              </div>
            </div>
          </Section>

          <FormDivider />

          <Section icon={FileText} title="Termos e consentimento">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.term_consent}
                onChange={set("term_consent")}
                className="mt-1 accent-[#B79152]"
              />
              <span className="text-[15px] text-[#2B2A27] leading-relaxed">
                Li e aceito o{" "}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowTermModal(true); }}
                  className="text-[#B79152] underline hover:text-[#8F6E37] transition"
                >
                  Termo de Parceria WeCare
                </button>{" "}
                (v{TERM_VERSION}), incluindo as condições de comissionamento, obrigações do parceiro
                e vigência do programa.{" "}
                {form.term_consent && (
                  <CheckCircle2 size={13} className="inline text-[#4C6B52] ml-0.5" />
                )}
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.lgpd_consent}
                onChange={set("lgpd_consent")}
                className="mt-1 accent-[#B79152]"
              />
              <span className="text-[15px] text-[#2B2A27] leading-relaxed">
                Autorizo a WeCare Hosting a tratar meus dados pessoais conforme a{" "}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowLgpdModal(true); }}
                  className="text-[#B79152] underline hover:text-[#8F6E37] transition"
                >
                  Política de Privacidade e LGPD
                </button>{" "}
                para gestão da parceria comercial e comunicações relacionadas.{" "}
                {form.lgpd_consent && (
                  <CheckCircle2 size={13} className="inline text-[#4C6B52] ml-0.5" />
                )}
              </span>
            </label>
          </Section>

          <button
            type="submit"
            disabled={phase === "submitting" || !canSubmit}
            className="mt-2 w-full py-4 rounded-lg bg-[#0C2330] hover:bg-[#14384D] disabled:opacity-40 text-[#F2EAD9] font-semibold text-base transition flex items-center justify-center gap-2"
          >
            {phase === "submitting" ? (
              <><Loader2 size={16} className="animate-spin" /> Enviando…</>
            ) : (
              "Quero ser parceiro WeCare"
            )}
          </button>

          {!canSubmit && (form.full_name || form.email) && (
            <p className="text-center text-xs text-[#8A857C]">
              Aceite os dois termos acima para continuar.
            </p>
          )}
        </form>
      </section>

      <PageFooter />
    </main>
  );
}

function PageShell() {
  return (
    <main className="min-h-screen bg-[#F2EAD9]">
      <HeroHeader rightLink={{ href: "/login", label: "Já sou parceiro" }} />
    </main>
  );
}
