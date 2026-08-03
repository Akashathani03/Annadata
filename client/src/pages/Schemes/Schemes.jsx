import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSchemes } from '../../services/governmentSchemesService';
import { getMyApplications, applyToScheme } from '../../services/schemeApplicationsService';
import { useToast } from '../../context/ToastContext';
import AppShell from '../../components/common/AppShell';
import Modal from '../../components/common/Modal';
import Panel from '../../components/common/Panel';
import SchemeCard from './SchemeCard';
import { IconSettings, IconHelp } from '../../components/icons';
import './Schemes.css';

export default function Schemes() {
  const navigate = useNavigate();
  const { t } = useTranslation(['govSchemes', 'common']);
  const { showToast } = useToast();

  const [type, setType] = useState('all');
  const [stateFilter, setStateFilter] = useState('Karnataka');
  const [schemes, setSchemes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [detailScheme, setDetailScheme] = useState(null);

  async function reload() {
    try {
      const [schemeList, appList] = await Promise.all([
        getSchemes({ type, stateFilter }),
        getMyApplications(),
      ]);
      setSchemes(schemeList);
      setApplications(appList);
    } catch {
      showToast(t('govSchemes:loadFailed'));
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, stateFilter]);

  function handleStateFilterChange(value) {
    setStateFilter(value);
    showToast(value === 'All' ? 'Showing central + all state schemes' : '📍 Showing central + Karnataka state schemes');
  }

  async function handleApply(scheme) {
    showToast(t('govSchemes:openingOfficialSite', { title: scheme.title }));
    window.open(scheme.officialUrl, '_blank', 'noopener,noreferrer');
    try {
      await applyToScheme(scheme.id);
      setDetailScheme(null);
      reload();
    } catch {
      showToast(t('govSchemes:loadFailed'));
    }
  }

  return (
    <AppShell title={t('govSchemes:title')} onBack={() => navigate('/')}>
      <div className="schemes-page">
        <p className="scheme-page-sub">{t('govSchemes:subtitle')}</p>

        <div className="scheme-banner">
          <div className="txt">
            <b>{t('govSchemes:bannerTitle')}</b>
            <div>{t('govSchemes:bannerBody')}</div>
          </div>
          <div className="art">📜🌾</div>
        </div>

        <div className="scheme-filter">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">{t('govSchemes:filterType.all')}</option>
            <option value="central">{t('govSchemes:filterType.central')}</option>
            <option value="state">{t('govSchemes:filterType.state')}</option>
          </select>
          <select value={stateFilter} onChange={(e) => handleStateFilterChange(e.target.value)}>
            <option value="Karnataka">{t('govSchemes:filterState.karnataka')}</option>
            <option value="All">{t('govSchemes:filterState.all')}</option>
          </select>
          <select>
            <option>{t('govSchemes:sortByDeadline')}</option>
          </select>
          <button className="scheme-filter-icon-btn" onClick={() => showToast(t('govSchemes:filtersComingSoon'))}>
            <IconSettings size={14} strokeWidth={2} /> {t('govSchemes:filtersButton')}
          </button>
        </div>

        {schemes.map((scheme) => (
          <SchemeCard
            key={scheme.id}
            scheme={scheme}
            onViewDetails={setDetailScheme}
            onApply={handleApply}
          />
        ))}

        <button className="scheme-loadmore-btn" onClick={() => showToast(t('govSchemes:loadMoreComingSoon'))}>
          {t('govSchemes:loadMore')}
        </button>

        <Panel title={t('govSchemes:myApplications.title')}>
          {applications.length === 0 ? (
            <span className="scheme-track-empty">{t('govSchemes:myApplications.empty')}</span>
          ) : (
            applications.map((app, i) => (
              <div className="track-row" key={app.id} style={i === applications.length - 1 ? { marginBottom: 0 } : undefined}>
                <div>
                  <b>{app.schemeTitle}</b>
                  <span>Submitted {new Date(app.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <span className={`track-status ${app.status === 'Approved' ? 'st-approved' : 'st-review'}`}>{app.status}</span>
              </div>
            ))
          )}
        </Panel>

        <Panel title={t('govSchemes:eligibility.title')}>
          <div className="elig-item">{t('govSchemes:eligibility.item1')}</div>
          <div className="elig-item">{t('govSchemes:eligibility.item2')}</div>
          <div className="elig-item" style={{ marginBottom: 0 }}>{t('govSchemes:eligibility.item3')}</div>
        </Panel>

        <Panel className="helpdesk-box">
          <b>{t('govSchemes:helpdesk.title')}</b>
          <p>{t('govSchemes:helpdesk.body')}</p>
          <button className="scheme-helpdesk-icon-btn" onClick={() => showToast(t('govSchemes:helpdesk.comingSoon'))}>
            <IconHelp size={15} strokeWidth={2} /> {t('govSchemes:helpdesk.button')}
          </button>
        </Panel>
      </div>

      <Modal open={!!detailScheme} onClose={() => setDetailScheme(null)} wide>
        {detailScheme && (
          <>
            <h3>{detailScheme.title}</h3>
            <p className="msub">{detailScheme.dept}</p>
            <p className="scheme-detail-desc">{detailScheme.detailDescription || detailScheme.description}</p>
            <div className="scheme-meta" style={{ margin: '14px 0' }}>
              <span>💵 <b>{detailScheme.detailAmount || detailScheme.amount}</b></span>
              <span>📅 {t('govSchemes:deadlineLabel')}: <b>{detailScheme.detailDeadline || detailScheme.deadline}</b></span>
            </div>
            <div className="scheme-detail-elig-label">{t('govSchemes:detail.eligibility')}</div>
            <ul className="scheme-detail-elig-list">
              {detailScheme.eligibility.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <button className="btn-apply scheme-detail-apply-btn" onClick={() => handleApply(detailScheme)}>
              {t('govSchemes:detail.applyOnOfficialSite')}
            </button>
            <p className="modal-note">{t('govSchemes:detail.note')}</p>
          </>
        )}
      </Modal>
    </AppShell>
  );
}
