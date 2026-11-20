# ARCHITECTURE.md — portal de lojas

> Este documento é a referência principal para qualquer pessoa ou agente de IA
> que for manter, estender ou refatorar este projeto. Leia isso antes de tocar
> em qualquer código. As decisões aqui não são acidente — refletem uma
> filosofia deliberada de arquitetura.

> ⚠️ **AVISO PARA AGENTES DE IA — leia antes de qualquer tarefa**
>
> Este arquivo é um documento de **arquitetura e convenções**, não um espelho
> do código-fonte. Todos os blocos de código aqui são **fragmentos ilustrativos**
> que demonstram padrões — eles não representam o conteúdo completo de nenhum
> arquivo do projeto. Em particular:
>
> - Listas de domínios, chaves de permissão, rotas e imports mostradas nos
>   exemplos refletem o estado inicial do projeto. O projeto real pode ter mais
>   domínios, mais chaves e mais arquivos do que os listados aqui.
> - Nunca trate um exemplo deste documento como o conteúdo definitivo e
>   exaustivo do arquivo correspondente. Sempre leia o arquivo real no
>   repositório antes de editar.
> - Quando uma tarefa exigir adicionar algo novo (domínio, permissão, rota),
>   siga o **padrão descrito** — não se limite ao **conteúdo exemplificado**.

## Stack

| Camada      | Tecnologia                                                        |
|-------------|-------------------------------------------------------------------|
| Frontend    | React + TypeScript + Vite, React Router, PrimeReact + PrimeIcons  |
| Backend     | Cloudflare Pages Functions (TypeScript, runtime Workers)          |
| Banco       | Cloudflare D1 (SQLite), migrações via `wrangler d1 migrations`    |
| Hospedagem  | Cloudflare Pages (estático do `dist/` + `functions/`)             |
| Sessão      | Token aleatório em cookie `HttpOnly; Secure; SameSite=Lax`, persistido na tabela `sessoes` |

O fluxo do produto: a pessoa **solicita acesso** → aguarda a **aprovação da
administração** → faz **login** → acessa o portal conforme as permissões concedidas.

## Layout e tema

A interface usa o layout estático do Sakai, template oficial da PrimeTek. O
portal adapta a barra superior, o menu lateral e a superfície de autenticação
ao React Router. O tema claro padrão é `lara-light-indigo`, com componentes
PrimeReact, PrimeIcons e utilitários PrimeFlex. O `PrimeReactProvider` usa
`pt-BR`. A base de estilos do Sakai e a licença MIT ficam em
`src/app/core/layout/sakai/`.

## Filosofia geral

> "Estratégico primeiro, flat, abstrai por dor."

1. **Comece monolítico, separe por contexto delimitado.** Não existe
   `services/`, `hooks/`, `components/` na raiz cortando o projeto inteiro
   por camada técnica. Existe `domains/usuarios/`, `domains/lojas/` — cada um
   é uma pasta autocontida que junta tudo que aquele contexto de negócio
   precisa. A mesma regra vale para o backend (`server/domains/`).

2. **Dentro de cada domínio, comece procedural.** Um domínio tem, no mínimo:
   - `*.model.ts` — tipos. Entrada/saída do domínio, sem cerimônia.
   - `*.service.ts` — lógica de acesso a dados (HTTP via `apiFetch`) **e**
     estado local (hook `use*` com `useState`/`useEffect`). Não separamos
     "api" de "hook" de "store" (Redux, Zustand, etc.) só porque em teoria
     poderiam crescer — isso é abstração por antecipação, e é proibida por
     princípio aqui.
   - `*-list/`, `*-form/`, `*-detalhe/` — páginas, uma pasta por página.
     Cada página tem `.tsx` (componente: lógica + JSX no mesmo arquivo) e,
     se precisar, `.module.css` (estilo local).
   - `*.routes.tsx` — rotas do domínio (objetos do React Router), com os
     wrappers de permissão (`<RequirePermissao>`) já aplicados ali, não
     espalhados em outro lugar.

3. **Abstrai por dor, não por precaução.** Pergunta de bolso antes de criar
   uma interface/abstração nova: *"isso já trocou de implementação pelo
   menos uma vez nos últimos meses?"* Se não, não abstrai. Os serviços de
   domínio (ex: `usuarios.service.ts`, `lojas.service.ts` — e todos os que
   forem adicionados) são módulos concretos com funções exportadas, não
   interfaces com múltiplas implementações injetadas por Context — porque hoje
   não existe a dor de trocar a implementação. Se um dia a forma de buscar
   dados mudar (ex: adotar TanStack Query, trocar a URL da API), a troca
   acontece **dentro** de cada `.service.ts`, sem precisar reescrever as
   páginas que consomem.

4. **Separa por responsabilidade, não por camada arquitetural.** Não tem
   `controllers/`, `services/`, `repositories/`, `dtos/` cortando o projeto.
   Separação é: "isso é regra de negócio" vs. "isso é I/O" vs. "isso é
   apresentação" — e essa separação acontece **dentro de cada arquivo**, não
   espalhando o mesmo domínio em 5 pastas diferentes.

## Estrutura de pastas

> A árvore abaixo reflete a estrutura **inicial** do projeto. Novos domínios
> serão adicionados em `domains/` conforme o sistema cresce — a ausência de
> um domínio aqui não significa que ele não existe no repositório.

### Frontend (`src/`)

```
src/
├── app/
│   ├── core/                          # infraestrutura transversal (não é "domínio de negócio")
│   │   ├── auth/
│   │   │   ├── auth.models.ts         # UsuarioLogado, LoginPayload, CadastroPayload, SessaoResponse
│   │   │   ├── auth.service.ts        # login/cadastro/logout/me (HTTP) + AuthProvider e useAuth() (estado da sessão)
│   │   │   ├── require-auth.tsx       # <RequireAuth> — bloqueia rotas sem login (equivale ao guard)
│   │   │   ├── api-client.ts          # apiFetch(): credentials 'include' + X-Device-Id em todo request, trata 401 (equivale ao interceptor)
│   │   │   ├── dispositivo.service.ts # gera/persiste o UUID do dispositivo em localStorage
│   │   │   ├── login-page/            # tela de login
│   │   │   └── cadastro-page/         # tela de auto-cadastro (público)
│   │   ├── permissions/
│   │   │   ├── permission.model.ts    # PermissaoKey (union type) — CONTRATO ÚNICO. Só tipos.
│   │   │   ├── require-permissao.tsx  # <RequirePermissao chave="..."> — bloqueia rota por PermissaoKey
│   │   │   └── permissao.tsx          # <Permissao chave="..."> + usePermissao() — esconde elementos
│   │   ├── navegacao/
│   │   │   └── navegacao.model.ts     # ESTRUTURA_APP (fonte única) → MENU_PRINCIPAL + ARVORE_PERMISSOES
│   │   └── layout/
│   │       ├── shell.tsx              # sidebar + topbar + <Outlet/> (o "app shell")
│   │       └── home-page/             # dashboard inicial
│   ├── domains/                       # cada pasta = um contexto delimitado de negócio
│   │   ├── usuarios/                  # CRUD de usuários + matriz de permissões (admin)
│   │   └── lojas/                     # consulta de lojas (listagem, filtros, detalhe) + CRUD (admin)
│   ├── shared/ui/                     # componentes 100% genéricos, sem regra de negócio
│   │   ├── icon.tsx                   # ícone por nome (PrimeIcons: `pi pi-<nome>`)
│   │   └── page-header.tsx            # cabeçalho de página (breadcrumb + título + slot de ações via children)
│   ├── router.tsx                     # composição de rotas: login/cadastro (públicos) + shell (protegido)
│   └── providers.tsx                  # providers globais (AuthProvider, PrimeReactProvider, locale pt-BR)
├── main.tsx                           # ponto de entrada: createRoot + <Providers><RouterProvider/></Providers>
└── vite-env.d.ts                      # tipagem de import.meta.env (VITE_*)

.env.development                       # VITE_MOCK_AUTH=false, VITE_API_URL=/api (proxy do Vite → wrangler :8788)
.env.production                        # VITE_MOCK_AUTH=false, VITE_API_URL=/api
```

Exemplo de um domínio completo:

```
domains/lojas/
├── lojas.model.ts          # Loja, FiltroLojas, LojaPayload
├── lojas.service.ts        # listarLojas(), obterLoja(), gravarLoja(), apagarLoja() + useLojas(filtro)
├── lojas.routes.tsx        # rotas do domínio, já embrulhadas em <RequirePermissao>
├── lojas-list/
│   ├── lojas-list.tsx      # export function LojasListPage()
│   └── lojas-list.module.css
├── lojas-detalhe/
│   └── lojas-detalhe.tsx
└── lojas-form/
    └── lojas-form.tsx      # inclusão e edição no mesmo formulário
```

Convenção de nomes: **pastas e arquivos em kebab-case**, **componentes
exportados em PascalCase** (`LojasListPage`), **hooks começam com `use`**.

### Backend (`functions/` + `server/` + `migrations/`)

```
functions/                             # Cloudflare Pages Functions — SÓ roteamento (arquivo = rota)
└── api/
    ├── _middleware.ts                 # lê cookie de sessão, valida no D1, injeta usuário em context.data
    ├── auth/
    │   ├── cadastro.ts                # POST /api/auth/cadastro (público)
    │   ├── login.ts                   # POST /api/auth/login (público)
    │   ├── logout.ts                  # POST /api/auth/logout
    │   └── me.ts                      # GET  /api/auth/me → usuário + permissoes[]
    ├── usuarios/
    │   ├── index.ts                   # GET/POST /api/usuarios
    │   └── [id].ts                    # GET/PUT/DELETE /api/usuarios/:id
    └── lojas/
        ├── index.ts                   # GET/POST /api/lojas
        └── [id].ts                    # GET/PUT/DELETE /api/lojas/:id

server/                                # lógica do backend, mesma filosofia por domínio
├── core/
│   ├── senha.ts                       # hashSenha()/verificarSenha() — PBKDF2 via Web Crypto
│   ├── sessao.ts                      # criarSessao()/validarSessao()/revogarSessao() na tabela sessoes
│   ├── permissao.ts                   # exigirPermissao(ctx, chave) — o único ponto de checagem no servidor
│   └── http.ts                        # json(), erro(), lerCorpo() — respostas padronizadas
└── domains/
    ├── usuarios/usuarios.service.ts   # SQL do D1 + regra de negócio de usuários
    └── lojas/lojas.service.ts         # SQL do D1 + regra de negócio de lojas

migrations/                            # 0001_inicial.sql (usuarios, sessoes, usuario_permissoes, lojas), ...
wrangler.toml                          # binding DB → banco D1, pages_build_output_dir = "dist"
```

Os arquivos em `functions/` são **finos**: leem a requisição, chamam
`exigirPermissao` e delegam para o `*.service.ts` do domínio em `server/`.
Nenhum SQL mora em `functions/`.

### Por que `core/` existe e não é mais um domínio

`core/` não segue a regra "contexto delimitado de negócio" porque não é
negócio — é o que toda a aplicação precisa pra funcionar (sessão, permissão,
casca visual). Por isso `core/` tem regra de import própria, diferente da de
um domínio: ver "Borda pública e regras de importação", que é a única
seção que define o que pode ser importado de onde.

## O contrato de permissões (ponto central do sistema)

Tudo de permissão gira em torno de **um único arquivo**:
`src/app/core/permissions/permission.model.ts`.

### Modelo: flat key set

Cada permissão do sistema é uma **string opaca e única** do tipo
`PermissaoKey`. Não existe o par `(DominioId, Acao)` com ações fixas
de CRUD — qualquer funcionalidade de negócio, seja ela CRUD ou não, vira
uma chave nomeada com o padrão `dominio.contexto.acao`.

> ⚠️ **O bloco abaixo é um fragmento ilustrativo**, não o conteúdo completo
> de `permission.model.ts`. Ele mostra a **estrutura e o padrão de nomenclatura**
> usando os domínios iniciais como exemplo. O arquivo real no repositório
> conterá todas as chaves de todos os domínios existentes no projeto —
> **sempre leia o arquivo antes de editar**, nunca substitua pelo conteúdo abaixo.

```typescript
// FRAGMENTO ILUSTRATIVO — não é o conteúdo completo do arquivo
// Arquivo real: src/app/core/permissions/permission.model.ts
// Padrão de nomenclatura: dominio.contexto.acao
// Este arquivo contém SÓ tipos — nenhum valor em runtime.

export type PermissaoKey =
  // --- Usuários (exemplo de domínio simples) ---
  | 'usuarios.acessar'
  | 'usuarios.gravar.incluir'
  | 'usuarios.gravar.editar'
  | 'usuarios.apagar'
  // --- Lojas (exemplo com ações não-CRUD) ---
  | 'lojas.acessar'
  | 'lojas.gravar.incluir'
  | 'lojas.gravar.editar'
  | 'lojas.apagar'
  | 'lojas.contato.visualizar'
  | 'lojas.exportar'
  // ATENÇÃO: este union type está incompleto aqui propositalmente.
  // No arquivo real, todo domínio do projeto tem suas chaves declaradas.
  // Ao adicionar um domínio novo, adicione suas chaves no arquivo real,
  // não neste documento.
  ;

// O que o usuário carrega — simples e verificável em O(1)
// Serializado como array de strings no JSON (backend → front)
// e convertido para Set na hidratação da sessão em AuthProvider
export type PermissoesUsuario = Set<PermissaoKey>;

// Nó da árvore visual — usado APENAS pela tela de gestão de permissões
// Não é fonte da verdade: a fonte da verdade é PermissaoKey acima
export interface NoArvorePermissao {
  label: string;
  chave?: PermissaoKey;          // ausente em nós-pai (agrupadores)
  filhos?: NoArvorePermissao[];
}
```

A árvore que a tela de permissões renderiza **não** é escrita à mão — ela é
derivada de `ESTRUTURA_APP` em `core/navegacao/navegacao.model.ts`. O
resultado da derivação tem este formato:

```typescript
// FRAGMENTO ILUSTRATIVO — formato do valor DERIVADO, não é código a escrever à mão
// ARVORE_PERMISSOES: NoArvorePermissao[] (calculado em navegacao.model.ts)
[
  {
    label: 'Usuários',   // exemplo de domínio simples (apenas CRUD)
    filhos: [
      { label: 'Acessar listagem', chave: 'usuarios.acessar' },
      {
        label: 'Gravação',
        filhos: [
          { label: 'Incluir', chave: 'usuarios.gravar.incluir' },
          { label: 'Editar', chave: 'usuarios.gravar.editar' },
        ],
      },
      { label: 'Apagar', chave: 'usuarios.apagar' },
    ],
  },
  {
    label: 'Lojas', // exemplo de domínio com ações não-CRUD
    filhos: [
      { label: 'Acessar consulta', chave: 'lojas.acessar' },
      {
        label: 'Gravação',
        filhos: [
          { label: 'Incluir', chave: 'lojas.gravar.incluir' },
          { label: 'Editar', chave: 'lojas.gravar.editar' },
        ],
      },
      { label: 'Apagar', chave: 'lojas.apagar' },
      { label: 'Visualizar contato', chave: 'lojas.contato.visualizar' },
      { label: 'Exportar listagem', chave: 'lojas.exportar' },
    ],
  },
  // ... demais domínios estão no arquivo real
]
```

### Permissões padrão do auto-cadastro

Quem se cadastra pela tela pública (`POST /api/auth/cadastro`) fica com
situação `Pendente` e só pode iniciar uma sessão após aprovação. O backend
propõe a permissão inicial `lojas.acessar` para a revisão da administração.
Chaves administrativas (`usuarios.*`,
`lojas.gravar.*`, `lojas.apagar`) só são atribuídas por um admin na matriz
de permissões.

### Convenção de nomenclatura das chaves

```
dominio.contexto.acao
   │        │      └─ verbo ou substantivo da operação
   │        └─ agrupador funcional (opcional — omitir se desnecessário)
   └─ nome do domínio em snake_case
```

Exemplos corretos:
- `lojas.acessar` — sem contexto intermediário quando a ação é direta
- `lojas.gravar.incluir` — contexto `gravar` agrupa as variantes inclusão/edição
- `lojas.contato.visualizar` — contexto descreve a funcionalidade de negócio

Nunca use `criar` / `editar` como chaves avulsas de nível 2 — use sempre o contexto
`gravar` com filhos `incluir` e `editar`. Isso é deliberado: botão "Gravar" no formulário
é o mesmo elemento para inclusão e edição; o componente decide qual chave checar com base
no estado (ver "Botão contextual" abaixo).

### Como checar no código

```typescript
// FRAGMENTO ILUSTRATIVO — padrão de implementação, não o arquivo completo
// Arquivo real: src/app/core/auth/auth.service.ts

// No AuthProvider — hidrata a sessão convertendo o array do JSON em Set
const resposta = await apiFetch<SessaoResponse>('/auth/me');
setSessao({
  ...resposta,
  permissoes: new Set(resposta.permissoes as PermissaoKey[]),
});

// Exposto pelo contexto de auth — verificação O(1)
const temPermissao = useCallback(
  (chave: PermissaoKey) => sessao?.permissoes.has(chave) ?? false,
  [sessao],
);
```

```tsx
// FRAGMENTO ILUSTRATIVO — src/app/core/permissions/permissao.tsx
export function usePermissao(chave: PermissaoKey): boolean {
  return useAuth().temPermissao(chave);
}

export function Permissao({ chave, children }: { chave: PermissaoKey; children: ReactNode }) {
  return usePermissao(chave) ? <>{children}</> : null;
}
```

### Botão contextual (inclusão vs. edição no mesmo formulário)

Quando um único botão "Gravar" cobre tanto inclusão quanto edição, o
componente resolve a chave correta — o wrapper de rota e o `<Permissao>` não
precisam saber do contexto:

```tsx
// FRAGMENTO ILUSTRATIVO — aplique o mesmo padrão em qualquer domínio com formulário
// Exemplo usando lojas; substitua pelo domínio real ao implementar

// qualquer-form.tsx
const { id } = useParams();               // id do registro, undefined se novo

const permissaoGravar: PermissaoKey = id
  ? 'dominio.gravar.editar'               // substitua 'dominio' pelo domínio real
  : 'dominio.gravar.incluir';

return (
  <Permissao chave={permissaoGravar}>
    <Button label="Gravar" onClick={gravar} />
  </Permissao>
);
```

### Três pontos de consumo no front (e só três)

`PermissaoKey` é consumida no frontend em **três lugares** — não existe uma
quarta forma de checar permissão espalhada em algum componente avulso:

1. **`<RequirePermissao chave="...">`** nas rotas (`*.routes.tsx`) —
   bloqueia a renderização da página inteira se o usuário não tiver a chave
   (redireciona para uma página "sem acesso"). Chave de acesso à listagem é
   tipicamente `'dominio.acessar'`.
2. **`<Permissao chave="...">`** (ou `usePermissao()`, que é o mesmo
   mecanismo em forma de hook, para casos como desabilitar em vez de
   esconder) nos componentes — esconde botões e seções específicas sem
   bloquear a rota.
3. **Árvore de checkboxes** renderizada a partir de `ARVORE_PERMISSOES`
   (`core/navegacao/navegacao.model.ts`) no formulário de usuário — onde um
   admin marca/desmarca chaves. A UI lê a árvore; o que é salvo no backend é
   só o conjunto de chaves marcadas (array de strings).

Se surgir um quarto lugar checando permissão de forma diferente desses três
(ex: `sessao.permissoes.includes(...)` direto num componente), é sinal de
bug, não de feature nova.

### E no backend: um ponto só, e ele é obrigatório

Esconder no React é **conforto visual, não segurança** — qualquer pessoa
pode chamar `/api/lojas` direto. Por isso toda Function que expõe dado ou
altera algo chama `exigirPermissao` **antes** de qualquer acesso ao D1:

```typescript
// FRAGMENTO ILUSTRATIVO — functions/api/lojas/index.ts
import { exigirPermissao } from '../../../server/core/permissao';
import { listarLojas } from '../../../server/domains/lojas/lojas.service';
import { json } from '../../../server/core/http';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  exigirPermissao(ctx, 'lojas.acessar');            // lança 401/403 se faltar
  const url = new URL(ctx.request.url);
  return json(await listarLojas(ctx.env.DB, { busca: url.searchParams.get('busca') ?? '' }));
};
```

As permissões do usuário são lidas do D1 a cada request (via
`_middleware.ts`), nunca confiadas a partir do que o front envia.

### Adicionando uma nova permissão

1. Adicione a chave em `PermissaoKey` seguindo a convenção de nomenclatura.
2. Adicione a ação correspondente no módulo certo de `ESTRUTURA_APP`
   (`core/navegacao/navegacao.model.ts`) — a árvore de permissões e o menu
   lateral são DERIVADOS dali, então esse é o único lugar a editar no front.
3. Aplique `<Permissao>` ou `<RequirePermissao>` nos pontos de consumo do
   front **e** `exigirPermissao` na Function correspondente.
4. Se a chave fizer parte do conjunto padrão do auto-cadastro, ou precisar
   ser dada a usuários existentes, crie uma migração em `migrations/`.

### A estrutura do app é uma fonte só: `ESTRUTURA_APP`

`core/navegacao/navegacao.model.ts` declara a hierarquia da aplicação em
quatro níveis, e dela saem por derivação o menu lateral e a árvore de
permissões — que, se fossem duas listas paralelas editadas na mão,
divergiriam em silêncio:

```
seção ("Aplicações")        → só no menu, cabeçalho fixo, não colapsa
  grupo ("Consultas")       → acordeão no menu, nó-pai na árvore
    módulo ("Lojas")        → item clicável no menu, nó na árvore
      ação ("Incluir")      → só na árvore, é a permissão em si
```

```typescript
// FRAGMENTO ILUSTRATIVO — src/app/core/navegacao/navegacao.model.ts
import type { NoArvorePermissao, PermissaoKey } from '../permissions/permission.model';

export const ESTRUTURA_APP: Secao[] = [
  {
    titulo: 'Aplicações',
    grupos: [
      { modulos: [{ label: 'Início', rota: '/', icone: 'home', acoes: [] }] },
      {
        titulo: 'Consultas',
        modulos: [
          {
            label: 'Lojas', rota: '/lojas', icone: 'shop',
            acoes: [
              { label: 'Acessar consulta', chave: 'lojas.acessar' },   // 1ª = acesso
              { label: 'Gravação', filhos: [
                { label: 'Incluir', chave: 'lojas.gravar.incluir' },
                { label: 'Editar', chave: 'lojas.gravar.editar' },
              ] },
              { label: 'Apagar', chave: 'lojas.apagar' },
              { label: 'Visualizar contato', chave: 'lojas.contato.visualizar' },
            ],
          },
        ],
      },
      // ... demais grupos (ex: "Administração" → Usuários) estão no arquivo real
    ],
  },
];

// Derivados — NUNCA escritos à mão
export const MENU_PRINCIPAL = ESTRUTURA_APP.map(/* seção → grupos → itens de menu */);
export const ARVORE_PERMISSOES: NoArvorePermissao[] = ESTRUTURA_APP
  .flatMap((s) => s.grupos)
  .flatMap(/* grupo com título → nó-pai; módulos com ações → nós */);
```

Regras que sustentam o arranjo:

- `MENU_PRINCIPAL` e `ARVORE_PERMISSOES` **nunca** são escritos à mão. São
  `.map()`/`.flatMap()` sobre `ESTRUTURA_APP`, no mesmo arquivo.
- A primeira ação de um módulo é, por convenção, a de acesso
  (`dominio.acessar`) — é ela que o menu usa para esconder o item de quem
  não tem permissão.
- Módulo sem ações (ex: Início) fica fora da árvore de permissões e aparece
  sempre no menu. Grupo sem título tem os módulos soltos sob o cabeçalho da
  seção, sem acordeão.
- `permission.model.ts` guarda **só tipos** (`PermissaoKey`,
  `PermissoesUsuario`, `NoArvorePermissao`) e não importa nada em runtime. A
  direção é sempre `navegacao → permissions`, nunca o contrário — é isso que
  impede ciclo de import.
- A seção **não** vira nível na árvore de permissões: quem agrupa permissão é
  o grupo. Renomear uma seção é mudança puramente visual.

Nunca crie uma chave num componente sem antes declará-la em `PermissaoKey` —
o TypeScript vai reclamar, e isso é proposital.

## Backend: Pages Functions + D1

O backend existe desde o primeiro dia — não há fase de "mock" a ser trocada
depois. `VITE_MOCK_AUTH` existe só para desenvolver telas sem subir o
wrangler; quando `true`, `auth.service.ts` devolve um usuário fixo com todas
as chaves. Essa troca acontece **dentro** de `auth.service.ts` e nenhuma
página sabe dela.

### Desenvolvimento local

- `wrangler pages dev` serve as Functions e um D1 local em `:8788`.
- O Vite (`:5173`) faz proxy de `/api` para `:8788` (`vite.config.ts`), então
  `VITE_API_URL=/api` funciona igual em dev e em produção — sem CORS.
- Migrações: `wrangler d1 migrations apply DB --local` (dev) e `--remote`
  (produção). Nunca altere o schema do D1 pelo painel da Cloudflare.

### Regras do backend

1. **Senha:** sempre `hashSenha()` de `server/core/senha.ts` (PBKDF2 com sal
   aleatório, Web Crypto). Nunca texto puro, nunca bcrypt nativo (não roda
   no runtime Workers).
2. **Sessão:** token aleatório (`crypto.getRandomValues`) salvo em `sessoes`
   com expiração; o cookie leva só o token. Logout apaga a linha.
3. **SQL:** sempre `env.DB.prepare('... WHERE id = ?').bind(id)`. Concatenar
   valor em string SQL é proibido.
4. **Permissão:** `exigirPermissao` em toda Function não pública (ver seção
   de permissões). Rotas públicas são só `auth/cadastro` e `auth/login`.
5. **Resposta:** sempre via `json()`/`erro()` de `server/core/http.ts`, para
   que o front trate erros de um jeito só em `apiFetch`.

## Borda pública e regras de importação

Cada camada tem um único ponto de entrada por domínio para uso por outros
domínios: `<dominio>.public.ts`. Esse arquivo define ou reexporta os contratos
públicos e expõe apenas as operações que outros domínios precisam. Ele pode
usar os arquivos internos do próprio domínio para implementar esses contratos.

Um domínio só pode acessar outro pela borda pública do domínio que fornece o
recurso. A regra vale também para imports de tipos e reexportações. Services,
modelos internos, hooks, páginas, rotas e tabelas de outro domínio são privados.
A dependência aponta para o fornecedor do contrato e deve permanecer sem ciclos.

| Origem | Pode importar |
| --- | --- |
| `src/app/domains/<x>/` | Arquivos do próprio domínio, `core/`, `shared/ui/` e o `<y>.public.ts` de outro domínio do frontend |
| `server/domains/<x>/` | Arquivos do próprio domínio, `server/core/`, o `<y>.public.ts` de outro domínio do servidor e tipos de `permission.model.ts` |
| `src/app/core/` | Outros módulos de `core/` e `shared/ui/` |
| `src/app/shared/ui/` | Bibliotecas externas |
| `src/app/router.tsx` | Rotas dos domínios para compor o aplicativo |
| `functions/api/` | Infraestrutura do servidor e operações do domínio responsável pela rota |

Contratos de dados que atravessam HTTP ficam em `contracts/*.public.ts`.
As bordas podem reexportar esses tipos. O consumidor de outro domínio importa
pela borda da sua própria camada, incluindo quando precisa apenas de um tipo.
O frontend nunca carrega a implementação de um domínio do servidor.

### Exemplo no portal

- `src/app/domains/municipios/municipios.public.ts` fornece referências de
  municípios ao formulário de Lojas.
- `server/domains/municipios/municipios.public.ts` fornece as consultas de
  referência ao servidor de Lojas. Lojas grava `municipio_id` e consulta
  nome, UF e região pelo contrato. As consultas à tabela de municípios ficam
  no domínio Municípios. A chave estrangeira, declarada na migração, protege
  vínculos inclusive se ocorrerem gravações concorrentes.
- Os endpoints e as páginas de gestão de Municípios são compostos na camada de
  roteamento. O domínio Lojas usa somente as operações de referência.

Ao configurar lint, use uma regra de restrição de imports para verificar a
borda, inclusive para imports de tipos.
