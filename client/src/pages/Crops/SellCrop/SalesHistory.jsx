import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSales } from '../../../services/salesService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import AppShell from '../../../components/common/AppShell';
import StatCard from '../../../components/common/StatCard';
import './SalesHistory.css';

function isToday(ts) {
  if (!ts) return false;

  const date = new Date(ts);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.toDateString() ===
    new Date().toDateString()
  );
}

function formatSaleDate(ts) {
  if (!ts) return '—';

  const date = new Date(ts);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function SalesHistory() {
  const navigate = useNavigate();
  const { t } = useTranslation(['listings']);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sales, setSales] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function loadSales() {
      try {
        const result = await getSales({
          ownerId: user.id,
        });

        if (cancelled) return;

        setSales(
          Array.isArray(result)
            ? result
            : []
        );
      } catch {
        if (cancelled) return;

        setSales([]);

        showToast(
          t('listings:salesScreen.loadFailed')
        );
      }
    }

    loadSales();

    return () => {
      cancelled = true;
    };
  }, [user, showToast, t]);

  /*
   * Keep the existing calculation because the backend contract
   * for saleAmount has not been confirmed yet.
   */
  const todayTotal = sales
    .filter((sale) => isToday(sale.soldAt))
    .reduce(
      (sum, sale) =>
        sum +
        (
          Number(sale.saleAmount) *
          Number(sale.quantitySold)
        || 0),
      0
    );

  return (
    <AppShell
      title={t('listings:salesScreen.title')}
      onBack={() => navigate('/sell/dashboard')}
    >
      <div className="sales-page">
        <div className="sales-stat-row">
          <StatCard
            label={t(
              'listings:salesScreen.todaySales'
            )}
            value={`₹${Math.round(
              todayTotal
            ).toLocaleString('en-IN')}`}
          />

          <StatCard
            label={t(
              'listings:salesScreen.totalSold'
            )}
            value={sales.length}
          />
        </div>

        <div className="sales-card">
          <div className="sales-card-head">
            <h3>
              {t('listings:salesScreen.title')}
            </h3>

            <p>
              {t('listings:salesScreen.subtitle')}
            </p>
          </div>

          {sales.length === 0 ? (
            <div className="sales-empty">
              <span className="icon">🧾</span>

              <b>
                {t(
                  'listings:salesScreen.emptyTitle'
                )}
              </b>

              <span>
                {t(
                  'listings:salesScreen.emptyBody'
                )}
              </span>
            </div>
          ) : (
            sales.map((sale) => (
              <div
                className="sales-list-item"
                key={sale.id}
              >
                <div className="l">
                  <div className="ic">
                    🌾
                  </div>

                  <div>
                    <b>
                      {sale.itemName || '—'}
                    </b>

                    <span>
                      {sale.quantitySold ?? '—'}{' '}
                      {sale.unit || ''} ·{' '}
                      {sale.buyerName || 'Buyer'}
                    </span>
                  </div>
                </div>

                <div className="r">
                  <b>
                    ₹{sale.saleAmount ?? 0}
                  </b>

                  <span>
                    {formatSaleDate(
                      sale.soldAt
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}