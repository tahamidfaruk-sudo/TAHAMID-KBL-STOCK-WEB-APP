/**
 * Universal Date Formatting Utility
 * Formats ISO or YYYY-MM-DD date strings into "DD MMM YYYY" (e.g. "28 Sep 2026")
 */
export const formatDisplayDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).trim();
  const datePart = cleanStr.split('T')[0];
  const parts = datePart.split('-');
  
  if (parts.length === 3) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (monthNum >= 1 && monthNum <= 12 && !isNaN(day)) {
      const paddedDay = day < 10 ? `0${day}` : `${day}`;
      return `${paddedDay} ${months[monthNum - 1]} ${year}`;
    }
  }

  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return cleanStr;
  const day = d.getDate();
  const paddedDay = day < 10 ? `0${day}` : `${day}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${paddedDay} ${months[d.getMonth()]} ${d.getFullYear()}`;
};
