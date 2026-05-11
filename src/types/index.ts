export interface CurrentUser {
  uid: string;
  nome: string;
  papel: string;
}

export interface JwtPayload {
  uid: string;
  nome: string;
  papel: string;
}

// Auth
export interface LoginBody {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  uid: string;
  nome: string;
  papel: string;
}

// Pre-cadastros
export interface AprovacaoInfo {
  status: 'apto' | 'inapto';
  motivo: string | null;
  observacao: string | null;
}

export interface ElegivelInfo {
  status: 'sim' | 'nao' | 'nao_verificado';
}

export interface AtendimentoInfo {
  status: string;
  porUid: string;
  porNome: string;
  observacao: string | null;
  em: string;
}

export interface ClientePendente {
  id: string;
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  email: string;
  cidade: string;
  uf: string;
  bairro: string;
  origem: string;
  aprovacao: AprovacaoInfo;
  elegivel: ElegivelInfo;
  atendimento: AtendimentoInfo | 'sem atendimento realizado';
  createdAt: string;
}

export interface PendenteContatoResponse {
  total: number;
  clientes: ClientePendente[];
}

// Contato
export interface ContatoBody {
  canal: 'whatsapp' | 'telefone' | 'email';
  status: 'sucesso' | 'sem_resposta' | 'numero_invalido';
  mensagemEnviada: string;
}

export interface ContatoResponse {
  ok: boolean;
  status: string;
  em: string;
}

// Assessores
export interface AssessorDisponivel {
  uid: string;
  nome: string;
  cidade: string | null;
  rota: string | null;
  agendamentosAtivos: number;
}

export interface AssessoresDisponiveisResponse {
  assessores: AssessorDisponivel[];
}

// Encaminhamento
export interface EncaminhamentoBody {
  cpf?: string;
  telefone?: string;
  assessorUid: string;
}

export interface EncaminhamentoResponse {
  ok: boolean;
  encaminhadoEm: string;
}

// Agenda
export interface HorarioOcupado {
  data: string;
  hora: string;
}

export interface AgendaResponse {
  horariosOcupados: HorarioOcupado[];
}

// Agendamento
export interface AgendamentoBody {
  cpf?: string;
  telefone?: string;
  assessorUid: string;
  data: string;
  hora: string;
}

export interface AgendamentoResponse {
  ok: boolean;
  agendamentoId: string;
  agendadoEm: string;
}

export interface ErrorResponse {
  error: string;
}
