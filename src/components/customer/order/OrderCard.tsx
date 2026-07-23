import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Package, Truck, XCircle, RotateCcw, ChevronRight, Star,
} from 'lucide-react';
import { Order, OrderItemDTO, OrderStatus, STATUS_CONFIG, formatPrice } from './orderTypes';

interface OrderCardProps {
  order: Order;
  reviewedSkus: Set<number>;
  productImageMap: Map<number, string>;
  ordersWithReturns: Set<number>;
  onCancel: (orderId: number) => void;
  onReview: (item: OrderItemDTO) => void;
  onViewReturn: () => void;
}

export default function OrderCard({
  order, reviewedSkus, productImageMap, ordersWithReturns,
  onCancel, onReview, onViewReturn,
}: OrderCardProps) {
  const navigate = useNavigate();
  const statusInfo = STATUS_CONFIG[order.orderStatus] || {
    label: order.orderStatus, icon: Package,
    color: 'bg-gray-100 text-gray-800 border-gray-200', iconColor: 'text-gray-600',
  };
  const StatusIcon = statusInfo.icon;
  const canCancel = order.orderStatus === 'PENDING' || order.orderStatus === 'PENDING_PAYMENT' || order.orderStatus === 'PAID';
  const isDelivered = order.orderStatus === 'DELIVERED';
  const hasPendingReturn = isDelivered && ordersWithReturns.has(order.orderId);

  return (
    <Card className="mb-5 overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className={`h-1.5 w-full ${statusInfo.color.split(' ')[0]}`} />
      <CardHeader className="pb-4 bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-[#AF140B] transition-colors">
                Đơn hàng #{order.orderId}
              </CardTitle>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            {order.customer && (
              <p className="text-xs text-gray-500 font-medium">
                {order.customer.fullName} · {order.customer.email}
              </p>
            )}
          </div>
          <Badge variant="outline" className={`${statusInfo.color} border font-bold px-3 py-1 rounded-full shadow-sm`}>
            <StatusIcon className={`w-3.5 h-3.5 mr-1.5 ${statusInfo.iconColor}`} />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 bg-white">
        {/* Items */}
        <div className="divide-y divide-gray-50">
          {order.items?.map((item) => {
            const alreadyReviewed = reviewedSkus.has(item.skuId);
            return (
              <div key={item.orderItemId || `${order.orderId}-${item.skuId}`} className="py-4 flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                  {productImageMap.get(item.productId) ? (
                    <img src={productImageMap.get(item.productId)} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    SKU: {item.skuId}
                    {item.size && ` · Size: ${item.size}`}
                    {item.color && ` · Màu: ${item.color}`}
                    {` · SL: ${item.quantity}`}
                  </p>
                  <p className="text-sm font-bold text-[#AF140B] mt-1">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{formatPrice(item.totalPrice)}</p>
                  {isDelivered && !hasPendingReturn && (
                    alreadyReviewed ? (
                      <span className="text-[10px] text-green-600 font-semibold">Đã đánh giá ✓</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 px-2 h-7 mt-1"
                        onClick={() => onReview(item)}
                      >
                        <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                        Đánh giá
                      </Button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              {order.shippingAddress && (
                <p className="text-xs text-gray-500 truncate max-w-[300px]">📍 {order.shippingAddress}</p>
              )}
              {order.shippingCode && (
                <a
                  href={`https://tracking.ghn.dev/?order_code=${order.shippingCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline mt-1"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Theo dõi vận chuyển: {order.shippingCode}
                </a>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Thành tiền</p>
              <p className="text-2xl font-black text-gray-900 tracking-tight">
                {(order.totalAmount || 0).toLocaleString('vi-VN')}<span className="text-sm font-bold ml-1">₫</span>
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          {canCancel && (
            <Button
              variant="destructive"
              className="flex-1 sm:flex-none bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all rounded-xl font-bold h-11 shadow-none"
              size="sm"
              onClick={() => onCancel(order.orderId)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Hủy đơn
            </Button>
          )}

          {isDelivered && !hasPendingReturn && (
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-slate-200 text-slate-700 hover:bg-slate-50 transition-all rounded-xl font-bold h-11"
              size="sm"
              onClick={() => navigate('/account/return-request', { state: { order } })}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Trả hàng/Hoàn tiền
            </Button>
          )}

          {hasPendingReturn && (
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-amber-300 text-amber-700 hover:bg-amber-50 transition-all rounded-xl font-bold h-11"
              size="sm"
              onClick={onViewReturn}
            >
              <Package className="w-4 h-4 mr-2" />
              Xem yêu cầu trả hàng
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
