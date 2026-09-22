import type { Metadata } from 'next';
import { Cartao, Selo, Tabela, TituloPagina } from '@/components/ui';
import { db } from '@/lib/db';
import { exigirAdmin } from '@/lib/auth';
import { PAPEL, formatarDataHora } from '@/lib/format';
import { lerConfiguracao } from '@/server/config';
import {
  BotaoAlternar,
  FormularioOng,
  FormularioUsuario,
  FormularioVeterinario,
} from './Formularios';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Configurações' };

export default async function Configuracoes() {
  await exigirAdmin();

  const [config, usuarios, veterinarios, auditoria] = await Promise.all([
    lerConfiguracao(),
    db.usuario.findMany({
      where: { deletadoEm: null, papel: { not: 'PADRINHO' } },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    }),
    db.veterinario.findMany({ orderBy: { nome: 'asc' } }),
    db.logAuditoria.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 30,
      include: { usuario: { select: { nome: true } } },
    }),
  ]);

  return (
    <>
      <TituloPagina
        titulo="Configurações"
        descricao="Dados da ONG, quem tem acesso e o registro do que foi feito no sistema."
      />

      <div className="space-y-4">
        <FormularioOng config={config} />

        <Cartao>
          <h2 className="titulo-seccao">Acessos ao sistema</h2>
          <FormularioUsuario />

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-tinta-borda text-left text-xs uppercase tracking-wide text-tinta-suave">
                  <th className="py-2 pr-3 font-bold">Nome</th>
                  <th className="py-2 pr-3 font-bold">E-mail</th>
                  <th className="py-2 pr-3 font-bold">Papel</th>
                  <th className="py-2 pr-3 text-right font-bold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tinta-borda/60">
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 pr-3 font-semibold text-tinta">{u.nome}</td>
                    <td className="py-2.5 pr-3 text-xs text-tinta-suave">{u.email}</td>
                    <td className="py-2.5 pr-3">
                      <Selo>{PAPEL[u.papel]}</Selo>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <span className="flex items-center justify-end gap-3">
                        <span
                          className={`text-xs font-bold ${u.ativo ? 'text-emerald-700' : 'text-tinta-clara'}`}
                        >
                          {u.ativo ? 'ativo' : 'inativo'}
                        </span>
                        <BotaoAlternar id={u.id} ativo={u.ativo} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>

        <Cartao>
          <h2 className="titulo-seccao">Veterinários</h2>
          <FormularioVeterinario />

          {veterinarios.length > 0 ? (
            <ul className="mt-5 divide-y divide-tinta-borda/70">
              {veterinarios.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>
                    <span className="font-semibold text-tinta">{v.nome}</span>
                    <span className="block text-xs text-tinta-suave">
                      {[v.crmv, v.clinica, v.telefone].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </span>
                  <span className={`text-xs font-bold ${v.ativo ? 'text-emerald-700' : 'text-tinta-clara'}`}>
                    {v.ativo ? 'ativo' : 'inativo'}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Cartao>

        <div>
          <h2 className="titulo-seccao mb-2">Registro de auditoria</h2>
          <p className="mb-2 text-sm text-tinta-suave">
            Append-only: nem a aplicação consegue apagar ou alterar uma linha daqui.
          </p>
          <Tabela
            cabecalho={['Quando', 'Quem', 'Ação', 'Entidade']}
            vazio={auditoria.length === 0 ? 'Nada registrado ainda.' : undefined}
          >
            {auditoria.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2 text-xs tabular-nums text-tinta-suave">
                  {formatarDataHora(l.criadoEm)}
                </td>
                <td className="px-4 py-2 text-xs text-tinta">{l.usuario?.nome ?? 'visitante'}</td>
                <td className="px-4 py-2 text-xs font-semibold text-petroleo-800">{l.acao}</td>
                <td className="px-4 py-2 text-xs text-tinta-suave">{l.entidade}</td>
              </tr>
            ))}
          </Tabela>
        </div>
      </div>
    </>
  );
}
