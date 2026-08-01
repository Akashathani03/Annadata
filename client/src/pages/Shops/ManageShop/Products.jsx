import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyShop } from '../../../services/shopsService';
import { getMyProducts, addProducts, updateProduct, toggleAvailability, deleteProduct } from '../../../services/shopProductsService';
import { recordSale } from '../../../services/shopSalesService';
import { shopProductCategories, getShopCatalogByCategory } from '../../../config/shopProductCatalog';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import BottomSheet from '../../../components/common/BottomSheet';
import SegmentedTabs from '../../../components/common/SegmentedTabs';
import { IconAdd } from '../../../components/icons';
import './ManageShop.css';

export default function Products() {
  const { t } = useTranslation(['shops']);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [subView, setSubView] = useState('myproducts');
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);

  const [addStep, setAddStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [manualName, setManualName] = useState('');
  const [manualItems, setManualItems] = useState([]);
  const [priceDrafts, setPriceDrafts] = useState({});

  const [sheet, setSheet] = useState(null); // { type: 'price'|'sale', product }
  const [sheetValue, setSheetValue] = useState('');

  async function reload(shopId) {
    const list = await getMyProducts(shopId);
    setProducts(list);
  }

  useEffect(() => {
    if (!user) return;
    getMyShop(user.id).then((s) => {
      setShop(s);
      if (s) reload(s.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const catalogForCategory = useMemo(
    () => (category ? getShopCatalogByCategory(category) : []),
    [category]
  );
  const filteredCatalog = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return catalogForCategory;
    return catalogForCategory.filter((c) => c.name.toLowerCase().includes(q));
  }, [catalogForCategory, productSearch]);

  const allSelected = useMemo(() => {
    const catalogSelected = catalogForCategory.filter((c) => selectedIds.includes(c.id));
    return [...catalogSelected, ...manualItems];
  }, [catalogForCategory, selectedIds, manualItems]);

  function startAdd() {
    setSubView('add');
    setAddStep(1);
    setCategory(null);
    setSelectedIds([]);
    setManualItems([]);
    setManualName('');
    setPriceDrafts({});
  }

  function toggleSelect(itemId) {
    setSelectedIds((prev) => (prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]));
  }

  function addManual() {
    if (!manualName.trim()) return;
    setManualItems((prev) => [...prev, { id: `manual_${Date.now()}`, name: manualName.trim(), category, manual: true }]);
    setManualName('');
  }

  async function handleSaveProducts() {
    if (!shop) return;
    const items = allSelected.map((item) => ({
      itemId: item.manual ? null : item.id,
      category,
      name: item.name,
      price: Number(priceDrafts[item.id]) || 0,
      availability: 'In Stock',
    }));
    await addProducts(shop.id, items);
    await reload(shop.id);
    showToast(t('shops:manage.productsSaved'));
    setSubView('myproducts');
  }

  async function handleToggleAvailability(id) {
    await toggleAvailability(id);
    reload(shop.id);
  }

  async function handleDelete(id) {
    if (!window.confirm(t('shops:manage.deleteConfirm'))) return;
    await deleteProduct(id);
    reload(shop.id);
  }

  function openPriceSheet(product) {
    setSheetValue(String(product.price));
    setSheet({ type: 'price', product });
  }

  function openSaleSheet(product) {
    setSheetValue('1');
    setSheet({ type: 'sale', product });
  }

  async function confirmSheet() {
    if (sheet.type === 'price') {
      await updateProduct(sheet.product.id, { price: Number(sheetValue) || 0 });
      showToast(t('shops:manage.shopSaved'));
    } else if (sheet.type === 'sale') {
      await recordSale({ shopId: shop.id, productId: sheet.product.id, productName: sheet.product.name, quantity: Number(sheetValue) || 1 });
      showToast(t('shops:manage.saleRecorded'));
    }
    setSheet(null);
    reload(shop.id);
  }

  if (subView === 'add') {
    return (
      <div className="som-page">
        <div className="som-progress">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`som-progress-step${addStep === n ? ' active' : ''}`}>
              <span className="num">{n}</span>{t(`shops:manage.step${n}`)}
            </span>
          ))}
        </div>

        {addStep === 1 && (
          <>
            <div className="som-sec-title">{t('shops:manage.chooseCategory')}</div>
            <div className="som-cat-grid">
              {shopProductCategories.map((c) => (
                <div key={c.id} className="som-cat-card" onClick={() => { setCategory(c.id); setAddStep(2); }}>
                  <span className="ic">{c.icon}</span>{t(`shops:categories.${c.id}`)}
                </div>
              ))}
            </div>
            <button className="som-back-link" onClick={() => setSubView('myproducts')}>← {t('shops:manage.myProducts')}</button>
          </>
        )}

        {addStep === 2 && (
          <>
            <button className="som-back-link" onClick={() => setAddStep(1)}>← Back</button>
            <div className="som-sec-title">{t('shops:manage.selectProducts')}</div>
            <input className="som-input" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder={`🔍 ${t('shops:manage.searchProducts')}`} />
            <div className="som-choice-list">
              {filteredCatalog.map((item) => (
                <div key={item.id} className={`som-choice-item${selectedIds.includes(item.id) ? ' active' : ''}`} onClick={() => toggleSelect(item.id)}>
                  <span>{item.icon} {item.name}</span>
                  <span className="dot" />
                </div>
              ))}
              {manualItems.map((item) => (
                <div key={item.id} className="som-choice-item active">
                  <span>🛍️ {item.name}</span>
                  <span className="dot" />
                </div>
              ))}
            </div>
            <div className="som-manual-add" onClick={() => setManualName(manualName === '' ? ' ' : '')}>
              <IconAdd size={14} strokeWidth={2.5} /> {t('shops:manage.cantFindProduct')}
            </div>
            {manualName !== '' && (
              <div className="som-manual-form">
                <input className="som-input" value={manualName.trim()} onChange={(e) => setManualName(e.target.value)} placeholder={t('shops:manage.typeProductName')} />
                <button className="som-btn-sm" onClick={addManual}>{t('shops:manage.add')}</button>
              </div>
            )}
            <div style={{ height: 70 }} />
            <div className="som-sticky-bar">
              <span className="som-selected-count">{t('shops:manage.selectedCount', { count: allSelected.length })}</span>
              <button className="som-save-btn" disabled={allSelected.length === 0} onClick={() => setAddStep(3)}>{t('shops:manage.next')}</button>
            </div>
          </>
        )}

        {addStep === 3 && (
          <>
            <button className="som-back-link" onClick={() => setAddStep(2)}>← Back</button>
            <div className="som-sec-title">{t('shops:manage.priceAvailability')}</div>
            <div className="som-price-cards">
              {allSelected.map((item) => (
                <div className="som-price-card" key={item.id}>
                  <b>{item.name}</b>
                  <div className="som-price-input">
                    <span>₹</span>
                    <input
                      type="number"
                      value={priceDrafts[item.id] || ''}
                      onChange={(e) => setPriceDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 70 }} />
            <div className="som-sticky-bar">
              <span className="som-selected-count">{t('shops:manage.selectedCount', { count: allSelected.length })}</span>
              <button className="som-save-btn" onClick={handleSaveProducts}>{t('shops:manage.saveProducts')}</button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="som-page">
      <SegmentedTabs
        tabs={[
          { key: 'myproducts', label: t('shops:manage.myProducts') },
          { key: 'add', label: t('shops:manage.addProducts') },
        ]}
        activeKey="myproducts"
        onChange={(key) => (key === 'add' ? startAdd() : null)}
      />

      {products.length === 0 ? (
        <div className="som-empty-state">
          <span className="ei">🛍️</span>
          <b>{t('shops:manage.noProductsTitle')}</b>
          <span>{t('shops:manage.noProductsBody')}</span>
        </div>
      ) : (
        <div className="som-product-list">
          {products.map((p) => (
            <div className="som-list-item" key={p.id}>
              <div className="top">
                <div className="ic">🛍️</div>
                <div className="info">
                  <b>{p.name}</b>
                  <span className={`avail-pill${p.availability === 'Out of Stock' ? ' out' : ''}`}>{p.availability}</span>
                </div>
                <b className="price">₹{p.price}</b>
              </div>
              <div className="actions">
                <button onClick={() => openPriceSheet(p)}>{t('shops:manage.editPrice')}</button>
                <button onClick={() => handleToggleAvailability(p.id)}>
                  {p.availability === 'In Stock' ? t('shops:manage.markOutOfStock') : t('shops:manage.markInStock')}
                </button>
                <button onClick={() => openSaleSheet(p)}>{t('shops:manage.recordSale')}</button>
                <button className="danger" onClick={() => handleDelete(p.id)}>{t('shops:manage.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={!!sheet} onClose={() => setSheet(null)}>
        {sheet && (
          <>
            <h3>{sheet.type === 'price' ? t('shops:manage.editPrice') : t('shops:manage.recordSale')}</h3>
            <div className="profile-field">
              <label>{sheet.type === 'price' ? t('shops:manage.price') : t('shops:manage.quantitySold')}</label>
              <input type="number" value={sheetValue} onChange={(e) => setSheetValue(e.target.value)} />
            </div>
            <div className="profile-sheet-actions">
              <button className="sticky-bar-secondary" onClick={() => setSheet(null)}>Cancel</button>
              <button className="sticky-bar-primary" onClick={confirmSheet}>
                {sheet.type === 'price' ? t('shops:manage.saveShopDetails') : t('shops:manage.confirmSale')}
              </button>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
