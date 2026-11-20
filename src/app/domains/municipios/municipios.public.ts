import { useMunicipios } from './municipios.service';

export type { ReferenciaMunicipal } from '../../../../contracts/municipios.public';

export function useReferenciasMunicipais() {
  const { municipios, carregando, erro } = useMunicipios(true);
  return { municipios, carregando, erro };
}
