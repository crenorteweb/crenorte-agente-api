import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { signToken } from '@/lib/auth';
import { LoginBody, LoginResponse, ErrorResponse } from '@/types';

async function loginViaFirebaseAuth(
  email: string,
  senha: string
): Promise<{ uid: string } | null> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data.localId ? { uid: data.localId } : null;
}

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
    // Tenta autenticar via Firebase Auth
    const firebaseUser = await loginViaFirebaseAuth(email, senha);

    if (firebaseUser) {
      const doc = await db.collection('colaboradores').doc(firebaseUser.uid).get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: 'Colaborador não encontrado' },
          { status: 401 }
        );
      }

      const data = doc.data()!;
      const uid = doc.id;
      const nome: string = data.nome ?? '';
      const papel: string = data.papel ?? '';

      const token = signToken({ uid, nome, papel });
      return NextResponse.json({ token, uid, nome, papel });
    }

    // Fallback: método atual via Firestore (email + senha)
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
