import { createContext, useContext, useState, ReactNode } from 'react';
import type { AdminUser } from '../components/admin/AdminLogin';

interface AdminContextType {
  adminUser: AdminUser | null;
  loginAdmin: (user: AdminUser) => void;
  logoutAdmin: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  // Khôi phục NGAY trong lazy initializer, KHÔNG dùng useEffect.
  // useEffect chạy SAU lần render đầu -> ở render đầu adminUser = null ->
  // AdminProtectedRoute thấy null và <Navigate to="/login"/> ngay lập tức,
  // trước khi state kịp được set. Đó là lý do F5 bị đá về /login.
  // localStorage là API đồng bộ nên đọc thẳng ở đây được, không cần loading state.
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem('adminUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('adminUser');
      return null;
    }
  });

  const loginAdmin = (user: AdminUser) => {
    setAdminUser(user);
    localStorage.setItem('adminUser', JSON.stringify(user));
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('storeId');
  };

  return (
    <AdminContext.Provider value={{ adminUser, loginAdmin, logoutAdmin }}>
      {children}
    </AdminContext.Provider>
  );
};