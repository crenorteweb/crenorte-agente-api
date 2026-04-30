import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue, Timestamp } from '@/lib/firebase';
import { authenticate } from '@/lib/middleware';
import { AGENT_USER } from '@/lib/auth';
import { AgendamentoBody, AgendamentoResponse, ErrorResponse } from '@/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<AgendamentoResponse | ErrorResponse>> {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;
  let body: AgendamentoBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { cpf, assessorUid, data, hora } = body;

  if (!cpf || !assessorUid || !data || !hora) {
    return NextResponse.json(
      { error: 'cpf, assessorUid, data e hora são obrigatórios' },
      { status: 400 }
    );
  }

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const horaRegex = /^\d{2}:\d{2}$/;

  if (!isoDateRegex.test(data)) {
    return NextResponse.json(
      { error: 'data deve estar no formato YYYY-MM-DD' },
      { status: 400 }
    );
  }

  if (!horaRegex.test(hora)) {
    return NextResponse.json(
      { error: 'hora deve estar no formato HH:mm' },
      { status: 400 }
    );
  }

  try {
    const [preCadastroSnapshot, assessorDoc] = await Promise.all([
      db.collection('pre_cadastros').where('cpf', '==', cpf).limit(1).get(),
      db.collection('colaboradores').doc(assessorUid).get(),
    ]);

    if (preCadastroSnapshot.empty) {
      return NextResponse.json(
        { error: 'Pre-cadastro não encontrado' },
        { status: 404 }
      );
    }

    if (!assessorDoc.exists) {
      return NextResponse.json(
        { error: 'Assessor não encontrado' },
        { status: 404 }
      );
    }

    const preCadastroDoc = preCadastroSnapshot.docs[0];
    const preCadastroId = preCadastroDoc.id;
    const cliente = preCadastroDoc.data();
    const assessorNome: string = assessorDoc.data()?.nome ?? '';
    const dataHora = Timestamp.fromDate(new Date(`${data}T${hora}`));
    const now = new Date().toISOString();

    const agendamentoRef = await db.collection('agendamentos').add({
      preCadastroId,
      clienteNome: cliente.nomeCompleto ?? '',
      clienteCpf: cliente.cpf ?? '',
      clienteTelefone: cliente.telefone ?? '',
      clienteEmail: cliente.email ?? '',
      clienteEndereco: cliente.endereco ?? '',
      clienteBairro: cliente.bairro ?? '',
      dataHora,
      assessorUid,
      assessorNome,
      createdByUid: AGENT_USER.uid,
      status: 'agendado',
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection('pre_cadastros').doc(preCadastroId).update({
      agendamentoData: data,
      agendamentoHora: hora,
      agendamentoStatus: 'agendado',
      atualizadoEm: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      agendamentoId: agendamentoRef.id,
      agendadoEm: now,
    });
  } catch (err) {
    console.error('[agendamentos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
