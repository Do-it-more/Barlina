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
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import ReturnPolicy from './pages/ReturnPolicy';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductListScreen from './pages/admin/ProductListScreen';
import ProductEditScreen from './pages/admin/ProductEditScreen';
import OrderListScreen from './pages/admin/OrderListScreen';
import OrderDetailScreen from './pages/admin/OrderDetailScreen';
import UserListScreen from './pages/admin/UserListScreen';
import UserDetailScreen from './pages/admin/UserDetailScreen';
import AdminCreateScreen from './pages/admin/AdminCreateScreen';
import CategoryListScreen from './pages/admin/CategoryListScreen';
import CategoryEditScreen from './pages/admin/CategoryEditScreen';
import ComplaintListScreen from './pages/admin/ComplaintListScreen';
import ComplaintDetailScreen from './pages/admin/ComplaintDetailScreen';
import CouponListScreen from './pages/admin/CouponListScreen';
import ContactListScreen from './pages/admin/ContactListScreen';
import ReturnListScreen from './pages/admin/ReturnListScreen';
import SettingsScreen from './pages/admin/SettingsScreen';
import AdminChangePassword from './pages/admin/AdminChangePassword';
// Import New Management Screens
import PermissionScreen from './pages/admin/management/PermissionScreen';
import ApprovalScreen from './pages/admin/management/ApprovalScreen';
import AdminActivityLogScreen from './pages/admin/AdminActivityLogScreen';
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
                      <Route path="/admin/change-password" element={<AdminChangePassword />} />
                      <Route path="/admin" element={<AdminLayout />}>
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

                      </Route>
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
