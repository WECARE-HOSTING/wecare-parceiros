const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wecare_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erro desconhecido");
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type LoginResponse = {
  access_token: string;
  token_type: string;
  partner_id: number;
  must_change_password: boolean;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Credenciais inválidas" }));
    throw new Error(err.detail);
  }
  return res.json();
}

export async function getMe(): Promise<PartnerResponse> {
  return request<PartnerResponse>("/auth/me");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type PartnerDocument = {
  doc_type: string;
  filename: string;
  original_name: string | null;
  size: number;
  uploaded_at: string;
};

export type PartnerResponse = {
  id: number;
  full_name: string;
  document: string;
  document_type: string;
  email: string;
  phone: string | null;
  segment: string | null;
  company_name: string | null;
  utm_code: string;
  referral_url: string;
  status: string;
  is_admin: boolean;
  must_change_password: boolean;
  term_accepted_at: string | null;
  term_version: string | null;
  documents: PartnerDocument[] | null;
  created_at: string;
};

export type PartnerDashboard = {
  partner_id: number;
  partner_name: string;
  utm_link: string;
  total_leads: number;
  active_leads: number;
  leads_new?: number;
  leads_in_progress?: number;
  leads_not_converted?: number;
  converted_leads: number;
  total_properties: number;
  operational_properties: number;
  pending_commissions: number;
  total_commissions_paid: string;
  total_commissions_pending: string;
  commissions_to_receive_month?: string;
};

export type LeadResponse = {
  id: number;
  partner_id: number;
  full_name: string;
  email: string;
  cpf: string;
  phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  status: string;
  attribution_expires_at: string;
  created_at: string;
};

export type PropertyResponse = {
  id: number;
  lead_id: number;
  partner_id: number;
  owner_name: string;
  address_city: string;
  address_state: string;
  contract_model: string;
  status: string;
  operational_since: string | null;
  created_at: string;
};

export type CommissionResponse = {
  id: number;
  partner_id: number;
  property_id: number;
  revenue_record_id: number;
  contract_model: string;
  commission_base: string;
  commission_amount: string;
  status: string;
  cancellation_reason: string | null;
  payment_due_date: string;
  paid_at: string | null;
  nfse_number: string | null;
  created_at: string;
};

export type InAppNotification = {
  id: number;
  type: "NEW_LEAD" | "COMMISSION_UPDATED" | "PROPERTY_STATUS";
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationListResponse = {
  items: InAppNotification[];
  unread_count: number;
};

export type MaterialResponse = {
  id: number;
  title: string;
  description: string | null;
  category: "ART" | "TEXT" | "PRESENTATION";
  status: "PUBLISHED" | "ARCHIVED";
  tags: string[] | null;
  file_url: string;
  file_name: string;
  file_mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
};

export type MaterialDownloadResponse = {
  material: MaterialResponse;
  download_url: string;
};

export type MaterialCreatePayload = {
  title: string;
  description?: string;
  category: "ART" | "TEXT" | "PRESENTATION";
  tags?: string[];
  file_url: string;
  file_name: string;
  file_mime_type?: string;
  file_size_bytes?: number;
};

export type MaterialUploadResponse = {
  file_url: string;
  file_name: string;
  file_mime_type: string;
  file_size_bytes: number;
};

// ── API calls ─────────────────────────────────────────────────────────────────

export type AdminDashboard = {
  partners_total: number;
  partners_active: number;
  partners_pending: number;
  leads_total: number;
  leads_active: number;
  leads_week: number;
  leads_converted: number;
  properties_total: number;
  properties_operational: number;
  commissions_pending_count: number;
  commissions_pending_amount: string;
  commissions_paid_month: string;
};

export const getAdminDashboard = () =>
  request<AdminDashboard>("/admin/dashboard");

export const getDashboard = (partnerId: number) =>
  request<PartnerDashboard>(`/partners/${partnerId}/dashboard`);

export const getLeads = () =>
  request<LeadResponse[]>("/leads");

export const getLead = (id: number) =>
  request<LeadResponse>(`/leads/${id}`);

export type LeadStatusUpdate = {
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "EXPIRED" | "DISQUALIFIED";
  reason?: string;
};

export const updateLeadStatus = (id: number, data: LeadStatusUpdate) =>
  request<LeadResponse>(`/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const getProperties = () =>
  request<PropertyResponse[]>("/properties");

export const getNotifications = (limit = 20) =>
  request<NotificationListResponse>(`/notifications?limit=${limit}`);

export const markNotificationAsRead = (notificationId: number) =>
  request<InAppNotification>(`/notifications/${notificationId}/read`, { method: "POST" });

export const markAllNotificationsAsRead = () =>
  request<{ detail: string }>("/notifications/read-all", { method: "POST" });

export const getMaterials = (
  category?: "ART" | "TEXT" | "PRESENTATION",
  includeArchived = false
) =>
  request<MaterialResponse[]>(
    `/materials?${new URLSearchParams({
      ...(category ? { category } : {}),
      include_archived: includeArchived ? "true" : "false",
    }).toString()}`
  );

export const downloadMaterial = (materialId: number) =>
  request<MaterialDownloadResponse>(`/materials/${materialId}/download`, { method: "POST" });

export const deleteMaterial = (materialId: number) =>
  request<{ detail: string }>(`/materials/${materialId}`, { method: "DELETE" });

export const restoreMaterial = (materialId: number) =>
  request<{ detail: string }>(`/materials/${materialId}/restore`, { method: "POST" });

export const createMaterial = (data: MaterialCreatePayload) =>
  request<MaterialResponse>("/materials", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const uploadMaterialFile = (
  file: File,
  onProgress?: (percent: number) => void
): Promise<MaterialUploadResponse> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("wecare_token") : null;
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/materials/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(percent);
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve(data as MaterialUploadResponse);
          return;
        }
        reject(new Error(data.detail ?? "Erro ao enviar arquivo."));
      } catch {
        reject(new Error("Resposta inválida do servidor."));
      }
    };

    xhr.onerror = () => reject(new Error("Falha de rede no upload."));
    xhr.send(formData);
  });
};

export const getCommissions = (status?: string) =>
  request<CommissionResponse[]>(`/commissions${status ? `?status=${status}` : ""}`);

// ── Partners ──────────────────────────────────────────────────────────────────

export type PartnerSelfRegisterPayload = {
  full_name: string;
  document: string;
  email: string;
  phone?: string;
  segment?: string;
  company_name?: string;
  lgpd_consent: boolean;
  term_version?: string;
};

export class RegisterPartnerError extends Error {
  field: "email" | "document" | null;

  constructor(message: string, field: "email" | "document" | null = null) {
    super(message);
    this.name = "RegisterPartnerError";
    this.field = field;
  }
}

export async function registerPartner(data: PartnerSelfRegisterPayload) {
  const res = await fetch(`${API_URL}/partners/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = typeof err.detail === "string" ? err.detail : "Erro desconhecido";
    if (res.status === 409) {
      const field = detail.includes("e-mail")
        ? "email"
        : detail.includes("CPF/CNPJ")
          ? "document"
          : null;
      throw new RegisterPartnerError(detail, field);
    }
    throw new Error(detail);
  }
  return res.json() as Promise<{ detail: string; partner_id: number }>;
}

export const uploadPartnerDocument = async (
  partnerId: number,
  docType: string,
  file: File
): Promise<PartnerResponse> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("wecare_token") : null;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(
    `${API_URL}/partners/${partnerId}/documents?doc_type=${encodeURIComponent(docType)}`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erro ao enviar documento.");
  }
  return res.json();
};

export type PartnerCreate = {
  full_name: string;
  document: string;
  email: string;
  phone?: string;
  segment?: string;
  company_name?: string;
  initial_password?: string;
};

export const getPartners = () =>
  request<PartnerResponse[]>("/partners");

export const getPartner = (id: number) =>
  request<PartnerResponse>(`/partners/${id}`);

export const createPartner = (data: PartnerCreate) =>
  request<PartnerResponse>("/partners", { method: "POST", body: JSON.stringify(data) });

export const updatePartnerStatus = (id: number, status: string) =>
  request<PartnerResponse>(`/partners/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export type PartnerUpdate = {
  phone?: string | null;
  segment?: string | null;
  company_name?: string | null;
};

export const updatePartner = (id: number, data: PartnerUpdate) =>
  request<PartnerResponse>(`/partners/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// ── Properties ────────────────────────────────────────────────────────────────

export type PropertyCreate = {
  lead_id: number;
  owner_name: string;
  owner_document: string;
  address_street: string;
  address_number: string;
  address_complement?: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  contract_model: "A" | "B" | "C";
  model_a_setup_fee?: number;
  model_a_revenue_pct?: number;
  model_b_setup_fee?: number;
  model_b_fixed_monthly?: number;
  model_b_revenue_pct?: number;
  model_c_first_allocation?: number;
  model_c_ongoing_pct?: number;
};

export type PropertyDetailResponse = {
  id: number;
  lead_id: number;
  partner_id: number;
  owner_name: string;
  owner_document: string;
  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_city: string;
  address_state: string;
  address_zip: string;
  contract_model: string;
  model_a_setup_fee: string | null;
  model_a_revenue_pct: string | null;
  model_b_setup_fee: string | null;
  model_b_fixed_monthly: string | null;
  model_b_revenue_pct: string | null;
  model_c_first_allocation: string | null;
  model_c_ongoing_pct: string | null;
  status: string;
  operational_since: string | null;
  created_at: string;
};

export const createProperty = (data: PropertyCreate) =>
  request<PropertyDetailResponse>("/properties", { method: "POST", body: JSON.stringify(data) });

export const getProperty = (id: number) =>
  request<PropertyDetailResponse>(`/properties/${id}`);

export const updatePropertyStatus = (id: number, status: string) =>
  request<PropertyDetailResponse>(`/properties/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ── Revenue ───────────────────────────────────────────────────────────────────

export type RevenueRecordCreate = {
  property_id: number;
  reference_year: number;
  reference_month: number;
  gross_revenue: number;
  wecare_admin_fee: number;
  owner_payout: number;
};

export type RevenueRecordResponse = {
  id: number;
  property_id: number;
  reference_year: number;
  reference_month: number;
  gross_revenue: string;
  wecare_admin_fee: string;
  owner_payout: string;
  is_first_complete_month: boolean;
  created_at: string;
};

export const createRevenueRecord = (data: RevenueRecordCreate) =>
  request<RevenueRecordResponse>("/revenue-records", { method: "POST", body: JSON.stringify(data) });

export const getRevenueRecords = (propertyId: number) =>
  request<RevenueRecordResponse[]>(`/revenue-records/${propertyId}`);

// ── Commissions ───────────────────────────────────────────────────────────────

export type CommissionDetailResponse = {
  id: number;
  partner_id: number;
  property_id: number;
  revenue_record_id: number;
  contract_model: string;
  commission_base: string;
  commission_amount: string;
  status: string;
  cancellation_reason: string | null;
  payment_due_date: string;
  paid_at: string | null;
  nfse_number: string | null;
  created_at: string;
};

export type CommissionStatusUpdate = {
  status: "AWAITING_NFSE" | "APPROVED" | "PAID" | "CANCELLED";
  cancellation_reason?: string;
  nfse_number?: string;
};

export const getCommission = (id: number) =>
  request<CommissionDetailResponse>(`/commissions/${id}`);

export const updateCommissionStatus = (id: number, data: CommissionStatusUpdate) =>
  request<CommissionDetailResponse>(`/commissions/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// ── Auth extras ───────────────────────────────────────────────────────────────

export const forgotPassword = (email: string) =>
  request<{ detail: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token: string, new_password: string) =>
  request<{ detail: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });

export const changePassword = (new_password: string, current_password?: string) =>
  request<{ detail: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(
      current_password != null ? { current_password, new_password } : { new_password },
    ),
  });

// ── Properties extra ──────────────────────────────────────────────────────────

export type PropertyUpdatePayload = {
  owner_name?: string;
  owner_document?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string | null;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  model_a_setup_fee?: number | null;
  model_a_revenue_pct?: number | null;
  model_b_setup_fee?: number | null;
  model_b_fixed_monthly?: number | null;
  model_b_revenue_pct?: number | null;
  model_c_first_allocation?: number | null;
  model_c_ongoing_pct?: number | null;
};

export const updateProperty = (id: number, data: PropertyUpdatePayload) =>
  request<PropertyDetailResponse>(`/properties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// ── Admin Kanban ──────────────────────────────────────────────────────────────

export type KanbanColumn =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "ONBOARDING"
  | "OPERATIONAL"
  | "CANCELLED";

export type KanbanPropertySummary = {
  id: number;
  status: string;
  address_city: string;
  address_state: string;
  owner_name: string;
  contract_model: string;
};

export type KanbanCommissionSummary = {
  count_pending: number;
  count_paid: number;
  total_pending: string;
  total_paid: string;
  latest_status: string | null;
};

export type KanbanLeadCard = {
  id: number;
  partner_id: number;
  full_name: string;
  email: string;
  cpf: string;
  phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  status: string;
  attribution_expires_at: string;
  created_at: string;
  partner_name: string;
  partner_utm_code: string;
  days_remaining_attribution: number;
  kanban_column: KanbanColumn;
  property: KanbanPropertySummary | null;
  commission: KanbanCommissionSummary | null;
};

export type KanbanResponse = Record<KanbanColumn, KanbanLeadCard[]>;

export const getAdminKanban = () => request<KanbanResponse>("/admin/kanban");

export const adminUpdateLeadStatus = (id: number, data: LeadStatusUpdate) =>
  request<LeadResponse>(`/admin/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const adminUpdatePropertyStatus = (id: number, status: string) =>
  request<PropertyDetailResponse>(`/admin/properties/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ── CRM ───────────────────────────────────────────────────────────────────────

export type CrmFase =
  | "1_lead"
  | "2_reuniao"
  | "3_proposta_contrato"
  | "4_aguardando_docs"
  | "5_assinatura"
  | "operacao"
  | "perdido";

export type CrmClientResponse = {
  id: number;
  codigo_wecare: string;
  codigo_cliente: string;
  nome_cliente: string;
  nome_imovel: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  canal_aquisicao: string;
  partner_id: number | null;
  partner_name: string | null;
  fase_atual: CrmFase;
  proxima_acao: string | null;
  prazo: string | null;
  notas: string | null;
  tipo_imovel: string | null;
  capacidade_hospedes: number | null;
  valor_setup: string | null;
  percentual_admin: string | null;
  contrato_assinado: boolean;
  lead_entrada: string | null;
  lead_saida: string | null;
  reuniao_entrada: string | null;
  reuniao_saida: string | null;
  proposta_entrada: string | null;
  proposta_saida: string | null;
  docs_entrada: string | null;
  docs_saida: string | null;
  assinatura_entrada: string | null;
  assinatura_saida: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmFaseUpdate = {
  fase: CrmFase;
  notas?: string;
  proxima_acao?: string;
  prazo?: string;
};

export const fetchCrmClients = (
  params: { fase?: string; partner_id?: number; search?: string } = {}
) => {
  const qs = new URLSearchParams();
  if (params.fase) qs.set("fase", params.fase);
  if (params.partner_id != null) qs.set("partner_id", String(params.partner_id));
  if (params.search) qs.set("search", params.search);
  const q = qs.toString();
  return request<CrmClientResponse[]>(`/crm/clients${q ? `?${q}` : ""}`);
};

export const updateCrmClientFase = (id: number, data: CrmFaseUpdate) =>
  request<CrmClientResponse>(`/crm/clients/${id}/fase`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export type LeadsUploadResult = {
  criados: number;
  ignorados: number;
  erros: string[];
};

export async function uploadLeadsList(file: File): Promise<LeadsUploadResult> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/leads/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erro no upload." }));
    throw new Error(err.detail ?? "Erro no upload.");
  }
  return res.json();
}
