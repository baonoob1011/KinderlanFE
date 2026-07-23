import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { Package, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../../services/api';

export type UserRole = 'admin' | 'staff' | 'manager';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeId?: string;
  storeName?: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginAdmin } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/api/v1/auth/login', { email, password });
      const data = response.data;

      if (!data?.accessToken) {
        toast.error('Không nhận được token từ server!');
        return;
      }

      // DEBUG: xem BE trả những field gì
      console.log('[AdminLogin] login data fields:', Object.keys(data), data);

      const { accessToken, refreshToken, role, email: userEmail } = data;

      // Lưu token để các API call sau dùng
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      toast.success('Đăng nhập thành công!');

      // For MANAGER: fetch their assigned store via /api/v1/stores/me
      let storeId: string | undefined;
      let storeName: string | undefined;

      if (role === 'ROLE_MANAGER') {
        try {
          const storeRes = await api.get('/api/v1/stores/me');
          const store = storeRes?.data;
          if (store) {
            storeId = String(store.id);
            storeName = store.name;
            localStorage.setItem('storeId', storeId);
            console.log('[AdminLogin] manager store:', store.name, 'id:', store.id);
          }
        } catch (storeErr) {
          console.warn('[AdminLogin] Could not fetch manager store:', storeErr);
        }
      }

      if (role === 'ROLE_ADMIN') {
        loginAdmin({ id: userEmail, email: userEmail, name: userEmail, role: 'admin' });
        navigate('/admin/dashboard');
      } else if (role === 'ROLE_MANAGER') {
        loginAdmin({ id: userEmail, email: userEmail, name: userEmail, role: 'manager', storeId, storeName });
        navigate('/manager/dashboard');
      } else if (role === 'ROLE_STAFF') {
        loginAdmin({ id: userEmail, email: userEmail, name: userEmail, role: 'staff', storeId, storeName });
        navigate('/staff/dashboard');
      } else {
        toast.error(`Role không được hỗ trợ: ${role}`);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Email hoặc mật khẩu không đúng!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Kinderland</h1>
          </div>
          <p className="text-gray-600">Hệ thống quản trị</p>
        </div>

        <Card className="border border-gray-200 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-gray-900" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-gray-900">Đăng nhập</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Dành cho quản trị viên, quản lý và nhân viên cửa hàng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@kinderland.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-300"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang đăng nhập...</>
                ) : 'Đăng nhập'}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-700 mb-3 font-semibold">Tài khoản demo:</p>
              <div className="space-y-2 text-xs">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-1">Administrator (Toàn quyền)</p>
                  <p className="text-gray-700 font-mono">admin@kinderland.vn / admin123</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="font-semibold text-gray-900 mb-1">Manager (Quản lý)</p>
                  <p className="text-gray-700 font-mono">manager@kinderland.vn / manager123</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-semibold text-gray-900 mb-1">Staff - Nhân viên HCM</p>
                  <p className="text-gray-700 font-mono">staff1@kinderland.vn / staff123</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-semibold text-gray-900 mb-1">Staff - Nhân viên Hà Nội</p>
                  <p className="text-gray-700 font-mono">staff2@kinderland.vn / staff123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to customer site */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Quay lại trang chủ Kinderland
          </Button>
        </div>
      </div>
    </div>
  );
}