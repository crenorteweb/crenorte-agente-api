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
        },
      },
      Elegivel: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['sim', 'nao', 'nao_verificado'] },
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
    '/pre-cadastros/{id}/contato': {
      post: {
        tags: ['Pre-cadastros'],
        summary: 'Registra tentativa de contato',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'abc123' },
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
                required: ['preCadastroId', 'assessorUid'],
                properties: {
                  preCadastroId: { type: 'string', example: 'abc123' },
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
                required: ['preCadastroId', 'assessorUid', 'data', 'hora'],
                properties: {
                  preCadastroId: { type: 'string', example: 'abc123' },
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
