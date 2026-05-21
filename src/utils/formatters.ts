export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateIso: string): string {
  const normalized = dateIso.includes('T') ? dateIso : `${dateIso}T00:00:00`;
  return new Date(normalized).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
