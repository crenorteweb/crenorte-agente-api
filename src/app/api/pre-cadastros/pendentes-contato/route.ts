import { NextRequest, NextResponse } from 'next/server';
import { db, Timestamp } from '@/lib/firebase';
import { authenticate } from '@/lib/middleware';
import {
  PendenteContatoResponse,
  ClientePendente,
  AtendimentoInfo,
  ErrorResponse,
} from '@/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<PendenteContatoResponse | ErrorResponse>> {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const dataDe = searchParams.get('dataDe');
  const dataAte = searchParams.get('dataAte') ?? dataDe;

  if (!dataDe) {
    return NextResponse.json(
      { error: 'dataDe é obrigatório (YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(dataDe) || !isoRegex.test(dataAte!)) {
    return NextResponse.json(
      { error: 'Formato de data inválido. Use YYYY-MM-DD' },
      { status: 400 }
    );
  }

  try {
    const tsInicio = Timestamp.fromDate(new Date(`${dataDe}T00:00:00`));
    const tsFim = Timestamp.fromDate(new Date(`${dataAte}T23:59:59`));

    const snapshot = await db
      .collection('pre_cadastros')
      .where('aprovacao.status', 'in', ['apto', 'inapto'])
      .where('createdAt', '>=', tsInicio)
      .where('createdAt', '<=', tsFim)
      .get();

    const clientes: ClientePendente[] = snapshot.docs.map((doc) => {
      const d = doc.data();

      const atendimento: AtendimentoInfo | 'sem atendimento realizado' =
        d.atendimento?.status
          ? {
              status: d.atendimento.status,
              porUid: d.atendimento.porUid ?? '',
              porNome: d.atendimento.porNome ?? '',
              observacao: d.atendimento.observacao ?? null,
              em: d.atendimento.em?.toDate?.()?.toISOString() ?? '',
            }
          : 'sem atendimento realizado';

      return {
        id: doc.id,
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
    });

    return NextResponse.json({ total: clientes.length, clientes });
  } catch (err) {
    console.error('[pendentes-contato]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
