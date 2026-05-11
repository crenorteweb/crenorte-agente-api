import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware';
import { findPreCadastroByIdentifier } from '@/lib/pre-cadastros';
import { ClienteResponse, ErrorResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
): Promise<NextResponse<ClienteResponse | ErrorResponse>> {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const { identifier } = params;

  try {
    const preCadastro = await findPreCadastroByIdentifier(identifier);

    if (!preCadastro) {
      return NextResponse.json(
        { error: 'Pre-cadastro não encontrado' },
        { status: 404 }
      );
    }

    const d = preCadastro.data;

    const atendimento =
      d.atendimento?.status
        ? {
            status: d.atendimento.status,
            porUid: d.atendimento.porUid ?? '',
            porNome: d.atendimento.porNome ?? '',
            observacao: d.atendimento.observacao ?? null,
            em: d.atendimento.em?.toDate?.()?.toISOString() ?? '',
          }
        : 'sem atendimento realizado';

    const cliente: ClienteResponse = {
      id: preCadastro.id,
      nomeCompleto: d.nomeCompleto ?? '',
      cpf: d.cpf ?? '',
      telefone: d.telefone ?? '',
      email: d.email ?? '',
      cidade: d.cidade ?? '',
      uf: d.uf ?? '',
      bairro: d.bairro ?? '',
      origem: d.origem ?? '',
      aprovacao: {
        status: d.aprovacao?.status ?? 'inapto',
        motivo: d.aprovacao?.motivo ?? null,
        observacao: d.aprovacao?.observacao ?? null,
      },
      elegivel: {
        status: d.elegivel?.status ?? 'nao_verificado',
      },
      atendimento,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? '',
    };

    return NextResponse.json(cliente);
  } catch (err) {
    console.error('[pre-cadastros/get]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
