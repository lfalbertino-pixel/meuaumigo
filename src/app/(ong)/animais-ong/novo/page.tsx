import type { Metadata } from 'next';
import { TituloPagina } from '@/components/ui';
import { exigirEquipe } from '@/lib/auth';
import { FormularioAnimal } from '../FormularioAnimal';

export const metadata: Metadata = { title: 'Cadastrar animal' };

export default async function NovoAnimal() {
  await exigirEquipe();
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      <TituloPagina
        titulo="Cadastrar animal"
        descricao="O cadastro abre a linha do tempo dele e cria a página pública de apadrinhamento."
      />
      <FormularioAnimal valores={{ dataResgate: hoje, custoAlimentacao: 180, custoTratamento: 250, custoMedicamento: 70 }} />
    </>
  );
}
