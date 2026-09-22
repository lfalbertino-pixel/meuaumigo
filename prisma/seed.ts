/**
 * Semente de demonstração.
 *
 * O sistema vai para a mão da equipe antes de existir dado verdadeiro, e
 * painel vazio não ensina nada: ninguém entende um gráfico de
 * arrecadação olhando para zero. Então o banco nasce com 12 meses de
 * história fictícia — animais, padrinhos, consultas, despesas, campanhas.
 *
 * Duas salvaguardas:
 *   1. Se já houver QUALQUER animal cadastrado, a semente não roda. Dado
 *      de verdade nunca é sobrescrito.
 *   2. `SEMEAR_DEMONSTRACAO=false` no .env desliga de vez. É o interruptor
 *      a virar no dia em que o primeiro animal real for cadastrado.
 *
 * Os catálogos (configuração da ONG, papéis de acesso) são semeados
 * sempre, de forma idempotente — eles não são "demonstração", são o
 * mínimo para alguém conseguir entrar no sistema.
 */

import { randomBytes } from 'node:crypto';

import { PrismaClient, type Prisma } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const db = new PrismaClient();

const SEMEAR_DEMO = process.env.SEMEAR_DEMONSTRACAO !== 'false';
const HOJE = new Date();

// ----------------------------------------------------------
// Aleatoriedade determinística: a mesma semente sempre gera o mesmo
// abrigo. Sem isso, cada deploy mostraria números diferentes e ninguém
// conseguiria conferir se algo quebrou.
// ----------------------------------------------------------
let estado = 20260922;
function aleatorio(): number {
  estado = (estado * 1664525 + 1013904223) % 4294967296;
  return estado / 4294967296;
}
function inteiro(min: number, max: number): number {
  return Math.floor(aleatorio() * (max - min + 1)) + min;
}
function escolher<T>(lista: readonly T[]): T {
  return lista[Math.floor(aleatorio() * lista.length)];
}
function chance(probabilidade: number): boolean {
  return aleatorio() < probabilidade;
}
function diasAtras(dias: number): Date {
  return new Date(HOJE.getTime() - dias * 86_400_000);
}
function mesAtras(meses: number): Date {
  return new Date(HOJE.getFullYear(), HOJE.getMonth() - meses, 1);
}

function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ----------------------------------------------------------
// Vocabulário
// ----------------------------------------------------------

const NOMES_CAO = [
  'Thor', 'Mel', 'Bolt', 'Luna', 'Nina', 'Bob', 'Amora', 'Zeus', 'Cacau', 'Fiona',
  'Pretinha', 'Bilu', 'Mingau', 'Rex', 'Maya', 'Toby', 'Lola', 'Simba', 'Frida', 'Neguinho',
  'Pipoca', 'Nala', 'Chico', 'Dora', 'Bento', 'Estrela', 'Pingo', 'Jujuba', 'Caramelo', 'Aurora',
  'Bidu', 'Linda', 'Fumaça', 'Belinha', 'Zico', 'Pérola', 'Tico', 'Sasha', 'Pandora', 'Nick',
  'Malu', 'Bruce', 'Kira', 'Pepita', 'Aladin', 'Tequila', 'Vitório', 'Bolinha', 'Marley', 'Safira',
  'Bartô', 'Cachinho', 'Duque', 'Esperança', 'Fubá', 'Guri', 'Hulk', 'Índia', 'Juca', 'Kiara',
  'Lupi', 'Meg', 'Nero', 'Olívia', 'Paçoca', 'Quim', 'Rubi', 'Serena', 'Tobias', 'Uma',
  'Valente', 'Wilson', 'Xodó', 'Yuri', 'Zulu', 'Amendoim', 'Brisa', 'Café', 'Dengo', 'Elis',
];

const NOMES_GATO = [
  'Salém', 'Mia', 'Garfield', 'Cleo', 'Tigrinho', 'Branca', 'Pandora', 'Nick', 'Lili', 'Bidu',
];

const RACAS = ['SRD', 'SRD', 'SRD', 'SRD', 'Pastor misto', 'Poodle misto', 'Pinscher', 'Labrador misto', 'Vira-lata caramelo'];
const PELAGENS = ['Caramelo', 'Preta', 'Branca e preta', 'Tricolor', 'Marrom', 'Cinza', 'Branca', 'Rajada'];

const LOCAIS_RESGATE = [
  'Avenida Central', 'BR-116, km 42', 'Bairro São José', 'Feira do Produtor',
  'Rodoviária', 'Praça da Matriz', 'Estrada do Contorno', 'Beira do córrego',
  'Terreno baldio na Vila Nova', 'Porta do mercado municipal',
];

const ABRIGOS = ['Canil 1', 'Canil 2', 'Canil 3', 'Lar temporário — Dona Rita', 'Lar temporário — Marcos', 'Gatil'];

const HISTORIAS = [
  'Foi encontrado amarrado num poste, desidratado e com sarna avançada. Levou quatro meses de tratamento para o pelo voltar a nascer. Hoje é o primeiro a correr para a porta quando alguém chega.',
  'Chegou depois de um atropelamento. Perdeu o movimento de uma das patas traseiras, mas aprendeu a correr do jeito dele — e corre muito. Precisa de acompanhamento ortopédico a cada seis meses.',
  'Estava numa caixa de papelão na frente do abrigo, com mais três irmãos. Era o menor da ninhada e o único que não mamava sozinho. Sobreviveu na mamadeira, de três em três horas.',
  'Passou a vida inteira acorrentado num quintal. Quando chegou, tinha medo de grama — nunca havia pisado em uma. Levou três semanas até deitar do lado de fora do canil.',
  'Foi resgatado de uma enchente, agarrado num galho. Tem pavor de chuva forte até hoje, e nessas noites alguém da equipe dorme por perto.',
  'Foi devolvido duas vezes por famílias que desistiram. Na terceira chegada, não latiu por uma semana inteira. Hoje confia de novo, e é o mais carinhoso do canil.',
  'Apareceu mancando na porta do abrigo, sozinho, como se soubesse o caminho. Tinha um projétil de chumbinho alojado no ombro. A cirurgia foi bem.',
  'Era usado para reprodução e foi abandonada quando parou de dar cria. Chegou magra, com o corpo marcado. Está se recuperando bem e ganhou 6 kg desde então.',
  'Foi encontrado dentro de um saco de lixo, ainda filhote. O funcionário da coleta ouviu o choro. É o mais agitado da casa e o que menos para quieto para a foto.',
  'Viveu anos na rua de um bairro inteiro, alimentado por vários vizinhos. Quando adoeceu, foi a própria vizinhança que se cotizou e trouxe até aqui.',
];

const PERSONALIDADES = [
  'Calmo, se dá bem com crianças e com outros cães. Adora dormir no sol.',
  'Agitado e brincalhão. Precisa de espaço para gastar energia.',
  'Tímido no começo, mas gruda em quem conquista. Prefere ambiente tranquilo.',
  'Muito dócil, aceita colo e banho sem reclamar. Convive bem com gatos.',
  'Protetor e atento. Late para estranhos, mas nunca avançou em ninguém.',
  'Independente. Gosta de companhia, mas tem seus momentos sozinho.',
  'Brincalhão com gente, ciumento com outros cães na hora da comida.',
];

const NECESSIDADES = [
  'Cego do olho direito. Precisa de ambiente sem escadas e sem obstáculos novos.',
  'Toma medicação contínua para epilepsia. Não pode ficar sem a dose da noite.',
  'Displasia coxofemoral. Precisa de ração específica e não pode subir escada.',
  'Surdo de nascença. Responde a sinais de mão, já aprendeu quatro comandos.',
  'Cardiopata. Acompanhamento a cada três meses e nada de exercício intenso.',
  'Perdeu a pata dianteira esquerda. Se vira muito bem, mas não pode ficar em piso liso.',
];

const NOMES_PESSOA = [
  'Ana Clara Ribeiro', 'João Pedro Martins', 'Mariana Souza', 'Carlos Eduardo Lima', 'Beatriz Almeida',
  'Rafael Nogueira', 'Juliana Castro', 'Thiago Mendes', 'Patrícia Ramos', 'Lucas Ferreira',
  'Camila Barbosa', 'Bruno Carvalho', 'Fernanda Dias', 'Gustavo Pinto', 'Larissa Moreira',
  'Diego Azevedo', 'Renata Cardoso', 'Felipe Rocha', 'Aline Teixeira', 'Marcelo Duarte',
  'Vanessa Correia', 'Rodrigo Siqueira', 'Priscila Monteiro', 'André Vasconcelos', 'Tatiane Freitas',
  'Leonardo Prado', 'Cristina Vieira', 'Paulo Henrique Braga', 'Sabrina Lopes', 'Vinícius Antunes',
  'Débora Farias', 'Otávio Machado', 'Elaine Pacheco', 'Sérgio Bittencourt', 'Natália Rezende',
  'Alexandre Guimarães', 'Bianca Fontes', 'Murilo Andrade', 'Letícia Sampaio', 'Fábio Queiroz',
  'Simone Barros', 'Eduardo Tavares', 'Carolina Peixoto', 'Ricardo Bastos', 'Gabriela Nunes',
  'Henrique Soares', 'Michele Aragão', 'Danilo Fonseca', 'Rosana Leite', 'Igor Bandeira',
];

const SOBRENOMES = ['Silva', 'Santos', 'Oliveira', 'Costa', 'Pereira', 'Gomes', 'Melo', 'Reis', 'Cunha', 'Batista'];
const PRENOMES = ['Alice', 'Miguel', 'Helena', 'Arthur', 'Laura', 'Heitor', 'Manuela', 'Theo', 'Valentina', 'Davi',
  'Sophia', 'Gabriel', 'Isabella', 'Bernardo', 'Júlia', 'Samuel', 'Heloísa', 'Pedro', 'Maria Luiza', 'Lorenzo',
  'Cecília', 'Benício', 'Eloá', 'Matheus', 'Giovanna', 'Nicolas', 'Antonella', 'Enzo', 'Rafaela', 'Joaquim'];

const CIDADES = [
  ['Governador Valadares', 'MG'], ['Ipatinga', 'MG'], ['Belo Horizonte', 'MG'], ['Teófilo Otoni', 'MG'],
  ['Caratinga', 'MG'], ['Vitória', 'ES'], ['Colatina', 'ES'], ['São Paulo', 'SP'], ['Rio de Janeiro', 'RJ'],
];

const FORNECEDORES_RACAO = ['AgroPet Distribuidora', 'Casa do Fazendeiro', 'PetShop Amigo Fiel', 'Atacadão Animal'];
const CLINICAS = ['Clínica VetVida', 'Hospital Veterinário Pata Amiga', 'Clínica São Francisco'];

// ----------------------------------------------------------

async function main() {
  console.log('→ Semeando catálogos base...');

  await db.configuracaoOng.upsert({
    where: { id: 'unica' },
    create: {
      id: 'unica',
      nome: 'Meu AUmigo',
      cnpj: '12.345.678/0001-90',
      email: 'contato@meuaumigo.com.br',
      telefone: '(33) 3271-0000',
      whatsapp: '(33) 99999-0000',
      cidade: 'Governador Valadares',
      estado: 'MG',
      sobre:
        'Somos uma ONG de resgate, tratamento e adoção de animais abandonados. Cada animal que chega aqui tem nome, história e uma conta que precisa fechar todo mês — e é isso que o apadrinhamento sustenta.',
      chavePix: 'contato@meuaumigo.com.br',
      instagram: '@meuaumigo',
      frase: 'Você apadrinha. A gente cuida. E um AUmigo ganha uma nova chance.',
    },
    update: {},
  });

  // A senha dos acessos de demonstração NUNCA é literal no código: este
  // repositório é público, e uma senha de admin versionada é uma senha de
  // admin publicada. Vem do ambiente; sem ela, é sorteada e impressa no log
  // do boot — quem subiu o container consegue lê-la, mais ninguém.
  const senhaDemo = process.env.SENHA_DEMO?.trim() || randomBytes(9).toString('base64url');
  const senhaSorteada = !process.env.SENHA_DEMO?.trim();
  const senhaPadrao = await hash(senhaDemo, { memoryCost: 19456, timeCost: 2, parallelism: 1 });

  const equipe = [
    { nome: 'Direção Meu AUmigo', email: 'admin@meuaumigo.com.br', papel: 'ADMIN' as const },
    { nome: 'Rita Campos', email: 'rita@meuaumigo.com.br', papel: 'EQUIPE' as const },
    { nome: 'Dra. Helena Prado', email: 'helena@meuaumigo.com.br', papel: 'VETERINARIO' as const },
  ];

  for (const u of equipe) {
    await db.usuario.upsert({
      where: { email: u.email },
      create: { ...u, senhaHash: senhaPadrao },
      update: {},
    });
  }

  const admin = await db.usuario.findUniqueOrThrow({ where: { email: 'admin@meuaumigo.com.br' } });

  if (!SEMEAR_DEMO) {
    console.log('  SEMEAR_DEMONSTRACAO=false — parando nos catálogos base.');
    if (senhaSorteada) console.log(`  Senha dos acessos criados agora: ${senhaDemo}`);
    return;
  }

  const jaTemAnimal = await db.animal.count();
  if (jaTemAnimal > 0) {
    console.log(`  já existem ${jaTemAnimal} animais cadastrados — a demonstração não roda.`);
    return;
  }

  console.log('→ Semeando demonstração (12 meses de história fictícia)...');

  // ---------- Veterinários ----------
  const veterinarios = await Promise.all(
    [
      { nome: 'Dra. Helena Prado', crmv: 'CRMV-MG 12345', clinica: CLINICAS[0], telefone: '(33) 3271-1111' },
      { nome: 'Dr. Marcos Vinícius Reis', crmv: 'CRMV-MG 23456', clinica: CLINICAS[1], telefone: '(33) 3271-2222' },
      { nome: 'Dra. Beatriz Nunes', crmv: 'CRMV-MG 34567', clinica: CLINICAS[2], telefone: '(33) 3271-3333' },
    ].map((v) => db.veterinario.create({ data: v })),
  );

  // ---------- Animais ----------
  const TOTAL_ANIMAIS = 96;
  const slugs = new Set<string>();
  const animaisCriados: { id: string; nome: string; slug: string; resgate: Date; status: string }[] = [];

  for (let i = 0; i < TOTAL_ANIMAIS; i++) {
    const felino = chance(0.12);
    const base = felino ? escolher(NOMES_GATO) : escolher(NOMES_CAO);

    let slug = slugificar(base);
    let sufixo = 2;
    while (slugs.has(slug)) slug = `${slugificar(base)}-${sufixo++}`;
    slugs.add(slug);

    // A maioria chegou nos últimos dois anos; alguns são moradores antigos.
    const diasDeCasa = chance(0.25) ? inteiro(380, 1100) : inteiro(20, 370);
    const resgate = diasAtras(diasDeCasa);

    // Distribuição do destino: a maior parte segue em tratamento ou
    // esperando adoção; uma fatia já encontrou família.
    const sorte = aleatorio();
    const status =
      sorte < 0.06
        ? 'ADOTADO'
        : sorte < 0.09
          ? 'EM_PROCESSO_ADOCAO'
          : sorte < 0.14
            ? 'INDISPONIVEL'
            : sorte < 0.55
              ? 'DISPONIVEL_ADOCAO'
              : 'EM_TRATAMENTO';

    const porte = felino ? 'PEQUENO' : escolher(['PEQUENO', 'MEDIO', 'MEDIO', 'GRANDE'] as const);
    const especial = chance(0.14);
    const filhote = chance(0.18);

    const custoAlimentacao = porte === 'GRANDE' ? inteiro(180, 260) : porte === 'MEDIO' ? inteiro(120, 190) : inteiro(80, 140);
    const custoTratamento = especial ? inteiro(220, 420) : inteiro(60, 240);
    const custoMedicamento = especial ? inteiro(80, 190) : inteiro(0, 90);

    const animal = await db.animal.create({
      data: {
        slug,
        nome: base,
        especie: felino ? 'FELINA' : 'CANINA',
        sexo: chance(0.5) ? 'MACHO' : 'FEMEA',
        porte,
        raca: felino ? 'SRD' : escolher(RACAS),
        pelagem: escolher(PELAGENS),
        dataNascimento: chance(0.35)
          ? diasAtras(filhote ? inteiro(90, 330) : inteiro(400, 3600))
          : null,
        idadeAproximada: filhote
          ? `${inteiro(3, 10)} meses`
          : `${inteiro(1, 11)} anos`,
        dataResgate: resgate,
        localResgate: escolher(LOCAIS_RESGATE),
        historiaResgate: escolher(HISTORIAS),
        personalidade: escolher(PERSONALIDADES),
        castrado: chance(0.72),
        vacinasEmDia: chance(0.78),
        necessidadeEspecial: especial,
        descricaoNecessidade: especial ? escolher(NECESSIDADES) : null,
        status,
        localAbrigo: felino ? 'Gatil' : escolher(ABRIGOS),
        pesoAtualKg: porte === 'GRANDE' ? inteiro(22, 38) : porte === 'MEDIO' ? inteiro(11, 21) : inteiro(3, 10),
        custoAlimentacao,
        custoTratamento,
        custoMedicamento,
        destaque: chance(0.08),
        ativo: status !== 'ADOTADO',
      },
    });

    animaisCriados.push({ id: animal.id, nome: animal.nome, slug, resgate, status });

    await db.eventoDiario.create({
      data: {
        animalId: animal.id,
        tipo: 'RESGATE',
        data: resgate,
        titulo: `${animal.nome} foi resgatado.`,
        descricao: `Resgatado em ${animal.localResgate}.`,
        automatico: true,
        autorId: admin.id,
      },
    });
  }
  console.log(`  ${animaisCriados.length} animais`);

  // ---------- Saúde ----------
  const registrosSaude: Prisma.RegistroSaudeCreateManyInput[] = [];
  const despesas: Prisma.DespesaCreateManyInput[] = [];
  const eventos: Prisma.EventoDiarioCreateManyInput[] = [];

  for (const a of animaisCriados) {
    const diasDeCasa = Math.floor((HOJE.getTime() - a.resgate.getTime()) / 86_400_000);

    // Primeira consulta: sempre nos primeiros dias.
    const primeira = new Date(a.resgate.getTime() + inteiro(1, 5) * 86_400_000);
    registrosSaude.push({
      animalId: a.id,
      tipo: 'CONSULTA',
      data: primeira,
      titulo: 'Primeira consulta veterinária',
      descricao: 'Avaliação geral de entrada, exame clínico e triagem.',
      valor: inteiro(120, 220),
      veterinarioId: escolher(veterinarios).id,
    });
    eventos.push({
      animalId: a.id,
      tipo: 'CONSULTA',
      data: primeira,
      titulo: 'Primeira consulta veterinária.',
      automatico: true,
    });

    // Vacinas
    const doses = Math.min(3, Math.max(1, Math.floor(diasDeCasa / 120)));
    for (let d = 0; d < doses; d++) {
      const data = new Date(a.resgate.getTime() + (10 + d * 30) * 86_400_000);
      if (data > HOJE) break;
      registrosSaude.push({
        animalId: a.id,
        tipo: 'VACINA',
        data,
        titulo: d === 0 ? 'V10 — primeira dose' : d === 1 ? 'V10 — reforço' : 'Antirrábica',
        valor: inteiro(70, 130),
        proximaData: d === doses - 1 ? new Date(data.getTime() + 365 * 86_400_000) : null,
        veterinarioId: escolher(veterinarios).id,
      });
    }

    if (chance(0.7)) {
      const data = new Date(a.resgate.getTime() + inteiro(20, 90) * 86_400_000);
      if (data < HOJE) {
        registrosSaude.push({
          animalId: a.id,
          tipo: 'CASTRACAO',
          data,
          titulo: 'Castração',
          valor: inteiro(280, 520),
          veterinarioId: escolher(veterinarios).id,
        });
        eventos.push({
          animalId: a.id,
          tipo: 'CASTRACAO',
          data,
          titulo: `${a.nome} foi castrado.`,
          automatico: true,
        });
      }
    }

    // Vermífugo e pesagens ao longo do tempo
    for (let m = 0; m < Math.min(12, Math.floor(diasDeCasa / 45)); m++) {
      const data = diasAtras(inteiro(1, Math.min(diasDeCasa, 360)));
      if (chance(0.5)) {
        registrosSaude.push({
          animalId: a.id,
          tipo: 'VERMIFUGO',
          data,
          titulo: 'Vermifugação de rotina',
          valor: inteiro(25, 60),
        });
      } else {
        registrosSaude.push({
          animalId: a.id,
          tipo: 'PESAGEM',
          data,
          titulo: 'Pesagem de acompanhamento',
          pesoKg: inteiro(4, 36),
        });
      }
    }

    // Tratamento em curso para quem está em tratamento
    if (a.status === 'EM_TRATAMENTO') {
      const inicio = diasAtras(inteiro(10, 70));
      registrosSaude.push({
        animalId: a.id,
        tipo: 'MEDICAMENTO',
        data: inicio,
        titulo: escolher([
          'Início do tratamento para sarna',
          'Antibiótico pós-cirúrgico',
          'Tratamento de otite',
          'Medicação para leishmaniose',
          'Anti-inflamatório para a pata',
        ]),
        medicamento: escolher(['Ivermectina', 'Amoxicilina', 'Meloxicam', 'Doxiciclina']),
        dosagem: escolher(['1 comprimido a cada 12h', '1 comprimido ao dia', '0,5 mL a cada 24h']),
        valor: inteiro(60, 320),
        proximaData: new Date(HOJE.getTime() + inteiro(3, 40) * 86_400_000),
        veterinarioId: escolher(veterinarios).id,
      });
      eventos.push({
        animalId: a.id,
        tipo: 'TRATAMENTO',
        data: inicio,
        titulo: 'Início do tratamento.',
        automatico: false,
      });

      if (chance(0.6)) {
        eventos.push({
          animalId: a.id,
          tipo: 'MELHORA',
          data: diasAtras(inteiro(1, 9)),
          titulo: 'Primeira melhora!',
          descricao: `${a.nome} está reagindo bem ao tratamento e recuperou o apetite.`,
        });
      }
    }

    // Cirurgia cara em poucos animais — é o que justifica campanha.
    if (chance(0.07)) {
      const data = diasAtras(inteiro(5, 200));
      registrosSaude.push({
        animalId: a.id,
        tipo: 'CIRURGIA',
        data,
        titulo: escolher([
          'Cirurgia ortopédica — fêmur',
          'Remoção de tumor mamário',
          'Cirurgia de hérnia',
          'Correção de fratura na bacia',
        ]),
        valor: inteiro(1200, 3800),
        veterinarioId: escolher(veterinarios).id,
      });
    }

    // Passeios e fotos, para o diário não ser só clínico.
    for (let p = 0; p < inteiro(1, 4); p++) {
      eventos.push({
        animalId: a.id,
        tipo: escolher(['PASSEIO', 'MELHORA', 'OUTRO'] as const),
        data: diasAtras(inteiro(1, Math.max(2, Math.min(diasDeCasa, 300)))),
        titulo: escolher([
          'Primeiro passeio fora do canil.',
          'Ganhou peso e está com o pelo brilhando.',
          'Aprendeu a dar a pata.',
          'Fez amizade com a turma do canil 2.',
          'Tomou o primeiro banho sem se estressar.',
          'Dormiu a noite inteira do lado de fora, no sol da manhã.',
        ]),
      });
    }
  }

  await db.registroSaude.createMany({ data: registrosSaude });
  await db.eventoDiario.createMany({ data: eventos });
  console.log(`  ${registrosSaude.length} registros de saúde, ${eventos.length} eventos de diário`);

  // Despesa espelhando cada registro clínico com valor.
  const salvos = await db.registroSaude.findMany({
    where: { valor: { not: null } },
    select: { id: true, animalId: true, tipo: true, titulo: true, valor: true, data: true },
  });
  for (const r of salvos) {
    despesas.push({
      categoria: r.tipo === 'MEDICAMENTO' || r.tipo === 'VACINA' ? 'MEDICAMENTO' : 'VETERINARIO',
      animalId: r.animalId,
      descricao: r.titulo,
      valor: r.valor!,
      data: r.data,
      fornecedor: escolher(CLINICAS),
      registroSaudeId: r.id,
    });
  }

  // ---------- Padrinhos ----------
  const padrinhosDados: Prisma.PadrinhoCreateManyInput[] = [];
  const emails = new Set<string>();

  for (let i = 0; i < 148; i++) {
    const nome =
      i < NOMES_PESSOA.length ? NOMES_PESSOA[i] : `${escolher(PRENOMES)} ${escolher(SOBRENOMES)}`;
    let email = `${slugificar(nome).replace(/-/g, '.')}@exemplo.com.br`;
    let n = 2;
    while (emails.has(email)) email = `${slugificar(nome).replace(/-/g, '.')}${n++}@exemplo.com.br`;
    emails.add(email);

    const [cidade, estado] = escolher(CIDADES);
    padrinhosDados.push({
      nome,
      email,
      telefone: `(${inteiro(11, 38)}) 9${inteiro(1000, 9999)}-${inteiro(1000, 9999)}`,
      cidade,
      estado,
      desde: diasAtras(inteiro(10, 760)),
      aceitaNotificacao: chance(0.88),
      perfilPublico: chance(0.45),
    });
  }

  await db.padrinho.createMany({ data: padrinhosDados });
  const padrinhos = await db.padrinho.findMany({ select: { id: true, nome: true, email: true, desde: true } });
  console.log(`  ${padrinhos.length} padrinhos`);

  // Um padrinho com login, para a equipe conhecer a área do padrinho.
  const demo = padrinhos[0];
  const usuarioPadrinho = await db.usuario.upsert({
    where: { email: 'padrinho@meuaumigo.com.br' },
    create: {
      nome: demo.nome,
      email: 'padrinho@meuaumigo.com.br',
      senhaHash: senhaPadrao,
      papel: 'PADRINHO',
    },
    update: {},
  });
  await db.padrinho.update({ where: { id: demo.id }, data: { usuarioId: usuarioPadrinho.id } });

  // ---------- Apadrinhamentos ----------
  const elegiveis = animaisCriados.filter((a) => a.status !== 'ADOTADO');
  const apadrinhamentosDados: Prisma.ApadrinhamentoCreateManyInput[] = [];
  const VALORES = { ALIMENTACAO: 30, CUIDADOS: 50, COMPLETO: 100 } as const;

  for (const p of padrinhos) {
    // Um terço apadrinha mais de um animal — é o comportamento real, e é
    // o que dá sentido à conquista "AUmigo de vários animais".
    const quantos = chance(0.3) ? inteiro(2, 3) : 1;
    const jaEscolhidos = new Set<string>();

    for (let k = 0; k < quantos; k++) {
      const animal = escolher(elegiveis);
      if (jaEscolhidos.has(animal.id)) continue;
      jaEscolhidos.add(animal.id);

      const modalidade = escolher(['ALIMENTACAO', 'CUIDADOS', 'COMPLETO', 'COMPLETO', 'PERSONALIZADO'] as const);
      const valorMensal =
        modalidade === 'PERSONALIZADO' ? inteiro(4, 30) * 10 : VALORES[modalidade];

      // Início nunca antes do resgate do animal nem do cadastro do padrinho.
      const maisCedo = Math.max(animal.resgate.getTime(), p.desde.getTime());
      const inicio = new Date(maisCedo + inteiro(0, 30) * 86_400_000);
      if (inicio > HOJE) continue;

      // ~12% cancelam. É a taxa que faz o gráfico de retenção ter o que
      // mostrar — um sistema com 0% de cancelamento não ensina nada.
      const cancelou = chance(0.12);
      const pausou = !cancelou && chance(0.04);

      apadrinhamentosDados.push({
        padrinhoId: p.id,
        animalId: animal.id,
        modalidade,
        valorMensal,
        status: cancelou ? 'CANCELADO' : pausou ? 'PAUSADO' : 'ATIVO',
        inicio,
        fim: cancelou ? new Date(inicio.getTime() + inteiro(60, 400) * 86_400_000) : null,
        motivoCancelamento: cancelou
          ? escolher([
              'Dificuldade financeira.',
              'Animal foi adotado.',
              'Sem retorno após três tentativas de contato.',
              'Passou a apadrinhar outro animal.',
            ])
          : null,
        diaVencimento: escolher([5, 10, 10, 15, 20]),
        exibirNoPerfil: chance(0.75),
      });
    }
  }

  // Cancelamento com data futura não existe.
  for (const a of apadrinhamentosDados) {
    if (a.fim && new Date(a.fim as Date) > HOJE) a.fim = diasAtras(inteiro(1, 60));
  }

  await db.apadrinhamento.createMany({ data: apadrinhamentosDados });
  const apadrinhamentos = await db.apadrinhamento.findMany({
    select: { id: true, padrinhoId: true, animalId: true, valorMensal: true, status: true, inicio: true, fim: true, diaVencimento: true },
  });
  console.log(`  ${apadrinhamentos.length} apadrinhamentos`);

  // O primeiro apadrinhamento de cada animal vira evento do diário.
  const primeiroPorAnimal = new Map<string, Date>();
  for (const a of apadrinhamentos) {
    const atual = primeiroPorAnimal.get(a.animalId);
    if (!atual || a.inicio < atual) primeiroPorAnimal.set(a.animalId, a.inicio);
  }
  await db.eventoDiario.createMany({
    data: [...primeiroPorAnimal.entries()].map(([animalId, data]) => ({
      animalId,
      tipo: 'APADRINHAMENTO' as const,
      data,
      titulo: `${animaisCriados.find((x) => x.id === animalId)?.nome ?? 'Ele'} ganhou seu primeiro padrinho!`,
      automatico: true,
    })),
  });

  // ---------- Contribuições: 12 meses ----------
  const contribuicoes: Prisma.ContribuicaoCreateManyInput[] = [];

  for (let m = 11; m >= 0; m--) {
    const competencia = mesAtras(m);
    const proximo = new Date(competencia.getFullYear(), competencia.getMonth() + 1, 1);

    for (const a of apadrinhamentos) {
      if (a.inicio >= proximo) continue;
      if (a.fim && a.fim < competencia) continue;
      if (a.status === 'PAUSADO' && m < 2) continue;

      const vencimento = new Date(competencia.getFullYear(), competencia.getMonth(), a.diaVencimento);
      const ehMesCorrente = m === 0;

      // Inadimplência real: ~9% não pagam. No mês corrente, boa parte
      // ainda está pendente — é o que a tela de financeiro precisa mostrar.
      const naoPagou = chance(0.09);
      const status = ehMesCorrente
        ? chance(0.62)
          ? 'PAGA'
          : vencimento < HOJE
            ? 'ATRASADA'
            : 'PENDENTE'
        : naoPagou
          ? 'ATRASADA'
          : 'PAGA';

      contribuicoes.push({
        origem: 'APADRINHAMENTO',
        apadrinhamentoId: a.id,
        padrinhoId: a.padrinhoId,
        animalId: a.animalId,
        valor: a.valorMensal,
        status,
        metodo: status === 'PAGA' ? escolher(['PIX', 'PIX', 'PIX', 'CARTAO', 'TRANSFERENCIA'] as const) : null,
        competencia,
        vencimento,
        pagoEm:
          status === 'PAGA'
            ? new Date(vencimento.getTime() + inteiro(-4, 6) * 86_400_000)
            : null,
      });
    }

    // Doações avulsas
    for (let d = 0; d < inteiro(2, 9); d++) {
      const anonima = chance(0.3);
      contribuicoes.push({
        origem: 'DOACAO_AVULSA',
        animalId: chance(0.5) ? escolher(elegiveis).id : null,
        valor: escolher([20, 30, 50, 50, 100, 150, 200, 500]),
        status: 'PAGA',
        metodo: 'PIX',
        competencia,
        pagoEm: new Date(competencia.getTime() + inteiro(0, 27) * 86_400_000),
        anonima,
        nomeDoador: anonima ? null : `${escolher(PRENOMES)} ${escolher(SOBRENOMES)}`,
      });
    }
  }

  await db.contribuicao.createMany({ data: contribuicoes });
  console.log(`  ${contribuicoes.length} contribuições`);

  // ---------- Estoque ----------
  const itens = await Promise.all(
    [
      { nome: 'Ração adulto premium', tipo: 'RACAO' as const, unidade: 'kg', minimo: 120 },
      { nome: 'Ração filhote', tipo: 'RACAO' as const, unidade: 'kg', minimo: 40 },
      { nome: 'Ração medicamentosa renal', tipo: 'RACAO' as const, unidade: 'kg', minimo: 15 },
      { nome: 'Vermífugo (comprimido)', tipo: 'MEDICAMENTO' as const, unidade: 'un', minimo: 50 },
      { nome: 'Antipulgas', tipo: 'MEDICAMENTO' as const, unidade: 'un', minimo: 30 },
      { nome: 'Shampoo medicinal', tipo: 'HIGIENE' as const, unidade: 'L', minimo: 5 },
    ].map((i) => db.itemEstoque.create({ data: i })),
  );

  const movimentos: Prisma.MovimentoEstoqueCreateManyInput[] = [];
  const saldos = new Map<string, number>(itens.map((i) => [i.id, 0]));

  for (let m = 11; m >= 0; m--) {
    const base = mesAtras(m);
    for (const item of itens) {
      const ehRacao = item.tipo === 'RACAO';
      const compra = ehRacao ? inteiro(60, 320) : inteiro(20, 90);
      const precoUnitario = ehRacao ? inteiro(6, 13) : inteiro(8, 30);

      movimentos.push({
        itemId: item.id,
        tipo: 'ENTRADA',
        quantidade: compra,
        valor: compra * precoUnitario,
        fornecedor: escolher(FORNECEDORES_RACAO),
        data: new Date(base.getFullYear(), base.getMonth(), inteiro(2, 8)),
      });
      saldos.set(item.id, (saldos.get(item.id) ?? 0) + compra);

      despesas.push({
        categoria: ehRacao ? 'ALIMENTACAO' : item.tipo === 'MEDICAMENTO' ? 'MEDICAMENTO' : 'HIGIENE',
        descricao: `${item.nome} — ${compra} ${item.unidade}`,
        valor: compra * precoUnitario,
        data: new Date(base.getFullYear(), base.getMonth(), inteiro(2, 8)),
        fornecedor: escolher(FORNECEDORES_RACAO),
      });

      // Saídas semanais, sempre abaixo do saldo.
      for (let s = 0; s < 4; s++) {
        const disponivel = saldos.get(item.id) ?? 0;
        const saida = Math.min(disponivel, ehRacao ? inteiro(20, 80) : inteiro(4, 20));
        if (saida <= 0) continue;
        movimentos.push({
          itemId: item.id,
          tipo: 'SAIDA',
          quantidade: saida,
          data: new Date(base.getFullYear(), base.getMonth(), 5 + s * 6),
          observacao: 'Consumo do abrigo',
        });
        saldos.set(item.id, disponivel - saida);
      }
    }
  }

  await db.movimentoEstoque.createMany({
    data: movimentos.filter((m) => new Date(m.data as Date) <= HOJE),
  });
  for (const [itemId, saldo] of saldos) {
    await db.itemEstoque.update({ where: { id: itemId }, data: { saldo: Math.max(0, saldo) } });
  }
  console.log(`  ${movimentos.length} movimentos de estoque`);

  // ---------- Despesas de estrutura ----------
  for (let m = 11; m >= 0; m--) {
    const base = mesAtras(m);
    despesas.push(
      {
        categoria: 'ESTRUTURA',
        descricao: 'Aluguel do galpão',
        valor: 1800,
        data: new Date(base.getFullYear(), base.getMonth(), 5),
        fornecedor: 'Imobiliária Central',
      },
      {
        categoria: 'ESTRUTURA',
        descricao: 'Energia elétrica e água',
        valor: inteiro(420, 780),
        data: new Date(base.getFullYear(), base.getMonth(), 12),
      },
      {
        categoria: 'TRANSPORTE',
        descricao: 'Combustível — transporte para consultas',
        valor: inteiro(180, 460),
        data: new Date(base.getFullYear(), base.getMonth(), inteiro(10, 25)),
      },
    );
  }

  await db.despesa.createMany({
    data: despesas.filter((d) => new Date(d.data as Date) <= HOJE),
  });
  const despesasSalvas = await db.despesa.count();
  console.log(`  ${despesasSalvas} despesas`);

  // ---------- Comprovantes (metadados; o arquivo é anexado pela equipe) ----------
  const paraComprovar = await db.despesa.findMany({
    where: { categoria: { in: ['ALIMENTACAO', 'VETERINARIO'] } },
    orderBy: { data: 'desc' },
    take: 10,
    select: { id: true, descricao: true, categoria: true },
  });
  await db.comprovante.createMany({
    data: paraComprovar.map((d) => ({
      despesaId: d.id,
      tipo: d.categoria === 'ALIMENTACAO' ? ('NOTA_FISCAL' as const) : ('RECIBO' as const),
      titulo: d.descricao,
      // Arquivo fictício: o endpoint devolve 404 e a página segue inteira.
      // É de propósito — comprovante de mentira não deve abrir como se
      // fosse documento de verdade.
      arquivo: `demonstracao-${d.id}.pdf`,
      mimeType: 'application/pdf',
      bytes: 0,
      publico: true,
    })),
  });

  // ---------- Campanhas ----------
  const paraCampanha = elegiveis.filter((a) => a.status === 'EM_TRATAMENTO').slice(0, 3);
  const campanhas = [
    {
      titulo: `AJUDE O ${(paraCampanha[0]?.nome ?? 'BOLT').toUpperCase()}`,
      animalId: paraCampanha[0]?.id,
      resumo: `O ${paraCampanha[0]?.nome ?? 'Bolt'} precisa realizar uma cirurgia ortopédica de urgência.`,
      texto:
        'A fratura não consolidou sozinha e a única saída é a cirurgia, com placa e parafusos. O orçamento inclui o procedimento, a internação de dois dias e as sessões de fisioterapia que vêm depois.\n\nCada real aqui vira mobilidade de volta.',
      meta: 3500,
      arrecadado: 2380,
      urgente: true,
      status: 'ATIVA' as const,
    },
    {
      titulo: 'INVERNO SEM FRIO — CAMAS E COBERTORES',
      animalId: null,
      resumo: 'Precisamos trocar 40 camas do canil antes das noites de junho.',
      texto:
        'As camas atuais estão encharcando e mofando. Queremos substituir por camas elevadas, que secam rápido e duram anos.',
      meta: 2800,
      arrecadado: 2800,
      urgente: false,
      status: 'CONCLUIDA' as const,
    },
    {
      titulo: `TRATAMENTO DA ${(paraCampanha[1]?.nome ?? 'MEL').toUpperCase()}`,
      animalId: paraCampanha[1]?.id,
      resumo: `A ${paraCampanha[1]?.nome ?? 'Mel'} começou o protocolo de leishmaniose e precisa de seis meses de medicação.`,
      texto: 'O protocolo completo custa caro e não pode ser interrompido no meio.',
      meta: 2200,
      arrecadado: 760,
      urgente: false,
      status: 'ATIVA' as const,
    },
  ];

  for (const c of campanhas) {
    const campanha = await db.campanha.create({
      data: {
        slug: slugificar(c.titulo),
        titulo: c.titulo,
        animalId: c.animalId,
        resumo: c.resumo,
        texto: c.texto,
        meta: c.meta,
        prazo: c.status === 'ATIVA' ? new Date(HOJE.getTime() + inteiro(20, 60) * 86_400_000) : null,
        urgente: c.urgente,
        status: c.status,
        encerradaEm: c.status === 'CONCLUIDA' ? diasAtras(inteiro(30, 90)) : null,
      },
    });

    // Quebra o arrecadado em doações de tamanhos variados, até fechar.
    let restante = c.arrecadado;
    const doacoes: Prisma.ContribuicaoCreateManyInput[] = [];
    while (restante > 0) {
      const valor = Math.min(restante, escolher([20, 30, 50, 50, 100, 100, 200, 300]));
      const anonima = chance(0.25);
      doacoes.push({
        origem: 'CAMPANHA',
        campanhaId: campanha.id,
        animalId: c.animalId,
        padrinhoId: chance(0.4) ? escolher(padrinhos).id : null,
        valor,
        status: 'PAGA',
        metodo: 'PIX',
        competencia: mesAtras(inteiro(0, 2)),
        pagoEm: diasAtras(inteiro(1, 70)),
        anonima,
        nomeDoador: anonima ? null : `${escolher(PRENOMES)} ${escolher(SOBRENOMES)}`,
      });
      restante -= valor;
    }
    await db.contribuicao.createMany({ data: doacoes });
  }
  console.log(`  ${campanhas.length} campanhas`);

  // ---------- Adoções ----------
  const adotados = animaisCriados.filter((a) => a.status === 'ADOTADO');
  const emProcesso = animaisCriados.filter((a) => a.status === 'EM_PROCESSO_ADOCAO');
  const disponiveis = animaisCriados.filter((a) => a.status === 'DISPONIVEL_ADOCAO').slice(0, 6);

  const adocoes: Prisma.AdocaoCreateManyInput[] = [
    ...adotados.map((a) => ({
      animalId: a.id,
      status: 'CONCLUIDA' as const,
      adotanteNome: `${escolher(PRENOMES)} ${escolher(SOBRENOMES)}`,
      adotanteEmail: 'adotante@exemplo.com.br',
      adotanteTelefone: `(33) 9${inteiro(1000, 9999)}-${inteiro(1000, 9999)}`,
      adotanteCidade: escolher(CIDADES)[0],
      abertaEm: diasAtras(inteiro(60, 300)),
      concluidaEm: diasAtras(inteiro(10, 55)),
      respostas: { moradia: 'Casa com quintal fechado', outrosAnimais: 'Não', rotina: 'Trabalho em casa.' },
    })),
    ...emProcesso.map((a) => ({
      animalId: a.id,
      status: escolher(['ENTREVISTA', 'VISITA', 'APROVADA'] as const),
      adotanteNome: `${escolher(PRENOMES)} ${escolher(SOBRENOMES)}`,
      adotanteEmail: 'interessado@exemplo.com.br',
      adotanteTelefone: `(33) 9${inteiro(1000, 9999)}-${inteiro(1000, 9999)}`,
      adotanteCidade: escolher(CIDADES)[0],
      abertaEm: diasAtras(inteiro(5, 40)),
      respostas: {
        moradia: escolher(['Apartamento com tela', 'Casa com quintal fechado', 'Sítio ou chácara']),
        outrosAnimais: escolher(['Não', 'Uma gata castrada', 'Dois cães de porte pequeno']),
        rotina: 'Saio 8h e volto 18h; tem alguém em casa à tarde.',
      },
    })),
    ...disponiveis.slice(0, 4).map((a) => ({
      animalId: a.id,
      status: 'INTERESSE' as const,
      adotanteNome: `${escolher(PRENOMES)} ${escolher(SOBRENOMES)}`,
      adotanteEmail: 'interessado@exemplo.com.br',
      adotanteTelefone: `(33) 9${inteiro(1000, 9999)}-${inteiro(1000, 9999)}`,
      adotanteCidade: escolher(CIDADES)[0],
      abertaEm: diasAtras(inteiro(1, 12)),
      respostas: { moradia: 'Casa sem quintal', outrosAnimais: 'Não', rotina: 'Moro sozinho, trabalho híbrido.' },
    })),
  ];

  await db.adocao.createMany({ data: adocoes });
  console.log(`  ${adocoes.length} processos de adoção`);

  // ---------- Atualizações e notificações ----------
  const comPadrinho = await db.animal.findMany({
    where: { apadrinhamentos: { some: { status: 'ATIVO' } } },
    select: {
      id: true,
      nome: true,
      slug: true,
      apadrinhamentos: { where: { status: 'ATIVO' }, select: { padrinhoId: true } },
    },
    take: 60,
  });

  const notificacoes: Prisma.NotificacaoCreateManyInput[] = [];

  for (const animal of comPadrinho) {
    const quantas = inteiro(1, 3);
    for (let i = 0; i < quantas; i++) {
      const criadaEm = diasAtras(inteiro(1, 120));
      const titulo = escolher([
        `${animal.nome} está bem!`,
        `Novidade sobre o ${animal.nome}`,
        `${animal.nome} passou por consulta`,
        `${animal.nome} ganhou peso`,
      ]);
      const texto = escolher([
        `O ${animal.nome} ganhou peso e está respondendo bem ao tratamento. A veterinária liberou os passeios curtos.`,
        `Hoje o ${animal.nome} passou por consulta de acompanhamento e está se recuperando bem. ❤️`,
        `O ${animal.nome} anda mais confiante: já dorme do lado de fora e aceita colo de quem chega.`,
        `Semana boa por aqui. O ${animal.nome} terminou o ciclo de medicação e os exames vieram limpos.`,
      ]);

      await db.atualizacaoAnimal.create({
        data: { animalId: animal.id, titulo, texto, publica: chance(0.4), criadaEm, autorId: admin.id },
      });

      if (i === 0) {
        for (const a of animal.apadrinhamentos) {
          notificacoes.push({
            padrinhoId: a.padrinhoId,
            animalId: animal.id,
            tipo: 'ATUALIZACAO_ANIMAL',
            titulo: `Novidade sobre o ${animal.nome}! 🐶`,
            corpo: titulo,
            link: `/meus-aumigos/${animal.slug}`,
            criadaEm,
            lidaEm: chance(0.5) ? new Date(criadaEm.getTime() + 86_400_000) : null,
          });
        }
      }
    }
  }

  await db.notificacao.createMany({ data: notificacoes });
  console.log(`  ${notificacoes.length} notificações`);

  console.log('\n✓ Demonstração pronta.');
  console.log('  admin@meuaumigo.com.br     (direção)');
  console.log('  rita@meuaumigo.com.br      (equipe)');
  console.log('  padrinho@meuaumigo.com.br  (área do padrinho)');
  console.log(
    senhaSorteada
      ? `\n  Senha sorteada para os três: ${senhaDemo}\n  Anote agora — ela não é gravada em lugar nenhum e não se repete.`
      : '\n  Senha dos três: a definida em SENHA_DEMO.',
  );
  console.log('  Troque essas senhas antes de expor o sistema.');
}

main()
  .catch((erro) => {
    console.error('[seed] falhou:', erro);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
