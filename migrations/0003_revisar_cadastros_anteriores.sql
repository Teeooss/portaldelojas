-- Cadastros automáticos antigos ainda na versão inicial e com apenas o acesso padrão.
UPDATE usuarios
SET status = 'Pendente',
    atualizado_em = CURRENT_TIMESTAMP,
    versao = versao + 1
WHERE status = 'Ativo'
  AND versao = 1
  AND EXISTS (
    SELECT 1 FROM usuario_permissoes
    WHERE usuario_id = usuarios.id AND permissao = 'lojas.acessar'
  )
  AND NOT EXISTS (
    SELECT 1 FROM usuario_permissoes
    WHERE usuario_id = usuarios.id AND permissao <> 'lojas.acessar'
  );

DELETE FROM sessoes
WHERE usuario_id IN (SELECT id FROM usuarios WHERE status = 'Pendente');
