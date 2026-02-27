export const LOSS_REASONS = [
  { value: 'price', label: 'Precio alto' },
  { value: 'no_response', label: 'No respondió' },
  { value: 'chose_competitor', label: 'Eligió la competencia' },
  { value: 'no_need', label: 'No tiene necesidad ahora' },
  { value: 'outside_scope', label: 'Fuera de alcance' },
  { value: 'other', label: 'Otro motivo' },
] as const;

export const LOSS_REASON_LABELS: Record<string, string> = Object.fromEntries(
  LOSS_REASONS.map((item) => [item.value, item.label]),
);
