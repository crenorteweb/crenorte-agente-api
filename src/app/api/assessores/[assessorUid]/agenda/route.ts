import { NextRequest, NextResponse } from 'next/server';
import { db, Timestamp } from '@/lib/firebase';
import { authenticate } from '@/lib/middleware';
import { AgendaResponse, HorarioOcupado, ErrorResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { assessorUid: string } }
): Promise<NextResponse<AgendaResponse | ErrorResponse>> {
  const auth = authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const { assessorUid } = params;
  const { searchParams } = new URL(request.url);
  const dataDe = searchParams.get('dataDe');
  const dataAte = searchParams.get('dataAte');

  if (!dataDe || !dataAte) {
    return NextResponse.json(
      { error: 'dataDe e dataAte são obrigatórios (YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(dataDe) || !isoRegex.test(dataAte)) {
    return NextResponse.json(
      { error: 'Formato de data inválido. Use YYYY-MM-DD' },
      { status: 400 }
    );
  }

  try {
    const tsInicio = Timestamp.fromDate(new Date(`${dataDe}T00:00:00`));
    const tsFim = Timestamp.fromDate(new Date(`${dataAte}T23:59:59`));

    const snapshot = await db
      .collection('agendamentos')
      .where('assessorUid', '==', assessorUid)
      .where('dataHora', '>=', tsInicio)
      .where('dataHora', '<=', tsFim)
      .get();

    const horariosOcupados: HorarioOcupado[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      const date: Date = d.dataHora?.toDate?.() ?? new Date();
      const data = date.toISOString().split('T')[0];
      const hora = date.toTimeString().slice(0, 5);
      return { data, hora };
    });

    return NextResponse.json({ horariosOcupados });
  } catch (err) {
    console.error('[agenda]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
