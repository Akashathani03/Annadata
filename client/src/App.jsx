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
import SalesHistory from './pages/Crops/SellCrop/SalesHistory';
import BuyAnimalsBrowse from './pages/Animals/BuyAnimals/Browse';
import BuyEquipmentBrowse from './pages/Equipment/BuyEquipment/Browse';
import BuyEquipmentDetail from './pages/Equipment/BuyEquipment/Detail';
import SellEquipmentLayout from './pages/Equipment/SellEquipment/SellEquipmentLayout';
import SellEquipmentDashboard from './pages/Equipment/SellEquipment/Dashboard';
import SellEquipmentCreateListing from './pages/Equipment/SellEquipment/CreateListing';
import SellEquipmentMyListings from './pages/Equipment/SellEquipment/MyListings';
import SellEquipmentListingDetail from './pages/Equipment/SellEquipment/ListingDetail';
import BuyAnimalsDetail from './pages/Animals/BuyAnimals/Detail';
import SellAnimalsLayout from './pages/Animals/SellAnimals/SellAnimalsLayout';
import SellAnimalsDashboard from './pages/Animals/SellAnimals/Dashboard';
import SellAnimalsCreateListing from './pages/Animals/SellAnimals/CreateListing';
import SellAnimalsMyListings from './pages/Animals/SellAnimals/MyListings';
import SellAnimalsListingDetail from './pages/Animals/SellAnimals/ListingDetail';
import NearShopBrowse from './pages/Shops/NearShop/Browse';
import NearShopDetail from './pages/Shops/NearShop/Detail';
import ManageShopLayout from './pages/Shops/ManageShop/ManageShopLayout';
import ManageShopDashboard from './pages/Shops/ManageShop/Dashboard';
import ManageShopMyShop from './pages/Shops/ManageShop/MyShop';
import ManageShopProducts from './pages/Shops/ManageShop/Products';
import Schemes from './pages/Schemes/Schemes';
import AgroAI from './pages/AgroAI/AgroAI';
import PreviousChats from './pages/AgroAI/PreviousChats';
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
            Listing Detail, Sales History). Profile now lives
            at the top-level /profile route (single source of truth) -
            SellCropLayout's bottom nav links there directly. Sales
            History has no linked nav entry by design - only reachable
            via the Dashboard's "Sold Listings" stat. */}
        <Route path="/sell" element={<SellCropLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
        <Route path="/sell/create" element={<CreateListing />} />
        <Route path="/sell/listings" element={<MyListings />} />
        <Route path="/sell/listings/:id" element={<ListingDetail />} />
        <Route path="/sell/sales" element={<SalesHistory />} />

        <Route path="/buy" element={<BuyCropsBrowse />} />
        <Route path="/buy/:id" element={<BuyCropsDetail />} />
        <Route path="/sell-animal" element={<SellAnimalsLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SellAnimalsDashboard />} />
        </Route>
        <Route path="/sell-animal/create" element={<SellAnimalsCreateListing />} />
        <Route path="/sell-animal/listings" element={<SellAnimalsMyListings />} />
        <Route path="/sell-animal/listings/:id" element={<SellAnimalsListingDetail />} />
        <Route path="/sell-equipment" element={<SellEquipmentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SellEquipmentDashboard />} />
        </Route>
        <Route path="/sell-equipment/create" element={<SellEquipmentCreateListing />} />
        <Route path="/sell-equipment/listings" element={<SellEquipmentMyListings />} />
        <Route path="/sell-equipment/listings/:id" element={<SellEquipmentListingDetail />} />
        <Route path="/buy-animal" element={<BuyAnimalsBrowse />} />
        <Route path="/buy-animal/:id" element={<BuyAnimalsDetail />} />
        <Route path="/buy-equipment" element={<BuyEquipmentBrowse />} />
        <Route path="/buy-equipment/:id" element={<BuyEquipmentDetail />} />
        <Route path="/near-shop" element={<NearShopBrowse />} />
        <Route path="/near-shop/:id" element={<NearShopDetail />} />

        <Route path="/shop-owner" element={<ManageShopLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManageShopDashboard />} />
          <Route path="myshop" element={<ManageShopMyShop />} />
          <Route path="products" element={<ManageShopProducts />} />
        </Route>
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/agro-ai" element={<AgroAI />} />
        <Route path="/agro-ai/history" element={<PreviousChats />} />
      </Routes>

      {/* Mounted globally (outside Routes) so it can be triggered from
          any screen - the header's Login button, or any requiresAuth
          category tile via CategoryMenu. */}
      <LoginModal />
    </>
  );
}
