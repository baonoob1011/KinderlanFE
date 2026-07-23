import { Clock, CreditCard, CheckCircle, Truck, Package, XCircle, AlertCircle } from 'lucide-react';

// --- Types matching actual BE DTOs ---
export type OrderStatus = 'PENDING' | 'PENDING_PAYMENT' | 'PAID' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export interface OrderItemDTO {
  orderItemId: number;
  skuId: number;
  size: string | null;
  color: string | null;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerDTO {
  id: number;
  fullName: string;
  email: string;
}

export interface Order {
  orderId: number;
  orderStatus: OrderStatus;
  totalAmount: number;
  customer: CustomerDTO;
  items: OrderItemDTO[];
  shippingAddress: string | null;
  shippingCode: string | null;
}

export interface ReturnRequest {
  returnId: number;
  returnCode: string;
  orderItemId: number;
  orderId: number;
  returnReason: string;
  rejectionReason: string | null;
  returnStatus: string;
  description: string;
  photoUrls: string[];
  refundAmount: number | null;
  refundType: string | null;
  bankAccountNumber: string;
  bankName: string;
  bankAccountName: string;
  refundTransactionCode: string | null;
  requestedAt: string;
  processedAt: string | null;
  refundedAt: string | null;
  productName: string;
  quantity: number;
  storeName: string;
  processedByName: string | null;
}

// --- Status config ---
export const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: typeof Clock; color: string; iconColor: string }> = {
  PENDING: {
    label: 'Chờ xử lý',
    icon: Clock,
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    iconColor: 'text-amber-600',
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    icon: CreditCard,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    iconColor: 'text-orange-600',
  },
  PAID: {
    label: 'Đã thanh toán',
    icon: CheckCircle,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600',
  },
  DELIVERED: {
    label: 'Đã giao',
    icon: Truck,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    icon: Package,
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: XCircle,
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    iconColor: 'text-rose-600',
  },
  FAILED: {
    label: 'Thất bại',
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    iconColor: 'text-gray-600',
  },
};

export const TAB_LIST = [
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'PENDING_RETURN', label: 'Chờ trả hàng' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'RETURNED', label: 'Trả hàng' },
];

export const RETURN_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  REJECTED: { label: 'Từ chối', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  RECEIVED: { label: 'Đã nhận hàng', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-green-100 text-green-800 border-green-200' },
};

export const PAGE_SIZE = 5;

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
