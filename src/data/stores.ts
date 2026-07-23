export interface Store {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  openHours: string;
  lat: number;
  lng: number;
  inventory: { [productId: string]: number }; // productId: stock quantity
}

export const stores: Store[] = [
  {
    id: 'store-1',
    name: 'Kinderland Vincom Center Đồng Khởi',
    address: '72 Lê Thánh Tôn, Phường Bến Nghé',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    phone: '028 3823 4567',
    openHours: '9:00 - 22:00',
    lat: 10.7769,
    lng: 106.7009,
    inventory: {
      '1': 15, '2': 8, '3': 20, '4': 12, '5': 0, '6': 5,
      '8': 25, '11': 10, '14': 30, '17': 18, '20': 22,
      '23': 12, '26': 8, '29': 15, '32': 20, '35': 10,
      '38': 0, '41': 15, '44': 12, '47': 8, '49': 18,
    },
  },
  {
    id: 'store-2',
    name: 'Kinderland Crescent Mall',
    address: '101 Tôn Dật Tiên, Phường Tân Phú',
    district: 'Quận 7',
    city: 'TP. Hồ Chí Minh',
    phone: '028 5412 3456',
    openHours: '9:30 - 22:00',
    lat: 10.7285,
    lng: 106.7196,
    inventory: {
      '1': 10, '2': 15, '3': 12, '4': 20, '5': 8, '6': 10,
      '7': 5, '9': 18, '12': 15, '15': 25, '18': 12,
      '21': 8, '24': 20, '27': 10, '30': 15, '33': 18,
      '36': 12, '39': 0, '42': 10, '45': 8, '48': 15,
    },
  },
  {
    id: 'store-3',
    name: 'Kinderland Gigamall Thủ Đức',
    address: '240-242 Phạm Văn Đồng, Phường Hiệp Bình Chánh',
    district: 'TP. Thủ Đức',
    city: 'TP. Hồ Chí Minh',
    phone: '028 7307 8888',
    openHours: '9:00 - 22:00',
    lat: 10.8502,
    lng: 106.7717,
    inventory: {
      '2': 12, '3': 18, '4': 10, '6': 15, '7': 8, '8': 20,
      '10': 12, '13': 15, '16': 10, '19': 18, '22': 12,
      '25': 25, '28': 8, '31': 15, '34': 10, '37': 18,
      '40': 12, '43': 20, '46': 8, '49': 15, '50': 10,
    },
  },
  {
    id: 'store-4',
    name: 'Kinderland Aeon Mall Tân Phú',
    address: '30 Bờ Bao Tân Thắng, Phường Sơn Kỳ',
    district: 'Quận Tân Phú',
    city: 'TP. Hồ Chí Minh',
    phone: '028 6271 9999',
    openHours: '9:00 - 22:00',
    lat: 10.8006,
    lng: 106.6132,
    inventory: {
      '1': 20, '4': 15, '5': 12, '7': 18, '8': 10, '9': 15,
      '11': 25, '14': 20, '17': 12, '20': 18, '23': 10,
      '26': 15, '29': 20, '32': 12, '35': 18, '38': 10,
      '41': 15, '44': 20, '47': 12, '50': 18,
    },
  },
  {
    id: 'store-5',
    name: 'Kinderland Vivo City',
    address: '1058 Nguyễn Văn Linh, Phường Tân Phong',
    district: 'Quận 7',
    city: 'TP. Hồ Chí Minh',
    phone: '028 7300 8888',
    openHours: '9:30 - 22:00',
    lat: 10.7308,
    lng: 106.7172,
    inventory: {
      '3': 15, '6': 20, '8': 12, '11': 18, '14': 10, '17': 15,
      '20': 20, '23': 12, '26': 18, '29': 10, '32': 15,
      '35': 20, '38': 8, '41': 12, '44': 18, '47': 10,
    },
  },
  {
    id: 'store-6',
    name: 'Kinderland Royal City Hà Nội',
    address: '72A Nguyễn Trãi, Phường Thượng Đình',
    district: 'Quận Thanh Xuân',
    city: 'Hà Nội',
    phone: '024 3200 3456',
    openHours: '9:00 - 22:00',
    lat: 20.9955,
    lng: 105.8136,
    inventory: {
      '1': 18, '2': 12, '3': 15, '4': 20, '5': 10, '6': 18,
      '7': 12, '8': 25, '9': 15, '10': 20, '11': 12,
      '14': 18, '17': 15, '20': 20, '23': 12, '26': 18,
      '29': 15, '32': 20, '35': 12, '41': 18, '44': 15,
    },
  },
  {
    id: 'store-7',
    name: 'Kinderland Vincom Mega Mall Ocean Park',
    address: 'Đại lộ Đông Hưng Thuận, Phường Đại Kim',
    district: 'Quận Hoàng Mai',
    city: 'Hà Nội',
    phone: '024 7300 6789',
    openHours: '9:00 - 22:00',
    lat: 20.9639,
    lng: 105.8171,
    inventory: {
      '2': 15, '5': 18, '8': 12, '11': 20, '14': 15, '17': 18,
      '20': 12, '23': 20, '26': 15, '29': 18, '32': 12,
      '35': 20, '38': 15, '41': 18, '44': 12, '47': 20,
    },
  },
  {
    id: 'store-8',
    name: 'Kinderland Aeon Mall Hà Đông',
    address: 'Số 1 Trần Phú, Phường Mộ Lao',
    district: 'Quận Hà Đông',
    city: 'Hà Nội',
    phone: '024 7309 1234',
    openHours: '9:00 - 22:00',
    lat: 20.9726,
    lng: 105.7753,
    inventory: {
      '1': 12, '3': 18, '5': 15, '7': 20, '9': 12, '11': 18,
      '13': 15, '15': 20, '17': 12, '19': 18, '21': 15,
      '23': 20, '26': 12, '29': 18, '32': 15, '35': 20,
    },
  },
];

export const cities = ['TP. Hồ Chí Minh', 'Hà Nội'];
