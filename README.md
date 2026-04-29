# crenorte-agente-api

API REST para o agente CRE Norte, exposta via Next.js App Router (route handlers). Não possui frontend — apenas endpoints de API.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Firebase Admin SDK (Firestore)
- Deploy no Vercel

---

## Configuração das variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

```bash
cp .env.example .env.local
```

| Variável               | Descrição                                                |
|------------------------|----------------------------------------------------------|
| `FIREBASE_PROJECT_ID`  | ID do projeto Firebase                                   |
| `FIREBASE_CLIENT_EMAIL`| Email da service account do Firebase                    |
| `FIREBASE_PRIVATE_KEY` | Chave privada da service account (com `\n` escapados)   |
| `JWT_SECRET`           | Segredo para assinar e verificar os tokens JWT           |

> **Atenção:** a `FIREBASE_PRIVATE_KEY` deve ser colada com as quebras de linha representadas como `\n` (não quebras literais). A API faz o tratamento automaticamente.

---

## Rodando localmente

```bash
npm install
npm run dev
```

A API estará disponível em `http://localhost:3000`.

---

## Deploy no Vercel

1. Faça push do repositório para o GitHub.
2. Importe o projeto no [Vercel](https://vercel.com/new).
3. Configure as variáveis de ambiente no painel do Vercel (Settings → Environment Variables):
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `JWT_SECRET`
4. Clique em **Deploy**.

> O Vercel detecta automaticamente projetos Next.js. Nenhuma configuração adicional é necessária.

---

## Endpoints

### Autenticação

#### `POST /api/auth/login`
```json
{ "email": "string", "senha": "string" }
```
Retorna `{ token, uid, nome, papel }`.

Todas as demais rotas exigem o header:
```
Authorization: Bearer {token}
```

---

### Pre-cadastros

#### `GET /api/pre-cadastros/pendentes-contato`
Query params: `dataDe=YYYY-MM-DD` (obrigatório), `dataAte=YYYY-MM-DD` (opcional)

#### `POST /api/pre-cadastros/{id}/contato`
```json
{ "canal": "whatsapp|telefone|email", "status": "sucesso|sem_resposta|numero_invalido", "mensagemEnviada": "string" }
```

---

### Assessores

#### `GET /api/assessores/disponiveis`
Query params: `cidade=string`, `uf=string` (ambos opcionais)

#### `GET /api/assessores/{assessorUid}/agenda`
Query params: `dataDe=YYYY-MM-DD`, `dataAte=YYYY-MM-DD`

---

### Encaminhamento e Agendamentos

#### `POST /api/encaminhamento`
```json
{ "preCadastroId": "string", "assessorUid": "string" }
```

#### `POST /api/agendamentos`
```json
{ "preCadastroId": "string", "assessorUid": "string", "data": "YYYY-MM-DD", "hora": "HH:mm" }
```

---

## Erros

Todos os erros seguem o formato:
```json
{ "error": "mensagem descritiva" }
```

Com o status HTTP adequado: `400`, `401`, `403`, `404` ou `500`.
