import React, { useMemo } from 'react';
import { blobatar } from 'blobatar';

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  animate?: 'hover' | 'always' | 'none';
  title?: string;
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
}) => {
  const cleanName = name?.trim() || 'User';

  // Generate deterministic SVG character
  const svgMarkup = useMemo(() => {
    try {
      return blobatar(cleanName, {
        size,
        background: 'circle',
        title: title || cleanName,
      });
    } catch (e) {
      console.warn('Blobatar generation fallback for', cleanName, e);
      return '';
    }
  }, [cleanName, size, title]);

  return (
    <div 
      className={`user-blobatar-wrapper ${animate !== 'none' ? `user-blobatar-${animate}` : ''} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1.5px solid rgba(255, 255, 255, 0.9)',
        cursor: 'default',
        flexShrink: 0,
        ...style
      }}
      title={title || cleanName}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};

