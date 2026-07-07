import { Book, Download, Eye, Heart, Star, Lock, User } from 'lucide-react';
import { Ebook } from '../../lib/types';
import { formatCount, timeAgo, truncate } from '../../lib/utils';
import { navigate } from '../../lib/router';

interface EbookCardProps {
  ebook: Ebook;
  onLike?: () => void;
  onBookmark?: () => void;
  compact?: boolean;
}

export default function EbookCard({ ebook, onLike, onBookmark, compact = false }: EbookCardProps) {
  const fallbackColors = ['from-indigo-400 to-purple-600', 'from-blue-400 to-cyan-600', 'from-violet-400 to-pink-600', 'from-emerald-400 to-teal-600'];
  const colorIdx = ebook.title.charCodeAt(0) % fallbackColors.length;

  const cover = ebook.cover_url || null;

  return (
    <div
      className="card-hover overflow-hidden group cursor-pointer flex"
      onClick={() => navigate(`/ebooks/${ebook.id}`)}
      style={{ flexDirection: compact ? 'row' : 'column' }}
    >
      {/* Cover */}
      <div className={`relative overflow-hidden shrink-0 ${compact ? 'w-24 h-32' : 'w-full h-52'} bg-gradient-to-br ${fallbackColors[colorIdx]}`}>
        {cover ? (
          <img src={cover} alt={ebook.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <Book className="w-12 h-12 text-white/60 mb-2" />
            <span className="text-white/80 text-xs text-center font-medium">{truncate(ebook.title, 30)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {ebook.is_premium && (
          <div className="absolute top-2 right-2">
            <span className="badge bg-amber-400 text-amber-900 text-[10px]">
              <Lock className="w-2.5 h-2.5" /> Premium
            </span>
          </div>
        )}

        {/* Rating */}
        {ebook.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-white text-xs">{ebook.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className={`font-semibold text-neutral-900 dark:text-white leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${compact ? 'text-xs' : 'text-sm'}`}>
          {truncate(ebook.title, compact ? 40 : 60)}
        </h3>
        {ebook.author && (
          <div className="flex items-center gap-1 mt-1 mb-2">
            <User className="w-3 h-3 text-neutral-400" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{ebook.author}</span>
          </div>
        )}

        {!compact && ebook.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3">{ebook.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-neutral-400 mt-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" /> {formatCount(ebook.download_count)}
            </span>
            <button onClick={e => { e.stopPropagation(); onLike?.(); }} className={`flex items-center gap-1 ${ebook.user_liked ? 'text-error-500' : 'hover:text-error-500'}`}>
              <Heart className={`w-3 h-3 ${ebook.user_liked ? 'fill-current' : ''}`} />
              {formatCount(ebook.like_count)}
            </button>
          </div>
          {!compact && <span>{ebook.pages > 0 ? `${ebook.pages}pp` : ''}</span>}
        </div>
      </div>
    </div>
  );
}
