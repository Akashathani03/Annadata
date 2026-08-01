import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import CategoryMenu from './pages/CategoryMenu/CategoryMenu';
import Profile from './pages/Profile/Profile';
import BuyCropsBrowse from './pages/Crops/BuyCrops/Browse';
import BuyCropsDetail from './pages/Crops/BuyCrops/Detail';
import ApmcList from './pages/Crops/MarketPrices/ApmcList';
import CropList from './pages/Crops/MarketPrices/CropList';
import CropDetail from './pages/Crops/MarketPrices/CropDetail';
import SellCropLayout from './pages/Crops/SellCrop/SellCropLayout';
import Dashboard from './pages/Crops/SellCrop/Dashboard';
import CreateListing from './pages/Crops/SellCrop/CreateListing';
import MyListings from './pages/Crops/SellCrop/MyListings';
import ListingDetail from './pages/Crops/SellCrop/ListingDetail';
import Enquiries from './pages/Crops/SellCrop/Enquiries';
import SalesHistory from './pages/Crops/SellCrop/SalesHistory';
import BuyAnimalsBrowse from './pages/Animals/BuyAnimals/Browse';
import BuyAnimalsDetail from './pages/Animals/BuyAnimals/Detail';
import SellAnimalsLayout from './pages/Animals/SellAnimals/SellAnimalsLayout';
import SellAnimalsDashboard from './pages/Animals/SellAnimals/Dashboard';
import SellAnimalsCreateListing from './pages/Animals/SellAnimals/CreateListing';
import SellAnimalsMyListings from './pages/Animals/SellAnimals/MyListings';
import SellAnimalsListingDetail from './pages/Animals/SellAnimals/ListingDetail';
import SellAnimalsEnquiries from './pages/Animals/SellAnimals/Enquiries';
import NearShopBrowse from './pages/Shops/NearShop/Browse';
import NearShopDetail from './pages/Shops/NearShop/Detail';
import ManageShopLayout from './pages/Shops/ManageShop/ManageShopLayout';
import ManageShopDashboard from './pages/Shops/ManageShop/Dashboard';
import ManageShopMyShop from './pages/Shops/ManageShop/MyShop';
import ManageShopProducts from './pages/Shops/ManageShop/Products';
import ManageShopEnquiries from './pages/Shops/ManageShop/Enquiries';
import Schemes from './pages/Schemes/Schemes';
import AgroAI from './pages/AgroAI/AgroAI';
import LoginModal from './components/auth/LoginModal';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryKey" element={<CategoryMenu />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/market-prices" element={<ApmcList />} />
        <Route path="/market-prices/:apmcId" element={<CropList />} />
        <Route path="/market-prices/:apmcId/:cropId" element={<CropDetail />} />

        {/* Sell Crop: full shell (Dashboard, Create/Edit, My Listings,
            Listing Detail, Enquiries, Sales History). Profile now lives
            at the top-level /profile route (single source of truth) -
            SellCropLayout's bottom nav links there directly. Sales
            History has no linked nav entry by design - only reachable
            via the Dashboard's "Sold Listings" stat. */}
        <Route path="/sell" element={<SellCropLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="create" element={<CreateListing />} />
          <Route path="listings" element={<MyListings />} />
          <Route path="listings/:id" element={<ListingDetail />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="sales" element={<SalesHistory />} />
        </Route>

        <Route path="/buy" element={<BuyCropsBrowse />} />
        <Route path="/buy/:id" element={<BuyCropsDetail />} />
        <Route path="/sell-animal" element={<SellAnimalsLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SellAnimalsDashboard />} />
          <Route path="create" element={<SellAnimalsCreateListing />} />
          <Route path="listings" element={<SellAnimalsMyListings />} />
          <Route path="listings/:id" element={<SellAnimalsListingDetail />} />
          <Route path="enquiries" element={<SellAnimalsEnquiries />} />
        </Route>
        <Route path="/buy-animal" element={<BuyAnimalsBrowse />} />
        <Route path="/buy-animal/:id" element={<BuyAnimalsDetail />} />
        <Route path="/near-shop" element={<NearShopBrowse />} />
        <Route path="/near-shop/:id" element={<NearShopDetail />} />

        <Route path="/shop-owner" element={<ManageShopLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManageShopDashboard />} />
          <Route path="myshop" element={<ManageShopMyShop />} />
          <Route path="products" element={<ManageShopProducts />} />
          <Route path="enquiries" element={<ManageShopEnquiries />} />
        </Route>
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/agro-ai" element={<AgroAI />} />
      </Routes>

      {/* Mounted globally (outside Routes) so it can be triggered from
          any screen - the header's Login button, or any requiresAuth
          category tile via CategoryMenu. */}
      <LoginModal />
    </>
  );
}
