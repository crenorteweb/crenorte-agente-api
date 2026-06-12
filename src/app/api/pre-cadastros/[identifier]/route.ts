import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from '@/lib/firebase';
import { authenticate } from '@/lib/middleware';
import { findPreCadastroByCpf, findPreCadastroByIdentifier } from '@/lib/pre-cadastros';
import { AtualizarStatusBody, AtualizarStatusResponse, ClienteResponse, ErrorResponse } from '@/types';

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
        porUid: d.aprovacao?.porUid ?? '',
        porNome: d.aprovacao?.porNome ?? '',
        em: d.aprovacao?.em?.toDate?.()?.toISOString() ?? '',
      },
      elegivel: {
        status: d.elegivel?.status ?? 'nao_verificado',
        porUid: d.elegivel?.porUid ?? '',
        porNome: d.elegivel?.porNome ?? '',
        em: d.elegivel?.em?.toDate?.()?.toISOString() ?? '',
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { identifier: string } }
): Promise<NextResponse<AtualizarStatusResponse | ErrorResponse>> {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const { identifier } = params;

  let body: AtualizarStatusBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { aprovacao, elegivel } = body;

  if (!aprovacao && !elegivel) {
    return NextResponse.json(
      { error: 'Informe ao menos um campo: aprovacao ou elegivel' },
      { status: 400 }
    );
  }

  const aprovacaoStatusValidos = ['apto', 'inapto'];
  if (aprovacao && !aprovacaoStatusValidos.includes(aprovacao.status)) {
    return NextResponse.json(
      { error: 'aprovacao.status inválido. Use: apto ou inapto' },
      { status: 400 }
    );
  }

  const elegivelStatusValidos = ['sim', 'nao', 'nao_verificado'];
  if (elegivel && !elegivelStatusValidos.includes(elegivel.status)) {
    return NextResponse.json(
      { error: 'elegivel.status inválido. Use: sim, nao ou nao_verificado' },
      { status: 400 }
    );
  }

  try {
    const preCadastro = await findPreCadastroByCpf(identifier);

    if (!preCadastro) {
      return NextResponse.json(
        { error: 'Pre-cadastro não encontrado' },
        { status: 404 }
      );
    }

    const { user } = auth;

    const updates: Record<string, unknown> = {
      atualizadoEm: FieldValue.serverTimestamp(),
    };

    if (aprovacao) {
      updates['aprovacao.status'] = aprovacao.status;
      updates['aprovacao.motivo'] = aprovacao.motivo ?? null;
      updates['aprovacao.observacao'] = aprovacao.observacao ?? null;
      updates['aprovacao.porUid'] = user.uid;
      updates['aprovacao.porNome'] = user.nome;
      updates['aprovacao.em'] = FieldValue.serverTimestamp();
    }

    if (elegivel) {
      updates['elegivel.status'] = elegivel.status;
      updates['elegivel.porUid'] = user.uid;
      updates['elegivel.porNome'] = user.nome;
      updates['elegivel.em'] = FieldValue.serverTimestamp();
    }

    await preCadastro.ref.update(updates);

    const atualizadoEm = new Date().toISOString();
    return NextResponse.json({ ok: true, atualizadoEm });
  } catch (err) {
    console.error('[pre-cadastros/patch]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
