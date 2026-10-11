import React, { useEffect, useState } from 'react';
import { DatabaseBackup, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { getLegacyImportStatus, importLegacyData, type LegacyImportResult } from '../firebase/legacyImport';

type BannerState =
  | { kind: 'hidden' }
  | { kind: 'offer' }
  | { kind: 'importing' }
  | { kind: 'done'; result: LegacyImportResult }
  | { kind: 'error'; message: string };

/**
 * Offers a one-time import of data saved before workspaces became private per user.
 * Imported records show up on their own through the live Firestore listeners.
 */
export const LegacyImportBanner: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [state, setState] = useState<BannerState>({ kind: 'hidden' });

  useEffect(() => {
    let cancelled = false;
    getLegacyImportStatus().then((status) => {
      if (!cancelled && status === 'available') setState({ kind: 'offer' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleImport = async () => {
    setState({ kind: 'importing' });
    try {
      const result = await importLegacyData();
      setState({ kind: 'done', result });
    } catch (err) {
      console.error('Legacy import failed:', err);
      setState({
        kind: 'error',
        message: isAr
          ? 'تعذر استيراد البيانات. تحقق من الاتصال وحاول مرة أخرى.'
          : 'Could not import the data. Check your connection and try again.',
      });
    }
  };

  if (state.kind === 'hidden') return null;

  const dismiss = () => setState({ kind: 'hidden' });

  return (
    <div className={`legacy-import-banner ${state.kind === 'done' ? 'is-success' : ''}`} role="status">
      <span className="legacy-import-icon" aria-hidden="true">
        {state.kind === 'done' ? <CheckCircle2 size={18} /> : <DatabaseBackup size={18} />}
      </span>

      <div className="legacy-import-text">
        {state.kind === 'done' ? (
          <>
            <strong>{isAr ? 'تم استيراد بياناتك' : 'Your data has been imported'}</strong>
            <span>
              {isAr
                ? `تم نقل ${state.result.imported} عنصر إلى حسابك الخاص.`
                : `${state.result.imported} records moved into your private workspace.`}
              {state.result.skipped > 0 &&
                (isAr
                  ? ` تم تخطي ${state.result.skipped} عنصر غير صالح.`
                  : ` ${state.result.skipped} invalid records were skipped.`)}
            </span>
          </>
        ) : state.kind === 'error' ? (
          <>
            <strong>{isAr ? 'فشل الاستيراد' : 'Import failed'}</strong>
            <span>{state.message}</span>
          </>
        ) : (
          <>
            <strong>{isAr ? 'تم العثور على بيانات سابقة' : 'Previous data found'}</strong>
            <span>
              {isAr
                ? 'أصبحت مساحات العمل خاصة بكل مستخدم. استورد بياناتك السابقة إلى حسابك — يمكن لحساب واحد فقط القيام بذلك.'
                : 'Workspaces are now private to each account. Import your earlier data into this account — only one account can claim it.'}
            </span>
          </>
        )}
      </div>

      <div className="legacy-import-actions">
        {(state.kind === 'offer' || state.kind === 'error' || state.kind === 'importing') && (
          <button
            type="button"
            className="legacy-import-btn"
            onClick={handleImport}
            disabled={state.kind === 'importing'}
          >
            {state.kind === 'importing' && <Loader2 size={14} className="legacy-import-spin" aria-hidden="true" />}
            {state.kind === 'importing'
              ? (isAr ? 'جارٍ الاستيراد…' : 'Importing…')
              : state.kind === 'error'
                ? (isAr ? 'إعادة المحاولة' : 'Try again')
                : (isAr ? 'استيراد البيانات السابقة' : 'Import previous data')}
          </button>
        )}
        {state.kind !== 'importing' && (
          <button
            type="button"
            className="legacy-import-dismiss"
            onClick={dismiss}
            aria-label={isAr ? 'إغلاق' : 'Dismiss'}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
