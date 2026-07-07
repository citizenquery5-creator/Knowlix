import { useState, useRef } from 'react';
import { Upload, X, File, Loader2, CheckCircle, Tag, Lock, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Category } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { formatBytes, generateAiSummary, generateAiKeywords } from '../../lib/utils';
import Modal from '../ui/Modal';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  type?: 'document' | 'ebook';
}

const ACCEPTED_DOC_TYPES = '.pdf,.docx,.ppt,.pptx,.txt';
const ACCEPTED_EBOOK_TYPES = '.pdf,.epub';
const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/jpg,image/webp,image/gif';
const MAX_SIZE_MB = 50;
const MAX_IMAGE_MB = 5;

export default function UploadModal({ open, onClose, onSuccess, categories, type = 'document' }: UploadModalProps) {
  const { user, profile } = useAuth();
  const { t } = useLang();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategoryId('');
    setTags(''); setIsPremium(false); setAuthor('');
    setFile(null);
    setThumbnail(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview('');
  };

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    const validDoc = ['pdf', 'docx', 'ppt', 'pptx', 'txt'].includes(ext);
    const validEbook = ['pdf', 'epub'].includes(ext);
    if (type === 'document' && !validDoc) { toast('Invalid file type. Allowed: PDF, DOCX, PPT, PPTX, TXT', 'error'); return; }
    if (type === 'ebook' && !validEbook) { toast('Invalid file type. Allowed: PDF, EPUB', 'error'); return; }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) { toast(`File too large. Max ${MAX_SIZE_MB}MB`, 'error'); return; }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleThumbnail = (f: File) => {
    if (!f.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) { toast(`Image too large. Max ${MAX_IMAGE_MB}MB`, 'error'); return; }
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(f);
    setThumbnailPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!title.trim()) { toast(t('titleRequired'), 'error'); return; }

    setUploading(true);
    try {
      let fileUrl = '';
      let fileType = 'pdf';
      let fileSize = 0;

      let thumbnailUrl: string | null = null;

      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
        const bucket = type === 'document' ? 'documents' : 'ebooks';
        const path = `${user.id}/${Date.now()}_${file.name.replace(/[^a-z0-9._-]/gi, '_')}`;
        const { error: uploadError, data } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (uploadError) { toast(`Upload error: ${uploadError.message}`, 'error'); return; }
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileType = ext;
        fileSize = file.size;
      }

      if (thumbnail) {
        const thumbPath = `${user.id}/thumbs/${Date.now()}_${thumbnail.name.replace(/[^a-z0-9._-]/gi, '_')}`;
        const { error: thumbError } = await supabase.storage.from('documents').upload(thumbPath, thumbnail, {
          cacheControl: '3600',
          upsert: false,
        });
        if (thumbError) { toast(`Thumbnail upload error: ${thumbError.message}`, 'error'); return; }
        const { data: thumbUrlData } = supabase.storage.from('documents').getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }

      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      const aiSummary = generateAiSummary(title, description, tagArray);
      const aiKeywords = generateAiKeywords(title, categories.find(c => c.id === categoryId)?.name ?? '', tagArray);

      const isAdmin = profile.role === 'admin';

      if (type === 'document') {
        const { error } = await supabase.from('documents').insert({
          title: title.trim(),
          description: description.trim(),
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize,
          thumbnail_url: thumbnailUrl,
          category_id: categoryId || null,
          uploader_id: user.id,
          is_premium: isPremium,
          tags: tagArray,
          status: isAdmin ? 'approved' : 'pending',
          is_approved: isAdmin,
          ai_summary: aiSummary,
          ai_keywords: aiKeywords,
        });
        if (error) { toast(error.message, 'error'); return; }
      } else {
        const { error } = await supabase.from('ebooks').insert({
          title: title.trim(),
          author: author.trim() || profile.full_name,
          description: description.trim(),
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize,
          cover_url: thumbnailUrl,
          category_id: categoryId || null,
          uploader_id: user.id,
          is_premium: isPremium,
          tags: tagArray,
          status: isAdmin ? 'approved' : 'pending',
          is_approved: isAdmin,
        });
        if (error) { toast(error.message, 'error'); return; }
      }

      resetForm();
      onSuccess();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={type === 'document' ? t('uploadDoc') : t('uploadEbook')} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* File drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
              : file
                ? 'border-success-400 bg-success-50 dark:bg-success-950/20'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-950/20'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept={type === 'document' ? ACCEPTED_DOC_TYPES : ACCEPTED_EBOOK_TYPES}
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-8 h-8 text-success-500" />
              <div className="text-left">
                <p className="font-medium text-neutral-800 dark:text-white text-sm">{file.name}</p>
                <p className="text-xs text-neutral-500">{formatBytes(file.size)}</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} className="ml-2 text-neutral-400 hover:text-error-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('dragDrop')}</p>
              <p className="text-sm text-neutral-400 mb-2">{t('orBrowse')}</p>
              <p className="text-xs text-neutral-400">{type === 'document' ? t('acceptedFormats') : 'Accepted: PDF, EPUB'}</p>
              <p className="text-xs text-neutral-400 mt-1">Max size: {MAX_SIZE_MB}MB</p>
            </>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('title')} *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Enter document title" required />
        </div>

        {/* Author (ebook only) */}
        {type === 'ebook' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Author</label>
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="input" placeholder="Author name" />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('description')}</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input resize-none" placeholder="Brief description of this document..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('category')}</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input">
              <option value="">{t('selectCategory')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              <Tag className="w-3.5 h-3.5 inline mr-1" /> {t('addTags')}
            </label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="input" placeholder="nursing, bsc, anatomy (comma separated)" />
          </div>
        </div>

        {/* Thumbnail / Cover image */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            <ImageIcon className="w-3.5 h-3.5 inline mr-1" /> Cover Image (optional)
          </label>
          <input
            ref={thumbRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbnail(f); }}
            className="hidden"
          />
          {thumbnailPreview ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 group">
              <img src={thumbnailPreview} alt="thumbnail" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setThumbnail(null); URL.revokeObjectURL(thumbnailPreview); setThumbnailPreview(''); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => thumbRef.current?.click()}
              className="w-full h-28 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-primary-500 transition-colors"
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs">Click to upload a cover image (max {MAX_IMAGE_MB}MB)</span>
            </button>
          )}
        </div>

        {/* Premium toggle */}
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
          <div
            onClick={() => setIsPremium(!isPremium)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isPremium ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPremium ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-800 dark:text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" /> {t('setPremium')}
            </div>
            <div className="text-xs text-neutral-500">Only Pro/Premium subscribers can access</div>
          </div>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button type="button" onClick={onClose} className="btn-ghost flex-1" disabled={uploading}>
            {t('cancel')}
          </button>
          <button type="submit" disabled={uploading} className="btn-primary flex-1">
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('uploading')}</>
            ) : (
              <><Upload className="w-4 h-4" /> {t('upload')}</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
