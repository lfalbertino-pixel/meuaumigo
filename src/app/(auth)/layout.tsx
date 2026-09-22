import { Marca } from '@/components/Marca';

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="patinhas flex min-h-screen flex-col items-center justify-center bg-tinta-fundo px-4 py-10">
      <Marca className="mb-8" />
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-center text-xs text-tinta-clara">
        Meu AUmigo · mais cuidado, mais vidas
      </p>
    </div>
  );
}
