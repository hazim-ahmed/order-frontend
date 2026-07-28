/**
 * تنسيق التاريخ والوقت بشكل موحد وأنيق باللغة العربية
 * مثال: 22/07/2026، 03:15 م
 */
export function formatDateTime(dateVal) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';

  try {
    return d.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return d.toLocaleString();
  }
}

export function formatDate(dateVal) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ar-EG');
}
