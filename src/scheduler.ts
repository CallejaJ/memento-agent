import { Api } from 'grammy';
import { logger } from './logger.js';

const QUIZ_THREAD_ID = parseInt(process.env.TELEGRAM_QUIZ_THREAD_ID ?? '7');
const GENERAL_THREAD_ID = 1;
const NEWS_THREAD_ID = 4;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? '';

const quizzes = [
  { question: 'Que significa DeFi?', options: ['A) Digital Finance', 'B) Finanzas Descentralizadas', 'C) Distributed Fees', 'D) Direct Funding'], answer: 'b', explanation: 'DeFi son servicios financieros descentralizados sobre blockchain, sin bancos ni intermediarios. Aprende mas en el curso defi-deep-dive.' },
  { question: 'Cuantos Bitcoin hay como maximo?', options: ['A) 100 millones', 'B) 1 billon', 'C) 21 millones', 'D) Infinitos'], answer: 'c', explanation: 'Bitcoin tiene un suministro maximo de 21 millones de monedas, lo que lo hace deflacionario por diseno.' },
  { question: 'Que es una CBDC?', options: ['A) Una criptomoneda privada', 'B) Moneda digital de banco central', 'C) Un tipo de NFT', 'D) Una stablecoin'], answer: 'b', explanation: 'CBDC es la version digital de la moneda oficial emitida por un banco central. Aprende mas en el curso cbdc.' },
  { question: 'Que es una blockchain?', options: ['A) Una base de datos centralizada', 'B) Un registro distribuido e inmutable', 'C) Un tipo de wallet', 'D) Una red social'], answer: 'b', explanation: 'Blockchain es un registro distribuido e inmutable de transacciones. Aprende mas en el curso blockchain-dev.' },
  { question: 'Que es un NFT?', options: ['A) Un token fungible', 'B) Una criptomoneda normal', 'C) Un token no fungible y unico', 'D) Un contrato inteligente'], answer: 'c', explanation: 'NFT significa Token No Fungible, un activo digital unico verificado en blockchain. Aprende mas en el curso nft-masterclass.' },
  { question: 'Que es una stablecoin?', options: ['A) Una moneda muy volatil', 'B) Una criptomoneda vinculada a un activo estable', 'C) Una moneda del gobierno', 'D) Un tipo de NFT'], answer: 'b', explanation: 'Una stablecoin es una criptomoneda cuyo valor esta vinculado a un activo estable como el dolar, reduciendo la volatilidad.' },
  { question: 'Que es el minado de Bitcoin?', options: ['A) Comprar Bitcoin en un exchange', 'B) Guardar Bitcoin en una wallet', 'C) Validar transacciones resolviendo problemas matematicos', 'D) Intercambiar Bitcoin por otras cryptos'], answer: 'c', explanation: 'El minado consiste en validar transacciones resolviendo problemas computacionales complejos, a cambio de recompensas en Bitcoin.' },
  { question: 'Que es una clave privada?', options: ['A) Una contrasena del exchange', 'B) Un codigo secreto que prueba la propiedad de tus cryptos', 'C) El nombre de tu wallet', 'D) Tu direccion publica'], answer: 'b', explanation: 'La clave privada es un codigo secreto que te da control total sobre tus criptomonedas. Nunca la compartas con nadie.' },
  { question: 'Que significa Web3?', options: ['A) La tercera version de Internet centralizada', 'B) Una red social descentralizada', 'C) Una internet descentralizada basada en blockchain', 'D) Un protocolo de seguridad'], answer: 'c', explanation: 'Web3 es la vision de una internet descentralizada donde los usuarios controlan sus propios datos. Aprende mas en el curso web3-basics.' },
  { question: 'Que es un exchange de criptomonedas?', options: ['A) Una wallet', 'B) Una plataforma para comprar y vender cryptos', 'C) Un tipo de blockchain', 'D) Un smart contract'], answer: 'b', explanation: 'Un exchange es una plataforma donde puedes comprar, vender e intercambiar criptomonedas por otras monedas o activos.' },
  { question: 'Que es un contrato inteligente?', options: ['A) Un contrato legal en papel', 'B) Un contrato firmado digitalmente', 'C) Codigo que se ejecuta automaticamente en la blockchain', 'D) Un tipo de wallet'], answer: 'c', explanation: 'Un smart contract es codigo que se ejecuta automaticamente en la blockchain cuando se cumplen ciertas condiciones. Aprende en smart-contracts-101.' },
  { question: 'Que es una DAO?', options: ['A) Una agencia gubernamental', 'B) Una Organizacion Autonoma Descentralizada', 'C) Un tipo de token', 'D) Un protocolo blockchain'], answer: 'b', explanation: 'Una DAO es una organizacion gobernada por smart contracts y votacion comunitaria, sin autoridad central.' },
  { question: 'Que es una wallet de criptomonedas?', options: ['A) Una cartera fisica', 'B) Una cuenta bancaria', 'C) Software que almacena tus claves privadas', 'D) Un tipo de exchange'], answer: 'c', explanation: 'Una wallet almacena tus claves privadas, dandote acceso a tus criptomonedas en la blockchain.' },
  { question: 'Que es Ethereum?', options: ['A) Solo una criptomoneda', 'B) Una plataforma blockchain para smart contracts', 'C) Una base de datos centralizada', 'D) Un procesador de pagos'], answer: 'b', explanation: 'Ethereum es una plataforma blockchain descentralizada que permite crear smart contracts y aplicaciones descentralizadas.' },
  { question: 'Que es una gas fee en Ethereum?', options: ['A) Una comision fisica', 'B) Un cargo bancario', 'C) El coste de ejecutar transacciones en Ethereum', 'D) Una recompensa de minado'], answer: 'c', explanation: 'Las gas fees son pagos por la energia computacional necesaria para procesar transacciones en la red Ethereum.' },
  { question: 'Que es una seed phrase?', options: ['A) Una contrasena de email', 'B) Una lista de palabras para recuperar tu wallet', 'C) Un tipo de token', 'D) Una direccion blockchain'], answer: 'b', explanation: 'Una seed phrase es una lista de 12-24 palabras para recuperar tu wallet. Guardala en un lugar seguro y nunca la compartas.' },
  { question: 'Que es la liquidez en DeFi?', options: ['A) Dinero en un banco', 'B) Fondos aportados a protocolos DeFi para permitir intercambios', 'C) Un tipo de NFT', 'D) Una reserva gubernamental'], answer: 'b', explanation: 'La liquidez en DeFi son fondos depositados en protocolos que permiten intercambios y generan comisiones para los proveedores.' },
  { question: 'Que es un nodo de blockchain?', options: ['A) Un tipo de criptomoneda', 'B) Un ordenador que mantiene una copia de la blockchain', 'C) Un smart contract', 'D) Un exchange'], answer: 'b', explanation: 'Un nodo es un ordenador que almacena y valida la blockchain, ayudando a mantener la red descentralizada.' },
  { question: 'Cual es la diferencia entre Bitcoin y Ethereum?', options: ['A) No hay diferencia', 'B) Bitcoin es dinero digital, Ethereum soporta smart contracts', 'C) Ethereum es mas antiguo', 'D) Bitcoin no tiene limite'], answer: 'b', explanation: 'Bitcoin es principalmente dinero digital, mientras que Ethereum es una plataforma programable para crear aplicaciones descentralizadas.' },
  { question: 'Que significa HODL en el mundo crypto?', options: ['A) Vender inmediatamente', 'B) Mantener las cryptos a largo plazo', 'C) Un tipo de wallet', 'D) Un protocolo blockchain'], answer: 'b', explanation: 'HODL significa mantener tus criptomonedas a largo plazo en vez de venderlas. Viene de un error tipografico famoso de 2013.' },
];

export let activeQuiz: { answer: string; explanation: string } | null = null;

export function startScheduler(api: Api): void {
  setInterval(async () => {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    const min = now.getUTCMinutes();

    // Jueves 19:00 UTC (20:00 España) - Quiz semanal
    if (day === 4 && hour === 19 && min === 0) {
      await sendQuiz(api);
    }

    // Miercoles 18:00 UTC (19:00 España) - Recordatorio de cursos
    if (day === 3 && hour === 18 && min === 0) {
      await sendCourseReminder(api);
    }

    // Lunes 18:00 UTC (19:00 España) - Noticias crypto
    if (day === 1 && hour === 18 && min === 0) {
      await sendCryptoNews(api);
    }

  }, 60_000);

  logger.info('Quiz scheduler started');
}

export async function sendQuiz(api: Api): Promise<void> {
  const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
  const text = 'Quiz semanal de Memento Academy\n\n' + quiz.question + '\n\n' + quiz.options.join('\n') + '\n\nResponde con la letra correcta (a, b, c o d)';
  try {
    await api.sendMessage(CHAT_ID, text, { message_thread_id: QUIZ_THREAD_ID });
    activeQuiz = { answer: quiz.answer, explanation: quiz.explanation };
    logger.info('Weekly quiz sent');
  } catch (err) {
    logger.error({ err }, 'Failed to send quiz');
  }
}

async function sendCourseReminder(api: Api): Promise<void> {
  const text = 'Recordatorio semanal de Memento Academy\n\nCursos gratuitos disponibles:\n- web3-basics: Introduccion a Web3\n- crypto-101: Fundamentos de criptomonedas\n- blockchain-dev: Desarrollo en blockchain\n- cbdc: Monedas digitales de banco central\n\nCursos premium:\n- defi-deep-dive, nft-masterclass, smart-contracts-101, portfolio-management\n\nRegistrate en la plataforma y empieza hoy. Completa quizzes para ganar tokens MEMO!';
  try {
    await api.sendMessage(CHAT_ID, text, { message_thread_id: GENERAL_THREAD_ID });
    logger.info('Course reminder sent');
  } catch (err) {
    logger.error({ err }, 'Failed to send course reminder');
  }
}

async function sendCryptoNews(api: Api): Promise<void> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=3&page=1&sparkline=false');
    const coins = await res.json() as Array<{ name: string; symbol: string; current_price: number; price_change_percentage_24h: number }>;
    const lines = coins.map((c) => {
      const change = c.price_change_percentage_24h.toFixed(2);
      const arrow = c.price_change_percentage_24h >= 0 ? 'subio' : 'bajo';
      return c.name + ' (' + c.symbol.toUpperCase() + '): $' + c.current_price.toLocaleString() + ' (' + arrow + ' ' + Math.abs(Number(change)) + '% en 24h)';
    });
    const text = 'Resumen del mercado crypto - Semana de Memento Academy\n\nTop 3 por capitalizacion de mercado:\n\n' + lines.join('\n') + '\n\nSigue aprendiendo sobre estos activos en nuestros cursos gratuitos!';
    await api.sendMessage(CHAT_ID, text, { message_thread_id: NEWS_THREAD_ID });
    logger.info('Crypto news sent');
  } catch (err) {
    logger.error({ err }, 'Failed to send crypto news');
  }
}
