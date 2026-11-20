const CHAVE = 'vitrine.device-id';

export function obterIdDispositivo(): string {
  let id = localStorage.getItem(CHAVE);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CHAVE, id);
  }
  return id;
}
