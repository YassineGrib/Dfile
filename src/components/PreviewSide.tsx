import React from 'react';
import { useLanguage } from './LanguageContext';

export const PreviewSide: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="preview-side">
      <div className="preview-side-wrapper">
        <div className="preview-content-top">
          <span className="preview-badge">{t('tagline-eyebrow')}</span>
          <h2 className="preview-headline">{t('tagline-headline')}</h2>
        </div>
        
        <div className="preview-cover-container">
          <img 
            src="/assets/cover.png" 
            alt="Fintask Illustration Mascot" 
            className="preview-cover-image" 
          />
        </div>
      </div>
    </div>
  );
};
