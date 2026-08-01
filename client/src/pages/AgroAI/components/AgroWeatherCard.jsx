import { useTranslation } from 'react-i18next';
import { IconCloud, IconCloudRain, IconDroplets, IconWind, IconCircleCheck, IconAlertTriangle } from '../../../components/icons';
import './AgroWeatherCard.css';

// Purely presentational (per Step 8 scope) - no API calls, no weather
// service, no business logic. All content via props, same dl/dt/dd
// label-value pattern already established in DiagnosisCard for
// consistency across every Agro AI card type.
//
// wind and alert are optional - the finalized design's original
// locked mockup only showed condition + one recommendation line; this
// spec asks for a richer field set (humidity, wind, alert), which is
// what's built here. Flagging in case that expansion wasn't intended
// versus the earlier locked version.
export default function AgroWeatherCard({
  summary,
  temperature,
  rainPrediction,
  humidity,
  wind,
  recommendation,
  alert,
}) {
  const { t } = useTranslation(['agroAI']);

  return (
    <article className="weather-card">
      {alert && (
        <div className="weather-card-alert">
          <IconAlertTriangle size={14} strokeWidth={2} aria-hidden="true" />
          <span>{alert}</span>
        </div>
      )}

      <div className="weather-card-summary">
        <IconCloud size={26} strokeWidth={2} aria-hidden="true" />
        <div>
          {temperature && <p className="weather-card-temp">{temperature}</p>}
          {summary && <p className="weather-card-condition">{summary}</p>}
        </div>
      </div>

      <dl className="weather-card-fields">
        {rainPrediction && (
          <div className="weather-card-field">
            <dt><IconCloudRain size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:weatherCard.rain')}</dt>
            <dd>{rainPrediction}</dd>
          </div>
        )}
        {humidity && (
          <div className="weather-card-field">
            <dt><IconDroplets size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:weatherCard.humidity')}</dt>
            <dd>{humidity}</dd>
          </div>
        )}
        {wind && (
          <div className="weather-card-field">
            <dt><IconWind size={14} strokeWidth={2} aria-hidden="true" /> {t('agroAI:weatherCard.wind')}</dt>
            <dd>{wind}</dd>
          </div>
        )}
      </dl>

      {recommendation && (
        <p className="weather-card-recommendation">
          <IconCircleCheck size={14} strokeWidth={2} aria-hidden="true" />
          <span>{recommendation}</span>
        </p>
      )}
    </article>
  );
}
