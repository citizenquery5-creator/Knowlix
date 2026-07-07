export type UserRole = 'admin' | 'creator' | 'premium_user' | 'free_user';
export type SubscriptionPlan = 'free' | 'pro' | 'premium';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type FileType = 'pdf' | 'docx' | 'ppt' | 'pptx' | 'txt';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  role: UserRole;
  is_active: boolean;
  downloads_today: number;
  last_download_reset: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_hi: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  document_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  file_type: FileType;
  file_size: number;
  thumbnail_url: string | null;
  category_id: string | null;
  uploader_id: string;
  is_premium: boolean;
  is_featured: boolean;
  is_approved: boolean;
  is_downloadable: boolean;
  status: DocumentStatus;
  view_count: number;
  download_count: number;
  like_count: number;
  comment_count: number;
  tags: string[];
  language: string;
  ai_summary: string | null;
  ai_keywords: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  uploader?: Profile;
  user_liked?: boolean;
  user_bookmarked?: boolean;
}

export interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_url: string | null;
  file_url: string | null;
  file_type: 'pdf' | 'epub';
  file_size: number;
  category_id: string | null;
  uploader_id: string;
  isbn: string;
  publisher: string;
  publish_year: number | null;
  pages: number;
  language: string;
  is_premium: boolean;
  is_featured: boolean;
  is_approved: boolean;
  status: DocumentStatus;
  view_count: number;
  download_count: number;
  like_count: number;
  rating: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
  uploader?: Profile;
  user_liked?: boolean;
  user_bookmarked?: boolean;
  reading_progress?: ReadingProgress;
}

export interface Download {
  id: string;
  user_id: string;
  document_id: string | null;
  ebook_id: string | null;
  downloaded_at: string;
  document?: Document;
  ebook?: Ebook;
}

export interface Bookmark {
  id: string;
  user_id: string;
  document_id: string | null;
  ebook_id: string | null;
  created_at: string;
  document?: Document;
  ebook?: Ebook;
}

export interface Comment {
  id: string;
  user_id: string;
  document_id: string | null;
  ebook_id: string | null;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  plan: 'pro' | 'premium';
  amount: number;
  upi_transaction_id: string | null;
  screenshot_url: string | null;
  status: PaymentStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: Profile;
}

export interface Creator {
  id: string;
  user_id: string;
  bio: string;
  website: string;
  total_uploads: number;
  total_downloads: number;
  total_earnings: number;
  is_verified: boolean;
  created_at: string;
  user?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  document_id: string | null;
  ebook_id: string | null;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: Profile;
  document?: Document;
  ebook?: Ebook;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'upload' | 'subscription' | 'approval';
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  ebook_id: string;
  current_page: number;
  total_pages: number;
  progress_percent: number;
  last_read_at: string;
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  nameHi: string;
  price: number;
  period: string;
  periodHi: string;
  features: string[];
  featuresHi: string[];
  highlighted: boolean;
  color: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    nameHi: 'फ्री ट्रायल',
    price: 0,
    period: '2 days',
    periodHi: '2 दिन',
    features: ['1 Download Per Day', '2-Day Free Trial', 'Browse All Documents', 'Search & Filter', 'Comment on Content'],
    featuresHi: ['1 डाउनलोड प्रतिदिन', '2-दिन फ्री ट्रायल', 'सभी दस्तावेज़ ब्राउज़ करें', 'खोज और फ़िल्टर', 'सामग्री पर टिप्पणी'],
    highlighted: false,
    color: 'neutral',
  },
  {
    id: 'pro',
    name: 'Pro',
    nameHi: 'प्रो',
    price: 99,
    period: 'month',
    periodHi: 'महीना',
    features: ['Unlimited Downloads', 'Premium Notes Access', 'Premium E-Books', 'Priority Support', 'Ad-Free Experience', 'Download History'],
    featuresHi: ['असीमित डाउनलोड', 'प्रीमियम नोट्स', 'प्रीमियम ई-बुक्स', 'प्राथमिकता समर्थन', 'विज्ञापन-मुक्त', 'डाउनलोड इतिहास'],
    highlighted: false,
    color: 'accent',
  },
  {
    id: 'premium',
    name: 'Premium',
    nameHi: 'प्रीमियम',
    price: 149,
    period: 'month',
    periodHi: 'महीना',
    features: ['Unlimited Downloads', 'Premium Notes & E-Books', 'Upload Documents', 'Creator Dashboard', 'Analytics Access', 'Ad-Free Experience', 'AI Tools Access', 'Billed Yearly (₹1,788/yr)'],
    featuresHi: ['असीमित डाउनलोड', 'प्रीमियम नोट्स और ई-बुक्स', 'दस्तावेज़ अपलोड', 'क्रिएटर डैशबोर्ड', 'एनालिटिक्स', 'विज्ञापन-मुक्त', 'AI टूल्स', 'वार्षिक बिलिंग (₹1,788/वर्ष)'],
    highlighted: true,
    color: 'primary',
  },
];
