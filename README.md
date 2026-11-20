# Vitrine — Portal de lojas

Projeto de portfólio para **gestão de usuários**, **gestão de municípios**,
**cadastro e consulta de lojas**. Use dados fictícios para demonstrações.

O frontend usa React, TypeScript, Vite, React Router e PrimeReact. A API
usa Cloudflare Pages Functions e D1. Consulte [ARCHITECTURE.md](ARCHITECTURE.md)
para a organização por domínio e o modelo de permissões. O layout usa o
[Sakai da PrimeTek](https://github.com/primefaces/sakai-react), a partir do
commit `cef0db541432b7fad962a72e7ee2fbbb187500dd`. A licença MIT está no
[diretório do layout](src/app/core/layout/sakai/LICENSE.md).

## Rodar localmente

```sh
pnpm install
pnpm db:migrate:local
pnpm build
pnpm pages:dev
```

Abra [localhost:8788](http://localhost:8788). O banco local começa vazio.
Solicite acesso na tela de cadastro. Em **Usuários**, uma pessoa com permissão
para gerenciar acessos revisa o cadastro pendente e confirma em **Aprovar acesso**.
Depois da aprovação, a conta pode entrar. Para editar o
frontend com recarregamento automático, execute `pnpm dev` em outro terminal
e mantenha o Pages em execução para servir a API.

## Configurar o primeiro administrador

Cadastre a conta pelo portal. Salve o SQL abaixo em um arquivo local, substituindo
o e-mail pelo da conta recém criada. Rode `pnpm exec wrangler d1 execute LOJAS_DB --local --file caminho-do-arquivo.sql`
e entre novamente para carregar as permissões.

```sql
INSERT OR IGNORE INTO usuario_permissoes (usuario_id, permissao)
SELECT usuarios.id, permissoes.chave
FROM usuarios
CROSS JOIN (
  SELECT 'lojas.acessar' AS chave
  UNION ALL SELECT 'lojas.gravar.incluir'
  UNION ALL SELECT 'lojas.contato.visualizar'
  UNION ALL SELECT 'municipios.acessar'
  UNION ALL SELECT 'municipios.gravar.incluir'
  UNION ALL SELECT 'municipios.gravar.editar'
  UNION ALL SELECT 'municipios.apagar'
  UNION ALL SELECT 'usuarios.acessar'
  UNION ALL SELECT 'usuarios.gravar.editar'
) AS permissoes
WHERE usuarios.email = 'administrador@example.test';

UPDATE usuarios
SET status = 'Ativo', atualizado_em = CURRENT_TIMESTAMP, versao = versao + 1
WHERE email = 'administrador@example.test' AND status = 'Pendente';
```

## Municípios e lojas

Cadastre um município com nome e UF. O portal determina a região pela UF.
No cadastro de lojas, selecione uma referência municipal já existente.
Alterações no município aparecem nas lojas vinculadas. A exclusão exige que
o município esteja sem vínculos.

## Configurar o Cloudflare Pages

No `wrangler.toml`, substitua o identificador local pelo ID do banco D1 de destino.
Configure o binding `LOJAS_DB` no ambiente do Pages e aplique as migrações com
`pnpm db:migrate:remote`. Use `pnpm build` para gerar o frontend em `dist/`.
O Pages usa as rotas de `functions/` para a API.
