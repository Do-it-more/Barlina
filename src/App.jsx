import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import api from './services/api';
import { ThemeProvider } from './context/ThemeContext';
import { WishlistProvider } from './context/WishlistContext';
import Wishlist from './pages/Wishlist';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';

// Seller Components
import SellerLayout from './pages/seller/SellerLayout';
import SellerRegister from './pages/seller/SellerRegister';
import SellerDashboard from './pages/seller/SellerDashboard';

// Finance Components
import FinanceLayout from './pages/finance/FinanceLayout';
import FinancialDashboard from './pages/finance/FinancialDashboard'; // Reusing or new file? used new file

import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import ReturnPolicy from './pages/ReturnPolicy';
import PhoneVerification from './pages/PhoneVerification';
// Lazy Load Admin Pages for Performance
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const ProductListScreen = React.lazy(() => import('./pages/admin/ProductListScreen'));
const ProductEditScreen = React.lazy(() => import('./pages/admin/ProductEditScreen'));
const OrderListScreen = React.lazy(() => import('./pages/admin/OrderListScreen'));
const OrderDetailScreen = React.lazy(() => import('./pages/admin/OrderDetailScreen'));
const UserListScreen = React.lazy(() => import('./pages/admin/UserListScreen'));
const UserDetailScreen = React.lazy(() => import('./pages/admin/UserDetailScreen'));
const AdminCreateScreen = React.lazy(() => import('./pages/admin/AdminCreateScreen'));
const CategoryListScreen = React.lazy(() => import('./pages/admin/CategoryListScreen'));
const CategoryEditScreen = React.lazy(() => import('./pages/admin/CategoryEditScreen'));
const ComplaintListScreen = React.lazy(() => import('./pages/admin/ComplaintListScreen'));
const ComplaintDetailScreen = React.lazy(() => import('./pages/admin/ComplaintDetailScreen'));
const CouponListScreen = React.lazy(() => import('./pages/admin/CouponListScreen'));
const ContactListScreen = React.lazy(() => import('./pages/admin/ContactListScreen'));
const ReturnListScreen = React.lazy(() => import('./pages/admin/ReturnListScreen'));
const SettingsScreen = React.lazy(() => import('./pages/admin/SettingsScreen'));
const AdminChangePassword = React.lazy(() => import('./pages/admin/AdminChangePassword'));
const PermissionScreen = React.lazy(() => import('./pages/admin/management/PermissionScreen'));
const ApprovalScreen = React.lazy(() => import('./pages/admin/management/ApprovalScreen'));
const AdminActivityLogScreen = React.lazy(() => import('./pages/admin/AdminActivityLogScreen'));

const TeamChatScreen = React.lazy(() => import('./pages/admin/TeamChatScreen'));
import ChatBot from './components/ChatBot';
import MobileBottomNav from './components/MobileBottomNav';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ConditionalChatBot() {
  const location = useLocation();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        // Default to true if undefined, but backend sends default true
        setIsEnabled(data.isChatbotEnabled !== false);
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };
    fetchSettings();
  }, [location.pathname]); // Refetch on navigation? Or just once? Just once on mount is fine usually, but maybe refetch if user is admin testing it? Let's just do once on mount for performance, but since this component unmounts/remounts? 
  // Wait, ConditionalChatBot is stuck in Router? No, it's inside Router.
  // Actually, keeping it simple: just fetch on mount.

  // Hide ChatBot on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  if (!isEnabled) return null;

  return <ChatBot />;
}

function ConditionalMobileNav() {
  const location = useLocation();
  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  return <MobileBottomNav />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <CartProvider>
              <WishlistProvider>
                <Router>
                  <ScrollToTop />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-phone" element={<PhoneVerification />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* Public Shop Routes */}

                    <Route path="/about" element={<About />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-conditions" element={<Terms />} />
                    <Route path="/returns" element={<ReturnPolicy />} />


                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/products" element={<ProductList />} />
                      <Route path="/category/:category" element={<ProductList />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/orders" element={<OrderList />} />
                      <Route path="/order/:id" element={<OrderDetail />} />
                      <Route path="/profile" element={<Profile />} />
                    </Route>
                    {/* Admin Routes */}
                    <Route element={<ProtectedRoute adminOnly={true} />}>
                      <Route path="/admin" element={
                        <React.Suspense fallback={
                          <div className="flex h-screen items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                          </div>
                        }>
                          <AdminLayout />
                        </React.Suspense>
                      }>
                        <Route index element={<AdminDashboard />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="products" element={<ProductListScreen />} />
                        <Route path="products/create" element={<ProductEditScreen />} />
                        <Route path="products/:id/edit" element={<ProductEditScreen />} />
                        <Route path="orders" element={<OrderListScreen />} />
                        <Route path="orders/:id" element={<OrderDetailScreen />} />
                        <Route path="users" element={<UserListScreen />} />
                        <Route path="users/:id" element={<UserDetailScreen />} />
                        <Route path="users/create" element={<AdminCreateScreen />} />
                        <Route path="categories" element={<CategoryListScreen />} />
                        <Route path="categories/create" element={<CategoryEditScreen />} />
                        <Route path="categories/:id/edit" element={<CategoryEditScreen />} />
                        <Route path="complaints" element={<ComplaintListScreen />} />
                        <Route path="complaints/:id" element={<ComplaintDetailScreen />} />
                        <Route path="contacts" element={<ContactListScreen />} />
                        <Route path="returns" element={<ReturnListScreen />} />
                        <Route path="coupons" element={<CouponListScreen />} />
                        <Route path="settings" element={<SettingsScreen />} />

                        <Route path="management/permissions" element={<PermissionScreen />} />
                        <Route path="management/approvals" element={<ApprovalScreen />} />
                        <Route path="management/activity" element={<AdminActivityLogScreen />} />
                        <Route path="team-chat" element={<TeamChatScreen />} />
                      </Route>
                      <Route path="/admin/change-password" element={
                        <React.Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
                          <AdminChangePassword />
                        </React.Suspense>
                      } />
                    </Route>

                    {/* Seller Routes */}
                    <Route path="/seller/register" element={
                      <ProtectedRoute>
                        <SellerRegister />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller" element={
                      <ProtectedRoute>
                        <SellerLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<SellerDashboard />} />
                      <Route path="dashboard" element={<SellerDashboard />} />
                    </Route>

                    {/* Finance Routes */}
                    <Route path="/finance" element={
                      <ProtectedRoute>
                        <FinanceLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<FinancialDashboard />} />
                      <Route path="dashboard" element={<FinancialDashboard />} />
                    </Route>

                    {/* Catch All - 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <ConditionalChatBot />
                  <ConditionalMobileNav />
                </Router>
              </WishlistProvider>
            </CartProvider>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
