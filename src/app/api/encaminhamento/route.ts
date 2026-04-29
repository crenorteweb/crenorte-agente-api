import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue } from '@/lib/firebase';
import { authenticate } from '@/lib/middleware';
import { EncaminhamentoBody, EncaminhamentoResponse, ErrorResponse } from '@/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<EncaminhamentoResponse | ErrorResponse>> {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  let body: EncaminhamentoBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { preCadastroId, assessorUid } = body;

  if (!preCadastroId || !assessorUid) {
    return NextResponse.json(
      { error: 'preCadastroId e assessorUid são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const [assessorDoc, preCadastroDoc] = await Promise.all([
      db.collection('colaboradores').doc(assessorUid).get(),
      db.collection('pre_cadastros').doc(preCadastroId).get(),
    ]);

    if (!assessorDoc.exists) {
      return NextResponse.json(
        { error: 'Assessor não encontrado' },
        { status: 404 }
      );
    }

    if (!preCadastroDoc.exists) {
      return NextResponse.json(
        { error: 'Pre-cadastro não encontrado' },
        { status: 404 }
      );
    }

    const assessorNome: string = assessorDoc.data()?.nome ?? '';
    const preCadastroData = preCadastroDoc.data()!;
    const now = new Date().toISOString();

    await Promise.all([
      db.collection('pre_cadastros').doc(preCadastroId).set(
        {
          encaminhamento: {
            assessorUid,
            assessorId: assessorUid,
            assessorNome,
            em: FieldValue.serverTimestamp(),
          },
          caixaAtual: 'assessor',
          caixaUid: assessorUid,
          destinatarioTipo: 'assessor',
          destinatarioUid: assessorUid,
          alocadoParaUid: assessorUid,
          alocadoParaNome: assessorNome,
          analistaId: user.uid,
          atualizadoEm: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
      db
        .collection('inboxes_assessores')
        .doc(assessorUid)
        .collection('itens')
        .doc(preCadastroId)
        .set(
          {
            preCadastroId,
            path: `pre_cadastros/${preCadastroId}`,
            nomeCompleto: preCadastroData.nomeCompleto ?? '',
            cpf: preCadastroData.cpf ?? '',
            aprovado: true,
            em: FieldValue.serverTimestamp(),
          },
          { merge: true }
        ),
    ]);

    return NextResponse.json({ ok: true, encaminhadoEm: now });
  } catch (err) {
    console.error('[encaminhamento]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
