// Photos tab — gallery with upload for owner
import React, { useState, useRef } from 'react';
import { Photo } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePaginated } from '../../hooks/useFetch';
import { api } from '../../services/api';

interface PhotosProps {
  username: string;
}

const Photos: React.FC<PhotosProps> = ({ username }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isOwner = user?.username === username;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    items: photos,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePaginated<Photo>(`/photos/user/${username}`, 20, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('请选择图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('图片大小不能超过 10MB');
      return;
    }
    setUploadError('');
    setPreviewFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewFile) return;
    setUploading(true);
    try {
      await api.post('/photos', {
        image_url: previewUrl,
        caption: '',
      });
      setPreviewUrl(null);
      setPreviewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refresh();
    } catch {
      setUploadError('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm('确定要删除这张照片吗？')) return;
    try {
      await api.delete(`/photos/${photo.id}`);
      if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
      refresh();
    } catch {
      alert('删除失败');
    }
  };

  return (
    <section aria-labelledby="photos-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 id="photos-heading" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          照片墙
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isOwner && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary btn-sm"
              >
                + 上传照片
              </button>
            </>
          )}
          <button onClick={refresh} className="btn btn-sm btn-outline">
            ↻ 刷新
          </button>
        </div>
      </div>

      {/* Upload preview */}
      {previewUrl && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          border: `1px solid ${colors.border}`,
          background: colors.bgSecondary,
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}>
          <img
            src={previewUrl}
            alt="Upload preview"
            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius)' }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.5rem' }}>
              {previewFile?.name} ({(previewFile!.size / 1024).toFixed(1)} KB)
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary btn-sm"
              >
                {uploading ? '上传中...' : '确认上传'}
              </button>
              <button
                onClick={() => { setPreviewUrl(null); setPreviewFile(null); setUploadError(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="btn btn-outline btn-sm"
              >
                取消
              </button>
            </div>
            {uploadError && (
              <p style={{ fontSize: '0.8rem', color: colors.error, marginTop: '0.35rem' }}>{uploadError}</p>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && photos?.length === 0 && (
        <div className="empty-state">
          <div className="spinner"><span className="sr-only">加载中...</span></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="empty-state">
          <p style={{ color: colors.error }}>加载失败：{error}</p>
          <button onClick={refresh} className="btn btn-primary btn-sm">重试</button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && photos?.length === 0 && (
        <div className="empty-state">
          <p>暂无照片</p>
        </div>
      )}

      {/* Photo grid */}
      {photos && photos.length > 0 && (
        <div
          className="photo-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {photos.map((photo: Photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                cursor: 'pointer',
                background: colors.bgSecondary,
              }}
            >
              <img
                src={photo.image_url}
                alt={photo.caption || 'Photo'}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {isOwner && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem',
          }}
        >
          <img
            src={selectedPhoto.image_url}
            alt={selectedPhoto.caption || 'Photo'}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius)',
            }}
            onClick={e => e.stopPropagation()}
          />
          {selectedPhoto.caption && (
            <p style={{
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#fff',
              fontSize: '0.95rem',
            }}>
              {selectedPhoto.caption}
            </p>
          )}
        </div>
      )}

      {/* Load more sentinel */}
      {hasMore && !isLoading && photos && photos.length > 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <button onClick={loadMore} className="btn btn-outline">
            加载更多
          </button>
        </div>
      )}
    </section>
  );
};

export default Photos;
