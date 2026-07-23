import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Heart, ShoppingCart, User, LogOut, Search, Menu, X, Home, Percent, Grid, Package, BookOpen, Award, MapPin, UserCircle, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import CartDropdown from './CartDropdown';
import ProductMegaMenu from './ProductMegaMenu';
import { Logo } from '../common/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function Navbar() {
  const { user, logout, cart, wishlistCount, cartDropdownOpen, setCartDropdownOpen } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isScrolled, setIsScrolled] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const megaMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMegaMenu = () => {
    if (megaMenuTimeout.current) {
      clearTimeout(megaMenuTimeout.current);
      megaMenuTimeout.current = null;
    }
    setShowMegaMenu(true);
  };

  const closeMegaMenuDelayed = () => {
    megaMenuTimeout.current = setTimeout(() => {
      setShowMegaMenu(false);
    }, 150);
  };

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${searchTerm}`);
      setIsMenuOpen(false);
    }
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const menuItems = [
    { name: 'Trang chủ', path: '/', icon: Home, color: 'from-[#AF140B] to-[#8D0F08]' },
    { name: 'Sản phẩm', path: '/products', icon: Package, color: 'from-[#D91810] to-[#AF140B]' },
    { name: 'Thương hiệu', path: '/brands', icon: Award, color: 'from-[#D91810] to-[#AF140B]' },
    { name: 'Khuyến mãi', path: '/discounts', icon: Percent, color: 'from-[#AF140B] to-[#8D0F08]' },
    { name: 'Cửa hàng', path: '/stores', icon: MapPin, color: 'from-[#AF140B] to-[#8D0F08]' },
    { name: 'Blog', path: '/blog', icon: BookOpen, color: 'from-[#D91810] to-[#AF140B]' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Header - Logo, Search, Cart, User */}
      <header className={`bg-[#AF140B] border-b border-white/20 transition-all duration-300 relative z-50 ${isScrolled ? 'shadow-2xl bg-[#AF140B]/98 backdrop-blur-md' : 'shadow-lg'
        }`}>
        <div className="container mx-auto px-4">
          <div className={`flex items-center justify-between gap-4 transition-all duration-300 ${isScrolled ? 'py-1.5' : 'py-2'
            }`}>
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <Logo size="small" className="md:hidden" />
              <Logo size="default" className="hidden md:block" />
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-white/70" />
                <input
                  type="text"
                  placeholder="Tìm kiếm đồ chơi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-white transition-all bg-white/10 text-white placeholder:text-white/60"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Link
                  to="/account/wishlist"
                  className="relative p-2 hover:bg-white/10 rounded-lg transition-all block"
                >
                  <Heart className="size-5 text-white" />
                </Link>
              </div>
              {/* Cart */}
              <div
                className="relative"
                onMouseEnter={() => setCartDropdownOpen(true)}
                onMouseLeave={() => setCartDropdownOpen(false)}
              >
                <Link
                  to="/cart"
                  className="flex items-center gap-0.5 p-2 rounded-lg transition-all"
                >
                  <ShoppingCart className="size-5 text-white" />
                  {cartItemsCount > 0 && (
                    <span className="text-white text-xs font-medium">
                      ({cartItemsCount})
                    </span>
                  )}
                </Link>

                {/* Cart Dropdown */}
                {cartDropdownOpen && <CartDropdown />}
              </div>

              {/* User Account */}
              {user ? (
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg hover:bg-white/90 transition-all shadow-md">
                        <User className="size-4 text-[#AF140B]" />
                        <span className="text-xs font-semibold text-[#4A4A4A]">{user.username || user.name}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/account" className="cursor-pointer">
                          <UserCircle className="mr-2 h-4 w-4" />
                          <span>Tổng quan</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account/orders" className="cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          <span>Đơn hàng của tôi</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account/loyalty" className="cursor-pointer">
                          <Award className="mr-2 h-4 w-4" />
                          <span>Điểm tích lũy</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Thông tin tài khoản</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Đăng xuất</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:flex px-4 py-1.5 bg-white text-[#AF140B] rounded-lg hover:bg-white/90 transition-all shadow-md font-bold text-sm"
                >
                  Đăng Nhập
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-white"
              >
                {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="lg:hidden pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-white/70" />
              <input
                type="text"
                placeholder="Tìm kiếm đồ chơi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-white transition-all bg-white/10 text-white placeholder:text-white/60"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Navigation Menu - Compact text bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 relative">
        <div className="container mx-auto px-4">
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center justify-center gap-0">
            {menuItems.map((item) => {
              const active = isActive(item.path);

              // Special handling for "Sản phẩm"
              if (item.path === '/products') {
                return (
                  <div
                    key={item.path}
                    className="relative"
                    onMouseEnter={openMegaMenu}
                    onMouseLeave={closeMegaMenuDelayed}
                  >
                    <Link
                      to={item.path}
                      className={`inline-flex items-center gap-1 px-5 py-2.5 text-sm font-bold transition-all border-b-2 ${active
                        ? 'text-[#AF140B] border-[#AF140B]'
                        : 'text-gray-700 border-transparent hover:text-[#AF140B] hover:border-[#AF140B]/30'
                        }`}
                    >
                      {item.name}
                      <ChevronDown className={`size-3.5 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} />
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-5 py-2.5 text-sm font-bold transition-all border-b-2 ${active
                    ? 'text-[#AF140B] border-[#AF140B]'
                    : 'text-gray-700 border-transparent hover:text-[#AF140B] hover:border-[#AF140B]/30'
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mega Menu */}
          {showMegaMenu && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-2/3 top-full z-[100]"
              onMouseEnter={openMegaMenu}
              onMouseLeave={closeMegaMenuDelayed}
            >
              <ProductMegaMenu onClose={() => setShowMegaMenu(false)} />
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setIsMenuOpen(false)}>
          <div className="bg-white w-80 h-full shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              {/* Close button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="size-6" />
                </button>
              </div>

              {/* Mobile Menu Items */}
              <div className="space-y-2 mb-6">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${active
                        ? `bg-gradient-to-r ${item.color} text-white`
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="size-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile User Actions */}
              {user ? (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="bg-white shadow-2xl hover:shadow-red-900/10 transition-all duration-300 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#AF140B] flex items-center justify-center text-lg font-bold text-white">
                        {(user?.username || user?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{user.username || user.name}</span>
                    </div>
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold"
                  >
                    <UserCircle className="size-5" />
                    Tài khoản của tôi
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-semibold"
                  >
                    <LogOut className="size-5" />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#AF140B] text-white rounded-xl hover:bg-[#8D0F08] transition-all shadow-md font-bold"
                >
                  <User className="size-5" />
                  Đăng Nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}