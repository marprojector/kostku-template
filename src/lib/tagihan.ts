export function hitungJatuhTempo(tanggalMasuk: string, periode: string): string {
  if (!tanggalMasuk || !periode) {
    return '';
  }
  const [year, month] = periode.split('-').map(Number);
  const date = new Date(tanggalMasuk);
  if (isNaN(date.getTime())) {
    return '';
  }
  const day = date.getDate();
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  const lastDay = new Date(Date.UTC(nextYear, nextMonth, 0)).getDate();
  const d = Math.min(day, lastDay);
  const result = new Date(Date.UTC(nextYear, nextMonth - 1, d));
  return result.toISOString().split('T')[0];
}