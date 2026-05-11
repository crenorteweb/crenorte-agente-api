import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue, Timestamp } from '@/lib/firebase';
import { authenticate } from '@/lib/middleware';
import { AGENT_USER } from '@/lib/auth';
import { findPreCadastroByCpf, findPreCadastroByTelefone } from '@/lib/pre-cadastros';
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

  const { cpf, telefone, assessorUid, data, hora } = body;

  if ((!cpf && !telefone) || !assessorUid || !data || !hora) {
    return NextResponse.json(
      { error: 'assessorUid, data, hora e ao menos cpf ou telefone são obrigatórios' },
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
    const [preCadastro, assessorDoc] = await Promise.all([
      cpf ? findPreCadastroByCpf(cpf) : findPreCadastroByTelefone(telefone!),
      db.collection('colaboradores').doc(assessorUid).get(),
    ]);

    if (!preCadastro) {
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

    const preCadastroId = preCadastro.id;
    const cliente = preCadastro.data;
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

    await preCadastro.ref.update({
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
