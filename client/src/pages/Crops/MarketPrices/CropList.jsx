import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApmcMarkets, getCropPricesForApmc } from '../../../services/marketPricesService';
import { useUserLocation } from '../../../context/LocationContext';
import BackLink from '../../../components/common/BackLink';
import SearchInput from '../../../components/common/SearchInput';
import './MarketPrices.css';

export default function CropList() {
  const { apmcId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('marketPrices');
  const { lat, lng } = useUserLocation();
  const [apmc, setApmc] = useState(undefined); // undefined = loading, null = not found
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getApmcMarkets({ lat, lng }), getCropPricesForApmc(apmcId)]).then(([apmcs, prices]) => {
      if (cancelled) return;
      setApmc(apmcs.find((a) => a.id === apmcId) ?? null);
      setRows(prices);
    });
    return () => {
      cancelled = true;
    };
  }, [apmcId, lat, lng]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.crop.name.toLowerCase().includes(q));
  }, [rows, query]);

  // BackLink now renders unconditionally, before either the loading or
  // not-found state is known - previously `if (!apmc) return null`
  // hid it in both cases, leaving a genuinely blank, dead-end screen
  // with no way back if a market ID didn't resolve (not just during
  // the brief loading window).
  return (
    <div className="mp-page">
      <BackLink label={t('backToMarkets')} onClick={() => navigate('/market-prices')} />

      {apmc === undefined && <div className="mp-note">{t('loading')}</div>}

      {apmc === null && <div className="mp-note">{t('marketNotFound')}</div>}

      {apmc && (
        <>
          <div className="mp-market-bar">
            <div className="mp-market-left">
              📍 <b>{apmc.name}</b>
              {apmc.isNearest && <span className="mp-tag-pill">{t('nearest')}</span>}
            </div>
          </div>

          <SearchInput value={query} onChange={setQuery} placeholder={t('searchPlaceholder')} />

          <table className="mp-table">
            <thead>
              <tr>
                <th>{t('table.crop')}</th>
                <th>{t('table.min')}</th>
                <th>{t('table.modal')}</th>
                <th>{t('table.max')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.cropId} onClick={() => navigate(`/market-prices/${apmcId}/${row.cropId}`)}>
                  <td>
                    <span className="mp-crop-icon-sm">{row.crop.icon}</span>
                    {row.crop.name}
                  </td>
                  <td className="mp-red">{row.minPrice}</td>
                  <td className="mp-green">{row.modalPrice}</td>
                  <td className="mp-orange">{row.maxPrice}</td>
                  <td className="mp-chev">›</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mp-note">💡 {t('tapHint')}</div>
        </>
      )}
    </div>
  );
}
