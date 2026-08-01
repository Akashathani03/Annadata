import { useTranslation } from 'react-i18next';
import { IconLeaf, IconSprout, IconDroplet, IconPackage, IconSprayCan, IconCalendar, IconAlertTriangle } from '../../../components/icons';
import './FertilizerCard.css';

export default function FertilizerCard({
  cropName,
  growthStage,
  fertilizerName,
  quantity,
  applicationMethod,
  applicationTime,
  precautions,
  alternativeFertilizer,
  disclaimer,
}) {
  const { t } = useTranslation(['agroAI']);

  return (
    <article className="fertilizer-card">
      <dl className="fertilizer-card-fields">
        {cropName && (
          <div className="fertilizer-card-field">
            <dt><IconLeaf size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:fertilizerCard.crop')}</dt>
            <dd>{cropName}</dd>
          </div>
        )}

        {growthStage && (
          <div className="fertilizer-card-field">
            <dt><IconSprout size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:fertilizerCard.growthStage')}</dt>
            <dd>{growthStage}</dd>
          </div>
        )}

        {fertilizerName && (
          <div className="fertilizer-card-field">
            <dt><IconDroplet size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:fertilizerCard.recommendedFertilizer')}</dt>
            <dd className="fertilizer-card-highlight">{fertilizerName}</dd>
          </div>
        )}

        {quantity && (
          <div className="fertilizer-card-field">
            <dt><IconPackage size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:fertilizerCard.quantity')}</dt>
            <dd>{quantity}</dd>
          </div>
        )}

        {applicationMethod && (
          <div className="fertilizer-card-field">
            <dt><IconSprayCan size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:fertilizerCard.applicationMethod')}</dt>
            <dd>{applicationMethod}</dd>
          </div>
        )}

        {applicationTime && (
          <div className="fertilizer-card-field">
            <dt><IconCalendar size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:fertilizerCard.bestTimeToApply')}</dt>
            <dd>{applicationTime}</dd>
          </div>
        )}

        {precautions && (
          <div className="fertilizer-card-field">
            <dt><IconAlertTriangle size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:fertilizerCard.precautions')}</dt>
            <dd>{precautions}</dd>
          </div>
        )}

        {alternativeFertilizer && (
          <div className="fertilizer-card-field">
            <dt><IconDroplet size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:fertilizerCard.alternativeFertilizer')}</dt>
            <dd>{alternativeFertilizer}</dd>
          </div>
        )}
      </dl>

      {disclaimer && <p className="fertilizer-card-disclaimer">{disclaimer}</p>}
    </article>
  );
}
