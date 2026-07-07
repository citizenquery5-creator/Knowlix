export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + '…';
}

export function getFileIcon(type: string): string {
  const icons: Record<string, string> = {
    pdf: '📄', docx: '📝', doc: '📝', ppt: '📊', pptx: '📊', txt: '📃', epub: '📖',
  };
  return icons[type.toLowerCase()] ?? '📁';
}

export function getFileBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    pdf: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    docx: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    doc: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ppt: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    pptx: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    txt: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    epub: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return colors[type.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
}

export function generateUpiQrUrl(upiId: string, amount: number, name: string, note: string): string {
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
}

export function canDownload(role: string, plan: string, downloadsToday: number, freeLimit: number): boolean {
  if (role === 'admin') return true;
  if (plan === 'pro' || plan === 'premium') return true;
  return downloadsToday < freeLimit;
}

export function canAccessPremium(role: string, plan: string): boolean {
  if (role === 'admin') return true;
  return plan === 'pro' || plan === 'premium';
}

export function generateAiSummary(title: string, description: string, tags: string[]): string {
  const tagStr = tags.length ? ` Key topics include: ${tags.slice(0, 5).join(', ')}.` : '';
  return `This document titled "${title}" covers important educational content.${description ? ` ${description.slice(0, 200)}` : ''}${tagStr} It is a valuable resource for students and professionals seeking structured knowledge.`;
}

export function generateAiKeywords(title: string, category: string, tags: string[]): string[] {
  const words = [...title.split(' '), ...tags, category]
    .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 3);
  return [...new Set(words)].slice(0, 10);
}
