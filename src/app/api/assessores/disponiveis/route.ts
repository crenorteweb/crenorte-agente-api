import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { authenticate } from '@/lib/middleware';
import { AssessoresDisponiveisResponse, AssessorDisponivel, ErrorResponse } from '@/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<AssessoresDisponiveisResponse | ErrorResponse>> {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const cidade = searchParams.get('cidade');
  const uf = searchParams.get('uf');

  try {
    let query = db
      .collection('colaboradores')
      .where('status', '==', 'ativo');

    const snapshot = await query.get();

    let docs = snapshot.docs;

    if (cidade) {
      docs = docs.filter((d) => d.data().cidade === cidade);
    }
    if (uf) {
      docs = docs.filter((d) => d.data().uf === uf);
    }

    const assessores: AssessorDisponivel[] = docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        nome: d.nome ?? '',
        cidade: d.cidade ?? null,
        rota: d.rota ?? null,
        agendamentosAtivos: d.agendamentosAtivos ?? 0,
      };
    });

    return NextResponse.json({ assessores });
  } catch (err) {
    console.error('[assessores-disponiveis]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
