import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { AppProvider, useApp } from './context/AppContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import Navbar from './components/layout/Navbar';
import TopMarquee from './components/layout/TopMarquee';
import Footer from './components/layout/Footer';
import HomePage from './components/home/HomePage';
import LoginPage from './components/auth/LoginPage';
import ProductsPage from './components/pages/ProductsPage';
import CategoriesPage from './components/pages/CategoriesPage';
import BrandsPage from './components/pages/BrandsPage';
import DiscountsPage from './components/pages/DiscountsPage';
import NewArrivalsPage from './components/pages/NewArrivalsPage';
import StoreFinderPage from './components/pages/StoreFinderPage';
import BlogListPage from './components/pages/BlogListPage';
import BlogDetailPage from './components/pages/BlogDetailPage';
import ProductDetail from './components/shop/ProductDetail';
import Cart from './components/cart/Cart';
import Checkout from './components/checkout/Checkout';
import Payment from './components/checkout/Payment';
import OrderSuccess from './components/checkout/OrderSuccess';
import PaymentResult from './components/checkout/PaymentResult';


// Admin & Staff
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLayout from './components/admin/AdminLayout';
import ProductManagement from './components/admin/ProductManagement';
import OrderManagement from './components/admin/OrderManagement';
import PromotionManagement from './components/admin/PromotionManagement';
import UserManagement from './components/admin/UserManagement';
import ReturnManagement from './components/admin/ReturnManagement';
import AdminCategoryController from './components/admin/AdminCategoryController';
import AdminBrandManagement from './components/admin/AdminBrandManagement';
import AdminReviewManagement from './components/admin/AdminReviewManagement';
import AdminBlogManagement from './components/admin/AdminBlogManagement';
import AdminFinancial from './components/admin/AdminFinancial';
import StaffDashboard from './components/staff/StaffDashboard';
import QRScanner from './components/staff/QRScanner';
import InventoryCheck from './components/staff/InventoryCheck';
import StoreTransfer from './components/staff/StoreTransfer';
import DefectiveReport from './components/staff/DefectiveReport';

import ResetPasswordPage from './components/auth/reset-password';
// Manager
import ManagerDashboard from './components/manager/ManagerDashboard';
import ManagerLayout from './components/manager/ManagerLayout';
import FinancialOverview from './components/manager/FinancialOverview';
import ReviewManagement from './components/manager/ReviewManagement';
import ImportOrderPage from './components/manager/ImportOrderPage';
import InventoryManagementPage from './components/manager/InventoryManagementPage';
import StockTransferPage from './components/manager/StockTransferPage';
import PhysicalCountPage from './components/manager/PhysicalCountPage';
import DefectiveReportPage from './components/manager/DefectiveReportPage';
import ManagerOrderPage from './components/manager/ManagerOrderPage';
import ManagerReturnPage from './components/manager/ManagerReturnPage';

// Customer Account
import CustomerDashboard from './components/customer/CustomerDashboard';
import OrderHistory from './components/customer/OrderHistory';
import ReturnRequestPage from './components/customer/ReturnRequestPage';
import CustomerProfile from './components/customer/CustomerProfile';
import LoyaltyPoints from './components/customer/LoyaltyPoints';
import Wishlist from './components/pages/Wishlist';



function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AdminProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: ('admin' | 'staff' | 'manager')[] }) {
  const { adminUser } = useAdmin();

  if (!adminUser) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(adminUser.role)) {
    if (adminUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (adminUser.role === 'manager') {
      return <Navigate to="/manager/dashboard" />;
    } else {
      return <Navigate to="/staff/dashboard" />;
    }
  }

  return <>{children}</>;
}

function AppContent() {
  const { user } = useApp();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Customer Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin/Staff/Manager use the same /login page */}
          
  <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* Admin Routes - wrapped in AdminLayout for persistent sidebar */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="promotions" element={<PromotionManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="categories" element={<AdminCategoryController />} />
            <Route path="brands" element={<AdminBrandManagement />} />
            <Route path="reviews" element={<AdminReviewManagement />} />
            <Route path="returns" element={<ReturnManagement />} />
            <Route path="blog" element={<AdminBlogManagement />} />
            <Route path="reports" element={<AdminDashboard />} />
            <Route path="financial" element={<AdminFinancial />} />
            <Route path="inventory" element={<ProductManagement />} />
          </Route>

          {/* Manager Routes - wrapped in ManagerLayout for persistent sidebar */}
          <Route
            path="/manager"
            element={
              <AdminProtectedRoute allowedRoles={['manager']}>
                <ManagerLayout />
              </AdminProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="inventory" element={<InventoryManagementPage />} />
            <Route path="storage" element={<InventoryManagementPage />} />
            <Route path="returns" element={<ManagerReturnPage />} />
            <Route path="stock-transfer" element={<StockTransferPage />} />
            <Route path="import-orders" element={<ImportOrderPage />} />
            <Route path="import-management" element={<StockTransferPage />} />
            <Route path="defective-report" element={<DefectiveReportPage />} />
            <Route path="physical-count" element={<PhysicalCountPage />} />
            <Route path="orders" element={<ManagerOrderPage />} />
            <Route path="reviews" element={<ReviewManagement />} />
            <Route path="financial" element={<FinancialOverview />} />
            <Route path="promotions" element={<PromotionManagement />} />
            <Route path="blog" element={<ProductManagement />} />
            <Route path="policies" element={<ProductManagement />} />
            <Route path="reports" element={<AdminDashboard />} />
            <Route path="change-password" element={<CustomerProfile />} />
          </Route>

          {/* Staff Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <AdminProtectedRoute allowedRoles={['staff']}>
                <StaffDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/staff/qr-scanner"
            element={
              <AdminProtectedRoute allowedRoles={['staff']}>
                <QRScanner />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/staff/inventory"
            element={
              <AdminProtectedRoute allowedRoles={['staff']}>
                <InventoryCheck />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/staff/transfer"
            element={
              <AdminProtectedRoute allowedRoles={['staff']}>
                <StoreTransfer />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/staff/defective"
            element={
              <AdminProtectedRoute allowedRoles={['staff']}>
                <DefectiveReport />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/staff/returns"
            element={
              <AdminProtectedRoute allowedRoles={['staff']}>
                <ReturnManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/staff/stock-check"
            element={
              <AdminProtectedRoute allowedRoles={['staff']}>
                <InventoryCheck />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/staff/availability"
            element={
              <AdminProtectedRoute allowedRoles={['staff']}>
                <InventoryCheck />
              </AdminProtectedRoute>
            }
          />

          {/* Customer Site Routes */}
          <Route
            path="/*"
            element={
              <>
                <div className="sticky top-0 z-50">
                  <TopMarquee />
                  <Navbar />
                </div>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/categories/:categoryName" element={<CategoriesPage />} />
                  <Route path="/brands" element={<BrandsPage />} />
                  <Route path="/brands/:brandName" element={<BrandsPage />} />
                  <Route path="/discounts" element={<DiscountsPage />} />
                  <Route path="/new-arrivals" element={<NewArrivalsPage />} />
                  <Route path="/stores" element={<StoreFinderPage />} />
                  <Route path="/blog" element={<BlogListPage />} />
                  <Route path="/blog/:id" element={<BlogDetailPage />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment"
                    element={
                      <ProtectedRoute>
                        <Payment />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order-success"
                    element={
                      <ProtectedRoute>
                        <OrderSuccess />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment-result"
                    element={<PaymentResult />}
                  />
                  {/* Customer Account Routes */}
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute>
                        <CustomerDashboard />
                      </ProtectedRoute>
                    }
                  />
                    <Route
                    path="/account/orders"
                    element={
                      <ProtectedRoute>
                        <OrderHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account/return-request"
                    element={
                      <ProtectedRoute>
                        <ReturnRequestPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account/profile"
                    element={
                      <ProtectedRoute>
                        <CustomerProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account/loyalty"
                    element={
                      <ProtectedRoute>
                        <LoyaltyPoints />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account/wishlist"
                    element={<Wishlist />}
                  />
                </Routes>
                <Footer />
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

import { Toaster } from 'sonner';

export default function App() {
  return (
    <AppProvider>
      <AdminProvider>
        <AppContent />
        <Toaster position="bottom-right" richColors closeButton icons={{ success: ' ', error: ' ', info: ' ', warning: ' ' }} />
      </AdminProvider>
    </AppProvider>
  );
}