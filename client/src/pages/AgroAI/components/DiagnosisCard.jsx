import { useTranslation } from 'react-i18next';
import { IconLeaf, IconAlertTriangle, IconCircleCheck, IconGauge, IconHelp, IconShieldCheck } from '../../../components/icons';
import ExpandableSection from '../../../components/common/ExpandableSection';
import './DiagnosisCard.css';

// Purely presentational (per Step 7 scope) - all content via props.
// Field labels (Possible Problem, Severity, etc.) are the component's
// own chrome text, not data, so they're resolved via the shared
// localization system here rather than passed as props (Step 15).
export default function DiagnosisCard({
  problem,
  severity,
  suggestedAction,
  disclaimer,
  confidence,
  likelyCause,
  prevention,
  expanded,
  onToggle,
}) {
  const { t } = useTranslation(['agroAI']);

  return (
    <article className="diagnosis-card">
      <dl className="diagnosis-card-fields">
        <div className="diagnosis-card-field">
          <dt><IconLeaf size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:diagnosisCard.possibleProblem')}</dt>
          <dd>{problem}</dd>
        </div>

        <div className="diagnosis-card-field">
          <dt><IconAlertTriangle size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:diagnosisCard.severity')}</dt>
          <dd>{severity}</dd>
        </div>

        <div className="diagnosis-card-field">
          <dt><IconCircleCheck size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:diagnosisCard.suggestedAction')}</dt>
          <dd className="diagnosis-card-action">{suggestedAction}</dd>
        </div>
      </dl>

      {disclaimer && <p className="diagnosis-card-disclaimer">{disclaimer}</p>}

      <ExpandableSection label={t('agroAI:diagnosisCard.moreDetails')} expanded={expanded} onToggle={onToggle}>
        <dl className="diagnosis-card-fields">
          <div className="diagnosis-card-field">
            <dt><IconGauge size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:diagnosisCard.howSureAmI')}</dt>
            <dd>{confidence}</dd>
          </div>
          <div className="diagnosis-card-field">
            <dt><IconHelp size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:diagnosisCard.likelyCause')}</dt>
            <dd>{likelyCause}</dd>
          </div>
          <div className="diagnosis-card-field">
            <dt><IconShieldCheck size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:diagnosisCard.prevention')}</dt>
            <dd>{prevention}</dd>
          </div>
        </dl>
      </ExpandableSection>
    </article>
  );
}
