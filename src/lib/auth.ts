import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;

export const AGENT_USER = {
  uid:   'm9JrDdYRzmdvxIj759NeEUUZxLJ3',
  nome:  'Crenorte Agente IA',
  email: 'crenorteagenteia@crenorte.com.br',
  papel: 'admin',
} as const;

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '8h' });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  if (typeof decoded === 'string') {
    throw new Error('Token inválido');
  }
  return decoded as JwtPayload;
}
