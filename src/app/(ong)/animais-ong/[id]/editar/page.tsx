import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TituloPagina } from '@/components/ui';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import { paraInputData, paraNumero } from '@/lib/format';
import { FormularioAnimal } from '../../FormularioAnimal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Editar animal' };

export default async function EditarAnimal({ params }: { params: Promise<{ id: string }> }) {
  await exigirEquipe();
  const { id } = await params;

  const animal = await db.animal.findFirst({ where: { id, deletadoEm: null } });
  if (!animal) notFound();

  return (
    <>
      <TituloPagina titulo={`Editar ${animal.nome}`} descricao="O endereço público do animal não muda ao renomeá-lo — links já compartilhados continuam funcionando." />
      <FormularioAnimal
        valores={{
          id: animal.id,
          nome: animal.nome,
          especie: animal.especie,
          sexo: animal.sexo,
          porte: animal.porte,
          raca: animal.raca,
          pelagem: animal.pelagem,
          dataNascimento: paraInputData(animal.dataNascimento),
          idadeAproximada: animal.idadeAproximada,
          dataResgate: paraInputData(animal.dataResgate),
          localResgate: animal.localResgate,
          historiaResgate: animal.historiaResgate,
          personalidade: animal.personalidade,
          castrado: animal.castrado,
          vacinasEmDia: animal.vacinasEmDia,
          necessidadeEspecial: animal.necessidadeEspecial,
          descricaoNecessidade: animal.descricaoNecessidade,
          status: animal.status,
          localAbrigo: animal.localAbrigo,
          pesoAtualKg: animal.pesoAtualKg ? String(paraNumero(animal.pesoAtualKg)) : '',
          custoAlimentacao: paraNumero(animal.custoAlimentacao),
          custoTratamento: paraNumero(animal.custoTratamento),
          custoMedicamento: paraNumero(animal.custoMedicamento),
          destaque: animal.destaque,
        }}
      />
    </>
  );
}
