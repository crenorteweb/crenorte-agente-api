import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { signToken } from '@/lib/auth';
import { LoginBody, LoginResponse, ErrorResponse } from '@/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse | ErrorResponse>> {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { email, senha } = body;

  if (!email || !senha) {
    return NextResponse.json(
      { error: 'email e senha são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const snapshot = await db
      .collection('colaboradores')
      .where('email', '==', email)
      .where('senha', '==', senha)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    const uid = doc.id;
    const nome: string = data.nome ?? '';
    const papel: string = data.papel ?? '';

    const token = signToken({ uid, nome, papel });

    return NextResponse.json({ token, uid, nome, papel });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
