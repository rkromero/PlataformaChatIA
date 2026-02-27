const HIGH_INTENT_PATTERNS = [
  /\b(precio|precios|valor|costo|sale|presupuesto|cotizacion)\b/i,
  /\b(quiero|me interesa|reservar|reserva|agendar|agenda|comprar|compra|turno)\b/i,
  /\b(hoy|ahora|urgente|disponible|disponibilidad)\b/i,
  /\b(pagar|pago|tarjeta|transferencia|cuotas|efectivo)\b/i,
];

const LOW_INTENT_PATTERNS = [
  /\b(despues|después|mas tarde|más tarde|lo pienso|te aviso)\b/i,
  /\b(no gracias|no me interesa|no quiero)\b/i,
  /\b(caro|muy caro)\b/i,
];

export interface LeadScoreResult {
  score: number;
  temperature: 'cold' | 'warm' | 'hot';
}

export function calculateLeadScore(
  message: string | null | undefined,
  previousScore = 0,
): LeadScoreResult {
  const text = (message ?? '').trim();
  if (!text) {
    return {
      score: clamp(Math.round(previousScore * 0.85), 0, 100),
      temperature: getTemperature(previousScore),
    };
  }

  let rawScore = 35;

  for (const pattern of HIGH_INTENT_PATTERNS) {
    if (pattern.test(text)) rawScore += 15;
  }
  for (const pattern of LOW_INTENT_PATTERNS) {
    if (pattern.test(text)) rawScore -= 18;
  }

  if (text.includes('?')) rawScore += 8;
  if (text.length > 80) rawScore += 6;

  const blendedScore = Math.round((previousScore * 0.45) + (rawScore * 0.55));
  const score = clamp(blendedScore, 0, 100);

  return {
    score,
    temperature: getTemperature(score),
  };
}

function getTemperature(score: number): 'cold' | 'warm' | 'hot' {
  if (score >= 75) return 'hot';
  if (score >= 45) return 'warm';
  return 'cold';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
