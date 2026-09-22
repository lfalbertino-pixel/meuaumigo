import type { Config } from 'tailwindcss';

/**
 * Paleta Meu AUmigo.
 *
 * Os dois tons âncora foram amostrados da logo oficial, não estimados:
 * o petróleo do lettering (#0a292b) e o laranja do coração (#ed9216).
 * O resto da escala foi derivado deles.
 *
 * A regra da marca: o petróleo carrega estrutura e texto, o laranja carrega
 * afeto e ação. Laranja em botão de doar e em barra de meta; petróleo no
 * resto. Quando tudo é laranja, nada é.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        petroleo: {
          50: '#f0f7f6',
          100: '#d9ecea',
          200: '#b4d8d5',
          300: '#83bbb7',
          400: '#519a96',
          500: '#2e7d79',
          600: '#1f6362',
          700: '#1a4f50',
          800: '#143d3f',
          900: '#0a292b',
        },
        laranja: {
          50: '#fff8ec',
          100: '#ffedcf',
          200: '#ffd893',
          300: '#ffbe57',
          400: '#f9a62c',
          500: '#ed9216',
          600: '#d1780c',
          700: '#a85a0d',
          800: '#874712',
          900: '#6f3b12',
        },
        tinta: {
          DEFAULT: '#182321',
          suave: '#556360',
          clara: '#8c9895',
          borda: '#e2eae8',
          fundo: '#f6faf9',
        },
        alerta: '#a85a0d',
        risco: '#b0243a',
        seguro: '#1f7a4d',
      },
      fontFamily: {
        sans: ['var(--fonte-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        caixa: '1.25rem',
      },
      boxShadow: {
        cartao: '0 1px 2px rgba(10,41,43,.04), 0 10px 28px -14px rgba(10,41,43,.22)',
        flutuante: '0 18px 48px -18px rgba(10,41,43,.35)',
      },
      /**
       * Duas curvas, só. Entrada desacelera (o elemento chega e para),
       * saída acelera (some sem pedir atenção).
       */
      transitionTimingFunction: {
        entrada: 'cubic-bezier(0,0,.2,1)',
        saida: 'cubic-bezier(.4,0,1,1)',
      },
      keyframes: {
        sobe: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        entraTela: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        brilho: {
          '100%': { transform: 'translateX(100%)' },
        },
        // Barra de progresso da rota: nunca fecha sozinha — quem fecha é a
        // tela nova entrando.
        progressoRota: {
          '0%': { transform: 'scaleX(0)' },
          '55%': { transform: 'scaleX(.72)' },
          '100%': { transform: 'scaleX(.94)' },
        },
        // A barra de meta cresce da esquerda ao entrar na tela: a meta
        // "enchendo" é a informação, não a decoração.
        enche: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        batida: {
          '0%, 100%': { transform: 'scale(1)' },
          '18%': { transform: 'scale(1.14)' },
          '36%': { transform: 'scale(1)' },
          '54%': { transform: 'scale(1.09)' },
        },
      },
      animation: {
        sobe: 'sobe 260ms cubic-bezier(0,0,.2,1) both',
        'entra-tela': 'entraTela 180ms cubic-bezier(0,0,.2,1) both',
        brilho: 'brilho 1.6s ease-in-out infinite',
        'barra-rota': 'progressoRota 2.6s cubic-bezier(0,0,.2,1) forwards',
        enche: 'enche 700ms cubic-bezier(0,0,.2,1) both',
        batida: 'batida 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
