import { initMemory, loadHistory, saveMessage } from "../memory.js";
import { shouldFetchPrice, fetchPriceContext } from "../prices.js";
import { activeQuiz, sendQuiz, startScheduler } from '../scheduler.js';
import { getProfileByTelegramUsername, getGameStats, getCourseProgress } from '../supabase.js';
import Anthropic from '@anthropic-ai/sdk';
import { Bot } from 'grammy';
import { readEnvFile } from '../env.js';
import { logger } from '../logger.js';

const TRIGGER = '@MementoAcademyBot';
const QUIZ_THREAD_ID = 7;
const MEMO_TOKEN_THREAD_ID = 8;
const MAX_CONTEXT = 5;
const MAX_WORDS = 200;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 3;

type Lang = 'es' | 'en';

interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export class TelegramChannel {
  name = 'telegram';
  getApi() { return this.bot.api; }
  getBot() { return this.bot; }

  private bot: Bot;
  private chatId: string;
  private anthropic: Anthropic;
  private threadLang = new Map<number, Lang>();
  private rateMap = new Map<number, number[]>();
  private contextMap = new Map<string, HistoryEntry[]>();

  constructor() {
    const env = readEnvFile([
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHAT_ID',
      'TELEGRAM_ES_THREAD_ID',
      'TELEGRAM_EN_THREAD_ID',
      'ANTHROPIC_API_KEY',
    ]);

    const token = env.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
    const apiKey = env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;

    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
    if (!chatId) throw new Error('TELEGRAM_CHAT_ID is required');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required');

    this.chatId = chatId;
    this.bot = new Bot(token);
    this.anthropic = new Anthropic({ apiKey });

    const esThreadId = env.TELEGRAM_ES_THREAD_ID ?? process.env.TELEGRAM_ES_THREAD_ID;
    const enThreadId = env.TELEGRAM_EN_THREAD_ID ?? process.env.TELEGRAM_EN_THREAD_ID;
    if (esThreadId) this.threadLang.set(Number(esThreadId), 'es');
    if (enThreadId) this.threadLang.set(Number(enThreadId), 'en');
    this.threadLang.set(7, 'es');

    this.setupHandlers();
  }

  private isRateLimited(userId: number): boolean {
    const now = Date.now();
    const cutoff = now - RATE_WINDOW_MS;
    const ts = (this.rateMap.get(userId) ?? []).filter((t) => t > cutoff);
    if (ts.length >= RATE_MAX) {
      this.rateMap.set(userId, ts);
      return true;
    }
    ts.push(now);
    this.rateMap.set(userId, ts);
    return false;
  }

  private getLang(threadId?: number): Lang {
    if (threadId === undefined) return 'en';
    return this.threadLang.get(threadId) ?? 'en';
  }

  private truncateWords(text: string): string {
    const words = text.split(/\s+/);
    return words.length <= MAX_WORDS ? text : words.slice(0, MAX_WORDS).join(' ') + '...';
  }

  private getHistory(threadKey: string): HistoryEntry[] {
    if (!this.contextMap.has(threadKey)) {
      this.contextMap.set(threadKey, []);
    }
    return this.contextMap.get(threadKey)!;
  }

  private pushHistory(threadKey: string, entry: HistoryEntry): void {
    const hist = this.getHistory(threadKey);
    hist.push(entry);
    if (hist.length > MAX_CONTEXT) hist.splice(0, hist.length - MAX_CONTEXT);
  }

  private setupHandlers(): void {
    // Welcome new members
    this.bot.on('chat_member', async (ctx) => {
      const member = ctx.chatMember;
      if (member.new_chat_member.status !== 'member') return;
      if (String(ctx.chat.id) !== this.chatId) return;
      const name = [member.new_chat_member.user.first_name, member.new_chat_member.user.last_name].filter(Boolean).join(' ') || 'nuevo miembro';
      const welcome = 'Bienvenido a Memento Academy, ' + name + '! Soy Memo, tu asistente de Web3.\n\nEmpieza tu camino en blockchain con nuestros cursos gratuitos: web3-basics, crypto-101, blockchain-dev y cbdc.\n\nEscribeme @MementoAcademyBot en cualquier canal si tienes dudas. Cada jueves tenemos un quiz en Quiz & Retos donde puedes ganar tokens MEMO.\n\nSi ya tienes cuenta en la plataforma, ve a tu perfil y añade tu usuario de Telegram para que pueda reconocerte y ver tu progreso.';
      try {
        await this.bot.api.sendMessage(this.chatId, welcome);
      } catch (err) {
        logger.error({ err }, 'Failed to send welcome message');
      }
    });

    // Auto-detect topic language
    this.bot.on('message:forum_topic_created', (ctx) => {
      const threadId = ctx.message.message_thread_id;
      const topicName = ctx.message.forum_topic_created?.name ?? '';
      if (threadId === undefined) return;
      const lower = topicName.toLowerCase();
      if (lower.includes('espanol') || lower.includes('spanish')) {
        this.threadLang.set(threadId, 'es');
      } else if (lower.includes('english')) {
        this.threadLang.set(threadId, 'en');
      }
    });

    // Main message handler
    this.bot.on('message:text', async (ctx) => {
      const msg = ctx.message;
      if (msg.from?.is_bot) return;
      if (String(ctx.chat.id) !== this.chatId) return;

      const threadId = msg.message_thread_id;
      const text = msg.text?.trim() ?? '';
      const userId = msg.from?.id;
      const telegramUsername = msg.from?.username ?? '';
      if (!userId) return;

      // Admin command to launch quiz manually
      if (text === '!quiz') {
        await sendQuiz(this.bot.api);
        return;
      }

      // Show user profile stats
      if (text === '!perfil') {
        if (!telegramUsername) {
          await ctx.api.sendMessage(this.chatId, 'Necesitas tener un username de Telegram configurado. Ve a ajustes de Telegram y añade un username.', threadId !== undefined ? { message_thread_id: threadId } : {});
          return;
        }
        const profile = await getProfileByTelegramUsername(telegramUsername);
        if (!profile) {
          await ctx.api.sendMessage(this.chatId, 'No encuentro tu perfil. Ve a memento.academy, entra en tu perfil y añade tu usuario de Telegram (' + telegramUsername + ') para vincularte.', threadId !== undefined ? { message_thread_id: threadId } : {});
          return;
        }
        const stats = await getGameStats(profile.id);
        const courses = await getCourseProgress(profile.id);
        let reply = 'Perfil de ' + (profile.full_name ?? telegramUsername) + '\n';
        reply += 'Nivel: ' + profile.membership_tier + '\n\n';
        if (stats && stats.total_sessions > 0) {
          reply += 'Sesiones de juego: ' + stats.total_sessions + '\n';
          reply += 'Mejor puntuacion: ' + stats.best_score + '/10\n';
          reply += 'Racha maxima: ' + stats.max_streak + '\n';
          reply += 'Sesiones recompensadas: ' + stats.total_rewarded + '\n\n';
        }
        if (courses.length > 0) {
          reply += 'Progreso en cursos:\n';
          courses.forEach((c) => { reply += '- ' + c.course_id + ': ' + c.progress_percentage + '%\n'; });
        } else {
          reply += 'Aun no has iniciado ningun curso. Entra en la plataforma y empieza hoy!';
        }
        await ctx.api.sendMessage(this.chatId, reply, threadId !== undefined ? { message_thread_id: threadId } : {});
        return;
      }

      // Quiz answer handler
      if (threadId === QUIZ_THREAD_ID && ['a', 'b', 'c', 'd'].includes(text.toLowerCase())) {
        if (!activeQuiz) return;
        const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'User';
        if (text.toLowerCase() === activeQuiz.answer) {
          await ctx.api.sendMessage(this.chatId, 'Correcto, ' + name + '! La respuesta era ' + activeQuiz.answer.toUpperCase() + '.\n\n' + activeQuiz.explanation, { message_thread_id: threadId });
        } else {
          await ctx.api.sendMessage(this.chatId, 'No es correcto, ' + name + '. La respuesta correcta era ' + activeQuiz.answer.toUpperCase() + '.\n\n' + activeQuiz.explanation, { message_thread_id: threadId });
        }
        return;
      }

      // MEMO Token topic - respond to any message without trigger
      if (threadId === MEMO_TOKEN_THREAD_ID) {
        if (this.isRateLimited(userId)) return;
        const senderName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'User';
        const memoSystem = 'Eres Memo, el asistente oficial de Memento Academy. Eres experto en el token MEMO, la moneda de la plataforma. El token MEMO es un ERC-20 en la red Sepolia. Los usuarios lo ganan completando quizzes con 8/10 o mas de puntuacion. Hay bonificaciones de velocidad: +50% si respondes en menos de 3 segundos, +25% en menos de 5 segundos. Multiplicadores de racha: x1.5 con 3 dias seguidos, x2 con 5 dias seguidos. Rangos: Novato (0+), Aprendiz (100+), Experto (500+), Maestro (2000+), Leyenda (10000+). Responde SIEMPRE en espanol, sin formato markdown, maximo 200 palabras.';
        const threadKey = 'memo-token';
        this.pushHistory(threadKey, { role: 'user', content: senderName + ': ' + msg.text });
        saveMessage(threadKey, "user", senderName + ": " + msg.text);
        const history = loadHistory(threadKey);
        try {
          const response = await this.anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: memoSystem,
            messages: history.map((h) => ({ role: h.role, content: h.content })),
          });
          const raw = response.content.find((b) => b.type === 'text')?.text ?? '';
          const reply = this.truncateWords(raw);
          saveMessage(threadKey, "assistant", raw);
          await ctx.api.sendMessage(this.chatId, reply, { message_thread_id: threadId });
        } catch (err) {
          logger.error({ err }, 'Anthropic API error in MEMO Token handler');
        }
        return;
      }

      // Check trigger word for all other messages
      if (!msg.text.includes(TRIGGER)) return;
      if (this.isRateLimited(userId)) return;

      const threadKey = threadId !== undefined ? String(threadId) : 'main';
      const lang = this.getLang(threadId);
      const senderName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'User';

      // Enrich context with Supabase profile if available
      let profileContext = '';
      if (telegramUsername) {
        const profile = await getProfileByTelegramUsername(telegramUsername);
        if (profile) {
          const stats = await getGameStats(profile.id);
          const courses = await getCourseProgress(profile.id);
          profileContext = '\n\nDatos del usuario en la plataforma: nivel ' + profile.membership_tier;
          if (stats && stats.total_sessions > 0) {
            profileContext += ', ' + stats.total_sessions + ' sesiones jugadas, mejor puntuacion ' + stats.best_score + '/10, racha maxima ' + stats.max_streak;
          }
          if (courses.length > 0) {
            profileContext += '. Cursos: ' + courses.map((c) => c.course_id + ' al ' + c.progress_percentage + '%').join(', ');
          }
          profileContext += '. Usa estos datos para personalizar tu respuesta cuando sea relevante.';
        }
      }

      const priceContext = shouldFetchPrice(msg.text) ? await fetchPriceContext(msg.text) : "";
      const system =
        lang === 'es'
          ? 'Eres Memo, el asistente oficial de Memento Academy, una plataforma educativa gratuita sobre Web3, criptomonedas y blockchain. Ayudas a la comunidad a entender conceptos, resolver dudas sobre los cursos y motivar el aprendizaje. Eres amable, claro y directo. Cursos gratuitos disponibles (usa estos nombres exactos sin cambiarlos): web3-basics, crypto-101, blockchain-dev, cbdc. Cursos premium: defi-deep-dive, nft-masterclass, smart-contracts-101, portfolio-management. Los usuarios ganan tokens MEMO completando quizzes con 8/10 o mas. Responde SIEMPRE en espanol, sin formato markdown, maximo 200 palabras.' + profileContext + priceContext
          : 'You are Memo, the official assistant of Memento Academy, a free educational platform about Web3, crypto and blockchain. You help the community understand concepts and learn about the courses. Free courses: web3-basics, crypto-101, blockchain-dev, cbdc. Premium courses: defi-deep-dive, nft-masterclass, smart-contracts-101, portfolio-management. Users earn MEMO tokens by scoring 8/10 or higher on quizzes. ALWAYS respond in English, no markdown formatting, max 200 words.' + profileContext;

      this.pushHistory(threadKey, { role: 'user', content: senderName + ': ' + msg.text });
        saveMessage(threadKey, "user", senderName + ": " + msg.text);
        const history = loadHistory(threadKey);

      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system,
          messages: history.map((h) => ({ role: h.role, content: h.content })),
        });
        const raw = response.content.find((b) => b.type === 'text')?.text ?? '';
        const reply = this.truncateWords(raw);
        saveMessage(threadKey, "assistant", raw);
        await ctx.api.sendMessage(
          this.chatId,
          reply,
          threadId !== undefined ? { message_thread_id: threadId } : {},
        );
      } catch (err) {
        logger.error({ err }, 'Anthropic API error in Telegram handler');
      }
    });
  }

  async connect(): Promise<void> {
    await this.bot.init();
    initMemory();
    logger.info({ username: this.bot.botInfo.username }, 'Telegram bot connected');
    startScheduler(this.bot.api);
    this.bot.start({ allowed_updates: ['message', 'chat_member'] }).catch((err) => logger.error({ err }, 'Telegram bot polling error'));
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    await this.bot.api.sendMessage(jid, text);
  }

  isConnected(): boolean {
    return true;
  }

  ownsJid(jid: string): boolean {
    return jid === this.chatId;
  }

  async disconnect(): Promise<void> {
    await this.bot.stop();
  }
}
