import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue } from '@/lib/firebase';
import { authenticate } from '@/lib/middleware';
import { AGENT_USER } from '@/lib/auth';
import { ContatoBody, ContatoResponse, ErrorResponse } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { cpf: string } }
): Promise<NextResponse<ContatoResponse | ErrorResponse>> {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const { cpf } = params;

  let body: ContatoBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { canal, status, mensagemEnviada } = body;

  const canaisValidos = ['whatsapp', 'telefone', 'email'];
  const statusValidos = ['sucesso', 'sem_resposta', 'numero_invalido'];

  if (!canal || !canaisValidos.includes(canal)) {
    return NextResponse.json(
      { error: 'canal inválido. Use: whatsapp, telefone ou email' },
      { status: 400 }
    );
  }

  if (!status || !statusValidos.includes(status)) {
    return NextResponse.json(
      { error: 'status inválido. Use: sucesso, sem_resposta ou numero_invalido' },
      { status: 400 }
    );
  }

  if (!mensagemEnviada) {
    return NextResponse.json(
      { error: 'mensagemEnviada é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const snapshot = await db
      .collection('pre_cadastros')
      .where('cpf', '==', cpf)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Pre-cadastro não encontrado' },
        { status: 404 }
      );
    }

    const docRef = snapshot.docs[0].ref;
    const timestampMs = Date.now();
    const now = new Date().toISOString();

    await docRef.update({
      [`tentativasContato.${timestampMs}`]: {
        canal,
        status,
        mensagemEnviada,
        porUid: AGENT_USER.uid,
        porNome: AGENT_USER.nome,
        em: FieldValue.serverTimestamp(),
      },
      atualizadoEm: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, status, em: now });
  } catch (err) {
    console.error('[contato]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
