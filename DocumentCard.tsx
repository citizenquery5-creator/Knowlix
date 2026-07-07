import { FileText, Download, Eye, Heart, Bookmark, Lock, Share2, Star } from 'lucide-react';
import { Document } from '../../lib/types';
import { formatBytes, formatCount, timeAgo, getFileBadgeColor, truncate } from '../../lib/utils';
import { navigate } from '../../lib/router';
import { useLang } from '../../contexts/LanguageContext';

interface DocumentCardProps {
  doc: Document;
  onLike?: () => void;
  onBookmark?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  compact?: boolean;
}

const FALLBACK_GRADIENTS = [
  'from-primary-400 to-primary-600',
  'from-secondary-400 to-secondary-600',
  'from-accent-400 to-accent-600',
  'from-sky-400 to-sky-600',
  'from-emerald-400 to-emerald-600',
  'from-rose-400 to-rose-600',
];

export default function DocumentCard({ doc, onLike, onBookmark, onView, onDownload, compact = false }: DocumentCardProps) {
  const { t } = useLang();

  const handleClick = () => navigate(`/documents/${doc.id}`);

  const gradientIdx = (doc.title.charCodeAt(0) + (doc.title.charCodeAt(1) ?? 0)) % FALLBACK_GRADIENTS.length;
  const hasThumbnail = !!doc.thumbnail_url;

  return (
    <div className="card-hover overflow-hidden group cursor-pointer" onClick={handleClick}>
      {/* Cover */}
      <div className={`relative overflow-hidden ${hasThumbnail ? '' : `bg-gradient-to-br ${FALLBACK_GRADIENTS[gradientIdx]}`} ${compact ? 'h-32' : 'h-44'}`}>
        {hasThumbnail ? (
          <img
            src={doc.thumbnail_url!}
            alt={doc.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <FileText className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} text-white/70 mb-2`} />
            <span className="text-white/90 text-xs text-center font-medium line-clamp-2">{truncate(doc.title, compact ? 30 : 50)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`badge text-[10px] uppercase font-bold ${getFileBadgeColor(doc.file_type)}`}>
            {doc.file_type}
          </span>
          {doc.is_premium && (
            <span className="badge bg-amber-400 text-amber-900 text-[10px]">
              <Lock className="w-2.5 h-2.5" /> Premium
            </span>
          )}
        </div>

        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onBookmark && (
            <button
              onClick={e => { e.stopPropagation(); onBookmark(); }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                doc.user_bookmarked ? 'bg-primary-600 text-white' : 'bg-white/90 text-neutral-600 hover:bg-primary-600 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={e => { e.stopPropagation(); onDownload(); }}
              className="w-7 h-7 rounded-lg bg-white/90 text-neutral-600 hover:bg-primary-600 hover:text-white flex items-center justify-center transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {doc.category && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[11px] font-medium text-primary-500 dark:text-primary-400 uppercase tracking-wide">
              {doc.category.name}
            </span>
          </div>
        )}
        <h3 className="font-semibold text-neutral-900 dark:text-white text-sm leading-snug mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {truncate(doc.title, compact ? 50 : 70)}
        </h3>

        {!compact && doc.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">
            {doc.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {formatCount(doc.view_count)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" /> {formatCount(doc.download_count)}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onLike?.(); }}
              className={`flex items-center gap-1 transition-colors ${doc.user_liked ? 'text-error-500' : 'hover:text-error-500'}`}
            >
              <Heart className={`w-3 h-3 ${doc.user_liked ? 'fill-current' : ''}`} />
              {formatCount(doc.like_count)}
            </button>
          </div>
          <span>{timeAgo(doc.created_at)}</span>
        </div>

        {/* Uploader */}
        {doc.uploader && !compact && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary-600">
                {doc.uploader.full_name?.slice(0, 1).toUpperCase() ?? 'U'}
              </span>
            </div>
            <span className="text-xs text-neutral-500 truncate">{doc.uploader.full_name}</span>
          </div>
        )}

        {/* View & Download Buttons */}
        {!compact && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={e => { e.stopPropagation(); onView?.(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDownload?.(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


