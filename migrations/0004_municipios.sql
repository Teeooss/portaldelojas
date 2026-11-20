CREATE TABLE municipios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  uf TEXT NOT NULL,
  regiao TEXT NOT NULL,
  nome_chave TEXT NOT NULL,
  UNIQUE (uf, nome_chave)
);

-- Preservar a localização de cada loja e agrupar grafias equivalentes na mesma UF.
CREATE TABLE migracao_localidades (
  loja_id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  uf TEXT NOT NULL,
  regiao TEXT NOT NULL,
  nome_chave TEXT NOT NULL
);

WITH RECURSIVE letras (loja_id, nome, uf, regiao, restante, nome_chave) AS (
  SELECT id, trim(cidade), upper(trim(uf)), regiao, trim(cidade), '' FROM lojas
  UNION ALL
  SELECT loja_id, nome, uf, regiao, substr(restante, 2),
         nome_chave || CASE
           WHEN instr('ÁÀÂÃÄáàâãä', substr(restante, 1, 1)) > 0 THEN 'a'
           WHEN instr('ÉÈÊËéèêë', substr(restante, 1, 1)) > 0 THEN 'e'
           WHEN instr('ÍÌÎÏíìîï', substr(restante, 1, 1)) > 0 THEN 'i'
           WHEN instr('ÓÒÔÕÖóòôõö', substr(restante, 1, 1)) > 0 THEN 'o'
           WHEN instr('ÚÙÛÜúùûü', substr(restante, 1, 1)) > 0 THEN 'u'
           WHEN instr('Çç', substr(restante, 1, 1)) > 0 THEN 'c'
           WHEN instr('Ññ', substr(restante, 1, 1)) > 0 THEN 'n'
           ELSE lower(substr(restante, 1, 1))
         END
  FROM letras
  WHERE restante <> ''
)
INSERT INTO migracao_localidades
SELECT loja_id, nome, uf, regiao, nome_chave FROM letras WHERE restante = '';


INSERT INTO municipios (id, nome, uf, regiao, nome_chave)
SELECT lower(hex(randomblob(16))), MIN(nome), uf,
       CASE
         WHEN uf IN ('AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO') THEN 'Norte'
         WHEN uf IN ('AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE') THEN 'Nordeste'
         WHEN uf IN ('DF', 'GO', 'MT', 'MS') THEN 'Centro-Oeste'
         WHEN uf IN ('ES', 'MG', 'RJ', 'SP') THEN 'Sudeste'
         WHEN uf IN ('PR', 'RS', 'SC') THEN 'Sul'
         ELSE MIN(regiao)
       END, nome_chave
FROM migracao_localidades
GROUP BY uf, nome_chave;

CREATE TABLE lojas_com_municipio (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE RESTRICT,
  endereco TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Ativa','Em revisão','Inativa')),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO lojas_com_municipio (id, nome, categoria, municipio_id, endereco, telefone, email, responsavel, status, criado_em, atualizado_em)
SELECT l.id, l.nome, l.categoria,
       (SELECT m.id FROM municipios m
        WHERE m.uf = origem.uf AND m.nome_chave = origem.nome_chave),
       l.endereco, l.telefone, l.email, l.responsavel, l.status, l.criado_em, l.atualizado_em
FROM lojas l JOIN migracao_localidades origem ON origem.loja_id = l.id;

DROP TABLE migracao_localidades;

DROP TABLE lojas;
ALTER TABLE lojas_com_municipio RENAME TO lojas;
CREATE INDEX idx_lojas_nome ON lojas(nome);
CREATE INDEX idx_lojas_municipio ON lojas(municipio_id);

-- Conceder o novo módulo às contas ativas com o conjunto administrativo completo.
INSERT INTO usuario_permissoes (usuario_id, permissao)
SELECT u.id, chaves.permissao
FROM usuarios u
CROSS JOIN (
  SELECT 'municipios.acessar' AS permissao
  UNION ALL SELECT 'municipios.gravar.incluir'
  UNION ALL SELECT 'municipios.gravar.editar'
  UNION ALL SELECT 'municipios.apagar'
) chaves
WHERE u.status = 'Ativo' AND u.id IN (
  SELECT usuario_id FROM usuario_permissoes
  WHERE permissao IN ('usuarios.acessar', 'usuarios.gravar.editar', 'lojas.acessar', 'lojas.gravar.incluir', 'lojas.contato.visualizar')
  GROUP BY usuario_id HAVING COUNT(*) = 5
);

UPDATE usuarios SET versao = versao + 1, atualizado_em = CURRENT_TIMESTAMP
WHERE id IN (SELECT usuario_id FROM usuario_permissoes WHERE permissao = 'municipios.acessar');
