import React, { useMemo } from 'react';
import { blobatar } from 'blobatar';

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  animate?: 'hover' | 'always' | 'none';
  title?: string;
  background?: boolean | 'square' | 'circle' | 'squircle';
  variant?: 'standard' | 'watermark';
}

/**
 * Blobatar Avatar Component (from blobatar.dev)
 * Generates consistent, unique geometric character avatars belonging to the same visual family.
 * Uses core blobatar generator with zero external hook dependencies for seamless React 19 compatibility.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = 36,
  className = '',
  style = {},
  animate = 'hover',
  title,
  background,
  variant = 'standard',
}) => {
  const cleanName = name?.trim() || 'User';

  const isWatermark = variant === 'watermark';
  const resolvedBg = background !== undefined 
    ? background 
    : (isWatermark ? false : 'circle');

  // Generate deterministic SVG character
  const svgMarkup = useMemo(() => {
    try {
      return blobatar(cleanName, {
        size,
        background: resolvedBg,
        title: title || cleanName,
      });
    } catch (e) {
      console.warn('Blobatar generation fallback for', cleanName, e);
      return '';
    }
  }, [cleanName, size, resolvedBg, title]);

  return (
    <div 
      className={`user-blobatar-wrapper ${isWatermark ? 'user-blobatar-watermark' : ''} ${animate !== 'none' && !isWatermark ? `user-blobatar-${animate}` : ''} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: isWatermark ? '0' : '50%',
        overflow: isWatermark ? 'visible' : 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isWatermark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: isWatermark ? 'none' : '1.5px solid rgba(255, 255, 255, 0.9)',
        cursor: 'default',
        flexShrink: 0,
        ...style
      }}
      title={title || cleanName}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};

