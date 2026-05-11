import { db } from './firebase';

type FindResult = {
  id: string;
  ref: FirebaseFirestore.DocumentReference;
  data: FirebaseFirestore.DocumentData;
} | null;

export async function findPreCadastroByCpf(cpf: string): Promise<FindResult> {
  const snapshot = await db
    .collection('pre_cadastros')
    .where('cpf', '==', cpf)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() };
}

export async function findPreCadastroByTelefone(telefone: string): Promise<FindResult> {
  const snapshot = await db
    .collection('pre_cadastros')
    .where('telefone', '==', telefone)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() };
}

/**
 * Tenta localizar por CPF primeiro; se não encontrar, tenta por telefone.
 * Usado quando o identificador pode ser qualquer um dos dois.
 */
export async function findPreCadastroByIdentifier(identifier: string): Promise<FindResult> {
  const byCpf = await findPreCadastroByCpf(identifier);
  if (byCpf) return byCpf;
  return findPreCadastroByTelefone(identifier);
}
