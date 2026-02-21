const SPAM_PATTERNS = [
  /https?:\/\//i,
  /t\.me\//i,
  /whatsapp/i,
  /free\s*(crypto|bitcoin|eth|token)/i,
  /giveaway/i,
  /airdrop/i,
  /click\s*here/i,
  /gratis\s*(crypto|bitcoin|token)/i,
  /gana\s*(dinero|crypto|bitcoin)/i,
  /inversion\s*garantizada/i,
];

const OFFENSIVE_PATTERNS = [
  // Sexual
  /\bculo\b/i,
  /\bojete\b/i,
  /\bsexo\b/i,
  /\banal\b/i,
  /\bporno\b/i,
  /\bpornografia\b/i,
  /\bpolla\b/i,
  /\bcoño\b/i,
  /\bcojon(es)?\b/i,
  /\bputa\b/i,
  /\bputo\b/i,
  /\bfollar\b/i,
  /\bfollando\b/i,
  /\bmasturbacion\b/i,
  /\bcorrete\b/i,
  /\bvergon\b/i,
  /\bverga\b/i,
  /\bchupar\b/i,
  /\bchupame\b/i,
  // Insultos
  /\bidiota\b/i,
  /\bestupido\b/i,
  /\bestupida\b/i,
  /\bimbecil\b/i,
  /\bcabron\b/i,
  /\bcabrona\b/i,
  /\bgilipollas\b/i,
  /\bsubnormal\b/i,
  /\bmarica\b/i,
  /\bhijoputa\b/i,
  /\bhijueputa\b/i,
  /\bmentecato\b/i,
  /\bzoquete\b/i,
  /\bburro\b/i,
  /\basno\b/i,
  /\bcretino\b/i,
  /\bpalurdo\b/i,
  /\bpendejo\b/i,
  /\bpendeja\b/i,
  /\bboludo\b/i,
  /\bboluda\b/i,
  /\bpelotudo\b/i,
  /\bconchetu(madre)?\b/i,
  /\bmalparido\b/i,
  /\bhdp\b/i,
/\bhuevos\b/i,
  /\btocate\b/i,
  /\bvete\s*a\s*la\s*mierda\b/i,
  /\bla\s*puta\s*madre\b/i,
  /\bme\s*cago\b/i,
  /\bjoder\b/i,
  /\bostia\b/i,
  /\bhostia\b/i,
  /\bpollas\b/i,
  /\bmaricón\b/i,
  /\bmaricona\b/i,
  // English
  /\bfuck\b/i,
  /\bshit\b/i,
  /\basshole\b/i,
  /\bbitch\b/i,
  /\bstupid\b/i,
  /\bmoron\b/i,
  /\bdick\b/i,
  /\bcunt\b/i,
];

export function detectSpam(text: string): boolean {
  return SPAM_PATTERNS.some((p) => p.test(text));
}

export function detectOffensive(text: string): boolean {
  return OFFENSIVE_PATTERNS.some((p) => p.test(text));
}

export function moderationReason(text: string): string | null {
  if (detectSpam(text)) return 'spam o link sospechoso';
  if (detectOffensive(text)) return 'lenguaje ofensivo';
  return null;
}
