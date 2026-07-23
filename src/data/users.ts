// Mock customer accounts for demo
export interface CustomerUser {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  membershipTier?: 'bronze' | 'silver' | 'gold';
  points?: number;
}

export const DEMO_CUSTOMERS: CustomerUser[] = [
  {
    id: 'customer-1',
    email: 'customer@kinderland.vn',
    password: 'customer123',
    name: 'Nguyễn Thị Lan',
    phone: '0901234567',
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    membershipTier: 'gold',
    points: 1500,
  },
  {
    id: 'customer-2',
    email: 'lanhuong@gmail.com',
    password: 'lanhuong123',
    name: 'Trần Lan Hương',
    phone: '0912345678',
    address: '45 Láng Hạ, Ba Đình, Hà Nội',
    membershipTier: 'silver',
    points: 750,
  },
  {
    id: 'customer-3',
    email: 'minhtu@gmail.com',
    password: 'minhtu123',
    name: 'Lê Minh Tú',
    phone: '0923456789',
    address: '78 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
    membershipTier: 'bronze',
    points: 250,
  },
];
