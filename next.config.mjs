/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    // As fotos dos animais são servidas pela própria app, a partir do volume
    // de mídia (/api/foto/[id]). Nada vem de CDN externa.
    unoptimized: true,
  },

  experimental: {
    serverActions: {
      // Foto e vídeo do animal sobem por Server Action.
      bodySizeLimit: '25mb',
    },
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=()' },
        ],
      },
      {
        // A área logada (ONG e padrinho) não tem por que aparecer em buscador.
        // As páginas públicas dos animais têm — é delas que vem padrinho novo.
        source: '/(painel|animais-ong|padrinhos|saude|alimentacao|financeiro|adocoes|relatorios|ia|configuracoes|meus-aumigos)/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
