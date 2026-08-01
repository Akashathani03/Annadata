import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSales } from '../../../services/salesService';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/common/StatCard';
import './SalesHistory.css';

function isToday(ts) {
  return new Date(ts).toDateString() === new Date().toDateString();
}

export default function SalesHistory() {
  const { t } = useTranslation(['listings']);
  const { user } = useAuth();
  const [sales, setSales] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getSales({ ownerId: user.id }).then((result) => {
      if (!cancelled) setSales(result);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const todayTotal = sales
    .filter((s) => isToday(s.soldAt))
    .reduce((sum, s) => sum + (Number(s.saleAmount) * Number(s.quantitySold) || 0), 0);

  return (
    <div className="sales-page">
      <div className="sales-stat-row">
        <StatCard label={t('listings:salesScreen.todaySales')} value={`₹${Math.round(todayTotal).toLocaleString('en-IN')}`} />
        <StatCard label={t('listings:salesScreen.totalSold')} value={sales.length} />
      </div>

      <div className="sales-card">
        <div className="sales-card-head">
          <h3>{t('listings:salesScreen.title')}</h3>
          <p>{t('listings:salesScreen.subtitle')}</p>
        </div>

        {sales.length === 0 ? (
          <div className="sales-empty">
            <span className="icon">🧾</span>
            <b>{t('listings:salesScreen.emptyTitle')}</b>
            <span>{t('listings:salesScreen.emptyBody')}</span>
          </div>
        ) : (
          sales.map((s) => (
            <div className="sales-list-item" key={s.id}>
              <div className="l">
                <div className="ic">🌾</div>
                <div><b>{s.itemName}</b><span>{s.quantitySold} {s.unit} · {s.buyerName}</span></div>
              </div>
              <div className="r">
                <b>₹{s.saleAmount}</b>
                <span>{new Date(s.soldAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
