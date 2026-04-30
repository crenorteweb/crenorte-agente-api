import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { CurrentUser, ErrorResponse } from '@/types';

export function authenticate(
  request: NextRequest
): { user: CurrentUser } | NextResponse<ErrorResponse> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Token de autenticação ausente' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    return { user: { uid: payload.uid, nome: payload.nome, papel: payload.papel } };
  } catch {
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }
}
