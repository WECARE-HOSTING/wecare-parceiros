"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  User,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { registerPartner, uploadPartnerDocument } from "@/lib/api";

const TERM_VERSION = "1.0";

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
  "Outro",
];

const DOC_TYPES = [
  { value: "rg_cpf", label: "RG ou CPF" },
  { value: "contrato_social", label: "Contrato Social" },
  { value: "comprovante_endereco", label: "Comprovante de Endereço" },
];

const BENEFITS = [
  { label: "Sem esforço operacional", sub: "A WeCare cuida de toda a operação" },
  { label: "Comissão em 12 meses", sub: "Receita recorrente pelo primeiro ano" },
  { label: "Link rastreado exclusivo", sub: "Atribuição automática dos seus leads" },
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
4.1 O Parceiro fará jus a comissão equivalente a 100% (cem por cento) da taxa de administração cobrada pela WeCare no primeiro mês completo de operação do imóvel indicado.
4.2 O pagamento ocorrerá em até 30 (trinta) dias após o encerramento do primeiro mês completo de operação, condicionado à adimplência do proprietário.
4.3 A comissão é devida apenas para indicações registradas através do link UTM exclusivo do Parceiro, dentro do prazo de atribuição de 90 (noventa) dias da primeira visita do lead.
4.4 Não haverá comissão em casos de cancelamento do contrato antes do início da operação, fraude comprovada ou estorno.

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
    <label className="block text-sm font-medium text-[#0C2330] mb-1 font-[family-name:var(--font-inter)]">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full h-10 px-3 rounded-lg border border-[#B79152]/30 bg-white text-sm text-[#0C2330] focus:outline-none focus:ring-2 focus:ring-[#B79152]/40 focus:border-[#B79152] transition font-[family-name:var(--font-inter)] ${className}`}
      {...props}
    />
  );
}

function SelectEl({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full h-10 px-3 rounded-lg border border-[#B79152]/30 bg-white text-sm text-[#0C2330] focus:outline-none focus:ring-2 focus:ring-[#B79152]/40 focus:border-[#B79152] transition font-[family-name:var(--font-inter)] ${className}`}
      {...props}
    />
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#B79152]">
        <Icon size={16} />
        <h2 className="font-semibold text-sm uppercase tracking-wide font-[family-name:var(--font-inter)]">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
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
      <div className="bg-[#F2EAD9] rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh] border border-[#B79152]/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#B79152]/20 shrink-0">
          <h2 className="font-semibold text-[#0C2330] text-sm font-[family-name:var(--font-spectral)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#0C2330]/40 hover:text-[#0C2330] transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <pre className="text-xs text-[#0C2330]/80 leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-inter)]">
            {content}
          </pre>
        </div>

        <div className="px-6 py-4 border-t border-[#B79152]/20 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-[#B79152]/40 text-[#0C2330] text-sm font-medium hover:bg-white/50 transition font-[family-name:var(--font-inter)]"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 h-10 rounded-xl bg-[#B79152] hover:bg-[#B79152]/90 text-[#0C2330] text-sm font-semibold transition font-[family-name:var(--font-inter)]"
          >
            Li e aceito
          </button>
        </div>
      </div>
    </div>
  );
}

function BenefitsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
      {BENEFITS.map((b) => (
        <div
          key={b.label}
          className="bg-white/60 rounded-xl border border-[#B79152]/25 p-4"
        >
          <p className="text-xs font-semibold text-[#0C2330] font-[family-name:var(--font-spectral)]">{b.label}</p>
          <p className="text-xs text-[#0C2330]/60 mt-1 font-[family-name:var(--font-inter)]">{b.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Tipos e estado principal ──────────────────────────────────────────────────

type Phase = "form" | "submitting" | "upload" | "done" | "error";

export default function CadastroParceiro() {
  const [phase, setPhase] = useState<Phase>("form");
  const [errorMsg, setErrorMsg] = useState("");
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
      setPhase("upload");
    } catch (err: unknown) {
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
        <PublicHeader rightLink={{ href: "/login", label: "Já sou parceiro" }} />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-[#B79152]/25 max-w-lg w-full p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-[#0C2330] font-[family-name:var(--font-spectral)]">Não foi possível cadastrar</h1>
            <p className="text-red-600 text-sm">{errorMsg}</p>
            <button onClick={() => setPhase("form")} className="text-sm text-[#B79152] underline">
              Tentar novamente
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
        <PublicHeader />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-[#B79152]/25 max-w-lg w-full p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[#0C2330] font-[family-name:var(--font-spectral)]">Tudo pronto!</h1>
            <p className="text-[#0C2330]/70 text-sm leading-relaxed">
              Cadastro enviado. A equipe WeCare analisará seu perfil em até{" "}
              <strong>7 dias úteis</strong> e você receberá as credenciais de acesso por e-mail.
            </p>
            <div className="bg-[#0C2330]/5 rounded-xl p-4 text-sm text-[#0C2330]/80 text-left space-y-2 border border-[#B79152]/20">
              <p className="font-semibold text-[#0C2330] font-[family-name:var(--font-spectral)]">Próximos passos:</p>
              <p>1. WeCare analisa e ativa sua conta</p>
              <p>2. Você recebe e-mail com credenciais de acesso</p>
              <p>3. Faz login, troca a senha e começa a indicar</p>
            </div>
            <Link href="/login" className="inline-block text-sm text-[#B79152] hover:underline font-medium">
              Já tenho acesso → Entrar no portal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "upload") {
    return (
      <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[#0C2330] font-[family-name:var(--font-spectral)]">Cadastro recebido!</h1>
            <p className="text-[#0C2330]/70 text-sm">
              Verifique seu e-mail — suas credenciais de acesso já foram enviadas.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#B79152]/25 shadow-sm p-6 space-y-5">
            <Section icon={Upload} title="Documentos (opcional, mas recomendado)">
              <p className="text-sm text-[#0C2330]/70 leading-relaxed">
                Envie seu RG/CPF ou Contrato Social para agilizar a validação do seu cadastro.
                Você pode pular e enviar depois do primeiro login.
              </p>

              <div>
                <Label>Tipo de documento</Label>
                <SelectEl value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value)}>
                  {DOC_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </SelectEl>
              </div>

              <div
                className="border-2 border-dashed border-[#B79152]/30 rounded-xl p-6 text-center cursor-pointer hover:border-[#B79152]/60 transition"
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
                  <div className="flex items-center justify-center gap-2 text-[#0C2330]/60">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Enviando…</span>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="mx-auto text-[#B79152]/50 mb-2" />
                    <p className="text-sm text-[#0C2330]/70">
                      Arraste um arquivo ou <span className="text-[#B79152] font-medium">clique aqui</span>
                    </p>
                    <p className="text-xs text-[#0C2330]/50 mt-1">PDF, JPEG ou PNG · máx. 5 MB</p>
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {uploadError}
                </p>
              )}

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((name) => (
                    <div key={name} className="flex items-center gap-2 text-sm bg-green-50 rounded-lg px-3 py-2">
                      <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                      <span className="text-[#0C2330] truncate">{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setPhase("done")}
                className="flex-1 h-11 rounded-xl border border-[#B79152]/40 text-[#0C2330] text-sm font-medium hover:bg-[#F2EAD9]/50 transition"
              >
                Pular esta etapa
              </button>
              {uploadedFiles.length > 0 && (
                <button
                  onClick={() => setPhase("done")}
                  className="flex-1 h-11 rounded-xl bg-[#B79152] hover:bg-[#B79152]/90 text-[#0C2330] text-sm font-semibold transition"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
      <PublicHeader rightLink={{ href: "/login", label: "Já sou parceiro" }} />

      <div className="max-w-lg mx-auto px-4 py-10 space-y-8">
        <BenefitsGrid />

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#B79152]/25 shadow-sm p-6 space-y-6">
          <Section icon={User} title="Seus dados">
            <div>
              <Label required>Nome completo</Label>
              <Input
                value={form.full_name}
                onChange={set("full_name")}
                placeholder="Como consta no documento"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
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
                <p className="text-xs text-[#0C2330]/50 mt-1">
                  Digite apenas números (CPF: 11 dígitos / CNPJ: 14 dígitos)
                </p>
              </div>
              <div>
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div>
              <Label required>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="voce@empresa.com.br"
                required
              />
            </div>
          </Section>

          <hr className="border-[#B79152]/15" />

          <Section icon={Building2} title="Atuação profissional">
            <div>
              <Label>Empresa / Nome profissional</Label>
              <Input
                value={form.company_name}
                onChange={set("company_name")}
                placeholder="Razão social ou nome fantasia"
              />
            </div>
            <div>
              <Label>Segmento</Label>
              <SelectEl value={form.segment} onChange={set("segment")}>
                <option value="">Selecione...</option>
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </SelectEl>
            </div>
          </Section>

          <hr className="border-[#B79152]/15" />

          <Section icon={FileText} title="Termos e consentimento">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.term_consent}
                onChange={set("term_consent")}
                className="mt-0.5 accent-[#B79152]"
              />
              <span className="text-sm text-[#0C2330]/80 leading-relaxed">
                Li e aceito o{" "}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowTermModal(true); }}
                  className="text-[#B79152] underline hover:text-[#B79152]/80 transition"
                >
                  Termo de Parceria WeCare
                </button>{" "}
                (v{TERM_VERSION}), incluindo as condições de comissionamento, obrigações do parceiro
                e vigência do programa.{" "}
                {form.term_consent && (
                  <CheckCircle2 size={13} className="inline text-green-600 ml-0.5" />
                )}
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.lgpd_consent}
                onChange={set("lgpd_consent")}
                className="mt-0.5 accent-[#B79152]"
              />
              <span className="text-sm text-[#0C2330]/80 leading-relaxed">
                Autorizo a WeCare Hosting a tratar meus dados pessoais conforme a{" "}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowLgpdModal(true); }}
                  className="text-[#B79152] underline hover:text-[#B79152]/80 transition"
                >
                  Política de Privacidade e LGPD
                </button>{" "}
                para gestão da parceria comercial e comunicações relacionadas.{" "}
                {form.lgpd_consent && (
                  <CheckCircle2 size={13} className="inline text-green-600 ml-0.5" />
                )}
              </span>
            </label>
          </Section>

          <button
            type="submit"
            disabled={phase === "submitting" || !canSubmit}
            className="w-full h-11 rounded-xl bg-[#B79152] hover:bg-[#B79152]/90 disabled:opacity-40 text-[#0C2330] font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            {phase === "submitting" ? (
              <><Loader2 size={16} className="animate-spin" /> Enviando…</>
            ) : (
              "Quero ser parceiro WeCare"
            )}
          </button>

          {!canSubmit && (form.full_name || form.email) && (
            <p className="text-center text-xs text-[#0C2330]/50">
              Aceite os dois termos acima para continuar.
            </p>
          )}
        </form>

        <p className="text-center text-xs text-[#0C2330]/50">
          WeCare Hosting Serviços LTDA · CNPJ 30.870.784/0001-70 · Cotia — SP
          <br />
          Dúvidas?{" "}
          <a href="mailto:contato@wecarehosting.com.br" className="underline text-[#B79152]">
            contato@wecarehosting.com.br
          </a>
        </p>
      </div>
    </main>
  );
}

function PageShell() {
  return (
    <main className="min-h-screen bg-[#F2EAD9]">
      <PublicHeader rightLink={{ href: "/login", label: "Já sou parceiro" }} />
    </main>
  );
}
