import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'CRE Norte Agente API',
    version: '1.0.0',
    description: 'API para o agente CRE Norte — pre-cadastros, assessores e agendamentos.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      Aprovacao: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['apto', 'inapto'] },
          motivo: { type: 'string', nullable: true },
          observacao: { type: 'string', nullable: true },
          porUid: { type: 'string', description: 'UID do usuário que registrou a aprovação' },
          porNome: { type: 'string', description: 'Nome do usuário que registrou a aprovação' },
          em: { type: 'string', format: 'date-time', description: 'Data e hora em que a aprovação foi registrada' },
        },
      },
      Elegivel: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['sim', 'nao', 'nao_verificado'] },
          porUid: { type: 'string', description: 'UID do usuário que registrou a elegibilidade' },
          porNome: { type: 'string', description: 'Nome do usuário que registrou a elegibilidade' },
          em: { type: 'string', format: 'date-time', description: 'Data e hora em que a elegibilidade foi registrada' },
        },
      },
      Atendimento: {
        oneOf: [
          {
            type: 'object',
            properties: {
              status: { type: 'string' },
              porUid: { type: 'string' },
              porNome: { type: 'string' },
              observacao: { type: 'string', nullable: true },
              em: { type: 'string', format: 'date-time' },
            },
          },
          { type: 'string', enum: ['sem atendimento realizado'] },
        ],
      },
      ClientePendente: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nomeCompleto: { type: 'string' },
          cpf: { type: 'string' },
          telefone: { type: 'string' },
          email: { type: 'string' },
          cidade: { type: 'string' },
          uf: { type: 'string' },
          bairro: { type: 'string' },
          origem: { type: 'string' },
          aprovacao: { $ref: '#/components/schemas/Aprovacao' },
          elegivel: { $ref: '#/components/schemas/Elegivel' },
          atendimento: { $ref: '#/components/schemas/Atendimento' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Cliente: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nomeCompleto: { type: 'string' },
          cpf: { type: 'string' },
          telefone: { type: 'string' },
          email: { type: 'string' },
          cidade: { type: 'string' },
          uf: { type: 'string' },
          bairro: { type: 'string' },
          origem: { type: 'string' },
          aprovacao: { $ref: '#/components/schemas/Aprovacao' },
          elegivel: { $ref: '#/components/schemas/Elegivel' },
          atendimento: { $ref: '#/components/schemas/Atendimento' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AssessorDisponivel: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          nome: { type: 'string' },
          cidade: { type: 'string', nullable: true },
          rota: { type: 'string', nullable: true },
          agendamentosAtivos: { type: 'integer' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Login — obtém JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'senha'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'analista@crenorte.com' },
                  senha: { type: 'string', example: 'senha123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token gerado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    uid: { type: 'string' },
                    nome: { type: 'string' },
                    papel: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Credenciais inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/pre-cadastros/pendentes-contato': {
      get: {
        tags: ['Pre-cadastros'],
        summary: 'Lista pre-cadastros pendentes de contato',
        parameters: [
          { name: 'dataDe', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2024-01-15' },
          { name: 'dataAte', in: 'query', required: false, schema: { type: 'string', format: 'date' }, example: '2024-01-15' },
        ],
        responses: {
          200: {
            description: 'Lista de clientes pendentes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    clientes: { type: 'array', items: { $ref: '#/components/schemas/ClientePendente' } },
                  },
                },
              },
            },
          },
          400: { description: 'Parâmetros inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/pre-cadastros/{identifier}': {
      get: {
        tags: ['Pre-cadastros'],
        summary: 'Consulta um cliente pelo CPF ou telefone',
        parameters: [
          {
            name: 'identifier',
            in: 'path',
            required: true,
            description: 'CPF ou telefone do cliente',
            schema: { type: 'string' },
            example: '12345678900',
          },
        ],
        responses: {
          200: {
            description: 'Dados do cliente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Cliente' },
                example: {
                  id: 'abc123xyz',
                  nomeCompleto: 'João da Silva',
                  cpf: '12345678900',
                  telefone: '11999999999',
                  email: 'joao@email.com',
                  cidade: 'São Paulo',
                  uf: 'SP',
                  bairro: 'Centro',
                  origem: 'landing_page',
                  aprovacao: {
                    status: 'apto',
                    motivo: null,
                    observacao: null,
                    porUid: 'uid_do_analista',
                    porNome: 'Carlos Analista',
                    em: '2026-05-10T14:30:00.000Z',
                  },
                  elegivel: {
                    status: 'sim',
                    porUid: 'uid_do_analista',
                    porNome: 'Carlos Analista',
                    em: '2026-05-10T14:30:00.000Z',
                  },
                  atendimento: {
                    status: 'realizado',
                    porUid: 'uid_do_agente',
                    porNome: 'Maria Agente',
                    observacao: null,
                    em: '2026-05-10T14:30:00.000Z',
                  },
                  createdAt: '2026-05-08T09:00:00.000Z',
                },
              },
            },
          },
          401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Pre-cadastro não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Pre-cadastros'],
        summary: 'Atualiza status de aprovação e/ou elegibilidade do cliente',
        description: 'Registra o resultado da análise do cliente. O responsável pela análise é identificado automaticamente pelo token JWT — não é necessário informar no body. Ao menos um dos campos (`aprovacao` ou `elegivel`) deve ser enviado.',
        parameters: [
          {
            name: 'identifier',
            in: 'path',
            required: true,
            description: 'CPF do cliente',
            schema: { type: 'string' },
            example: '12345678900',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  aprovacao: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                      status: { type: 'string', enum: ['apto', 'inapto'], description: 'Resultado da aprovação' },
                      motivo: { type: 'string', nullable: true, description: 'Motivo (obrigatório quando inapto)' },
                      observacao: { type: 'string', nullable: true, description: 'Observação adicional' },
                    },
                  },
                  elegivel: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                      status: { type: 'string', enum: ['sim', 'nao', 'nao_verificado'], description: 'Resultado da elegibilidade' },
                    },
                  },
                },
              },
              examples: {
                aprovacao_apto: {
                  summary: 'Aprovar cliente',
                  value: { aprovacao: { status: 'apto', motivo: null, observacao: null } },
                },
                aprovacao_inapto: {
                  summary: 'Reprovar cliente',
                  value: { aprovacao: { status: 'inapto', motivo: 'Renda insuficiente', observacao: null } },
                },
                elegivel_sim: {
                  summary: 'Marcar como elegível',
                  value: { elegivel: { status: 'sim' } },
                },
                ambos: {
                  summary: 'Atualizar aprovação e elegibilidade juntos',
                  value: {
                    aprovacao: { status: 'apto', motivo: null, observacao: null },
                    elegivel: { status: 'sim' },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Análise registrada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    atualizadoEm: { type: 'string', format: 'date-time' },
                  },
                },
                example: { ok: true, atualizadoEm: '2026-06-12T10:00:00.000Z' },
              },
            },
          },
          400: { description: 'Body inválido ou status não reconhecido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Pre-cadastro não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/pre-cadastros/{identifier}/contato': {
      post: {
        tags: ['Pre-cadastros'],
        summary: 'Registra tentativa de contato',
        parameters: [
          {
            name: 'identifier',
            in: 'path',
            required: true,
            description: 'CPF ou telefone do cliente',
            schema: { type: 'string' },
            example: '12345678900',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['canal', 'status', 'mensagemEnviada'],
                properties: {
                  canal: { type: 'string', enum: ['whatsapp', 'telefone', 'email'] },
                  status: { type: 'string', enum: ['sucesso', 'sem_resposta', 'numero_invalido'] },
                  mensagemEnviada: { type: 'string', example: 'Olá, tudo bem?' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Contato registrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    status: { type: 'string' },
                    em: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          400: { description: 'Body inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Pre-cadastro não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/assessores/disponiveis': {
      get: {
        tags: ['Assessores'],
        summary: 'Lista assessores ativos disponíveis',
        parameters: [
          { name: 'cidade', in: 'query', required: false, schema: { type: 'string' }, example: 'Manaus' },
          { name: 'uf', in: 'query', required: false, schema: { type: 'string' }, example: 'AM' },
        ],
        responses: {
          200: {
            description: 'Lista de assessores',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assessores: { type: 'array', items: { $ref: '#/components/schemas/AssessorDisponivel' } },
                  },
                },
              },
            },
          },
          401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/assessores/{assessorUid}/agenda': {
      get: {
        tags: ['Assessores'],
        summary: 'Horários ocupados de um assessor',
        parameters: [
          { name: 'assessorUid', in: 'path', required: true, schema: { type: 'string' }, example: 'uid-assessor-1' },
          { name: 'dataDe', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2024-01-15' },
          { name: 'dataAte', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2024-01-20' },
        ],
        responses: {
          200: {
            description: 'Horários ocupados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    horariosOcupados: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          data: { type: 'string', format: 'date' },
                          hora: { type: 'string', example: '14:00' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Parâmetros inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/encaminhamento': {
      post: {
        tags: ['Encaminhamento'],
        summary: 'Encaminha pre-cadastro para assessor',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assessorUid'],
                properties: {
                  cpf: { type: 'string', example: '12345678900', description: 'CPF do cliente (obrigatório se telefone não informado)' },
                  telefone: { type: 'string', example: '11999999999', description: 'Telefone do cliente (obrigatório se cpf não informado)' },
                  assessorUid: { type: 'string', example: 'uid-assessor-1' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Encaminhado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    encaminhadoEm: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          400: { description: 'Body inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Recurso não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/agendamentos': {
      post: {
        tags: ['Agendamentos'],
        summary: 'Cria um agendamento',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assessorUid', 'data', 'hora'],
                properties: {
                  cpf: { type: 'string', example: '12345678900', description: 'CPF do cliente (obrigatório se telefone não informado)' },
                  telefone: { type: 'string', example: '11999999999', description: 'Telefone do cliente (obrigatório se cpf não informado)' },
                  assessorUid: { type: 'string', example: 'uid-assessor-1' },
                  data: { type: 'string', format: 'date', example: '2024-01-20' },
                  hora: { type: 'string', example: '14:00' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Agendamento criado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    agendamentoId: { type: 'string' },
                    agendadoEm: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          400: { description: 'Body inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Recurso não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
