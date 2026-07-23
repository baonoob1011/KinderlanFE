import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Package, ArrowLeft, AlertCircle, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { api, authenticatedFetch } from '../../services/api';
import { reviewApi } from '../../services/reviewApi';
import { productApi } from '../../services/productApi';
import { toast } from 'sonner';

import { Order, OrderItemDTO, OrderStatus, ReturnRequest, TAB_LIST, PAGE_SIZE } from './order/orderTypes';
import OrderCard from './order/OrderCard';
import ReturnCard from './order/ReturnCard';
import ReviewDialog from './order/ReviewDialog';

export default function OrderHistory() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('PENDING');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Review state
  const [reviewItem, setReviewItem] = useState<OrderItemDTO | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedSkus, setReviewedSkus] = useState<Set<number>>(new Set());

  // Product images
  const [productImageMap, setProductImageMap] = useState<Map<number, string>>(new Map());

  // Returns
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);

  // ── Data fetching ──

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getMyOrders();
      let data: Order[] = [];
      if (response?.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }
      data.sort((a, b) => b.orderId - a.orderId);
      setOrders(data);
      setError(null);
      await preCheckReviewedSkus(data);
      await fetchProductImages();
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const preCheckReviewedSkus = async (orderList: Order[]) => {
    const deliveredOrders = orderList.filter((o) => o.orderStatus === 'DELIVERED');
    if (deliveredOrders.length === 0) return;

    const skuIds = new Set<number>();
    for (const order of deliveredOrders) {
      for (const item of order.items || []) skuIds.add(item.skuId);
    }
    if (skuIds.size === 0) return;

    let myAccountId: number | null = null;
    try {
      const profileRes = await authenticatedFetch('/api/v1/account/me');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        myAccountId = profileData?.data?.id || profileData?.id || null;
      }
    } catch { return; }
    if (!myAccountId) return;

    const alreadyReviewed = new Set<number>();
    const skuArray = Array.from(skuIds);
    for (let i = 0; i < skuArray.length; i += 5) {
      const batch = skuArray.slice(i, i + 5);
      const results = await Promise.allSettled(batch.map((id) => reviewApi.getBySku(id)));
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          if (result.value.find((r) => r.accountId === myAccountId)) {
            alreadyReviewed.add(batch[idx]);
          }
        }
      });
    }
    if (alreadyReviewed.size > 0) {
      setReviewedSkus((prev) => new Set([...prev, ...alreadyReviewed]));
    }
  };

  const fetchProductImages = async () => {
    try {
      const allProducts = await productApi.getAll();
      const imgMap = new Map<number, string>();
      for (const p of allProducts) {
        if (p.id && p.imageUrl) imgMap.set(p.id, p.imageUrl);
      }
      if (imgMap.size > 0) setProductImageMap(imgMap);
    } catch (err) {
      console.error('Failed to fetch product images:', err);
    }
  };

  const fetchReturnRequests = async () => {
    try {
      setReturnsLoading(true);
      const res = await authenticatedFetch('/api/v1/return-requests/my-requests?page=0&size=100');
      if (res.ok) {
        const json = await res.json();
        const data = json?.data?.content || json?.data || [];
        setReturnRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch return requests:', err);
    } finally {
      setReturnsLoading(false);
    }
  };

  const locationKey = useLocation().key;

  useEffect(() => { fetchOrders(); fetchReturnRequests(); }, [locationKey]);

  // Auto-refresh: visibilitychange + polling every 15s
  useEffect(() => {
    const refetch = () => { fetchOrders(); fetchReturnRequests(); };

    // Refresh when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Light polling every 15s (only when tab is visible)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refetch();
    }, 15000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => { setPage(1); }, [selectedTab]);

  // ── Handlers ──

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      await api.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => o.orderId === orderId ? { ...o, orderStatus: 'CANCELLED' as OrderStatus } : o)
      );
      toast.success('Hủy đơn hàng thành công');
    } catch (err: any) {
      toast.error('Không thể hủy đơn hàng: ' + (err.message || 'Lỗi không xác định'));
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewItem || reviewSubmitting) return;
    setReviewSubmitting(true);
    try {
      const res = await authenticatedFetch(
        `/api/v1/reviews/sku/${reviewItem.skuId}?rating=${reviewRating}&comment=${encodeURIComponent(reviewComment)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      if (!res.ok) {
        if (res.status === 409) {
          toast.info('Bạn đã đánh giá sản phẩm này rồi');
          setReviewedSkus((prev) => new Set(prev).add(reviewItem.skuId));
          setReviewItem(null);
          return;
        }
        const errText = await res.text();
        throw new Error(errText || `Lỗi ${res.status}`);
      }
      toast.success('Đánh giá thành công!');
      setReviewedSkus((prev) => new Set(prev).add(reviewItem.skuId));
      setReviewItem(null);
    } catch (err: any) {
      toast.error('Không thể gửi đánh giá: ' + (err.message || 'Lỗi'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Filtering ──

  const ordersWithReturns = new Set(returnRequests.map((r) => r.orderId));
  const ordersWithPendingReturns = new Set(
    returnRequests.filter((r) => r.returnStatus === 'PENDING').map((r) => r.orderId)
  );

  const filterOrders = (status: string) => {
    if (!Array.isArray(orders)) return [];
    if (status === 'RETURNED') return [];
    if (status === 'DELIVERED') return orders.filter((o) => o.orderStatus === 'DELIVERED' && !ordersWithReturns.has(o.orderId));
    if (status === 'PENDING_RETURN') return orders.filter((o) => o.orderStatus === 'DELIVERED' && ordersWithPendingReturns.has(o.orderId));
    if (status === 'PENDING') return orders.filter((o) => o.orderStatus === 'PENDING' || o.orderStatus === 'PAID');
    return orders.filter((o) => o.orderStatus === status);
  };

  const getTabCount = (tabValue: string) => {
    if (tabValue === 'RETURNED') return returnRequests.length;
    return filterOrders(tabValue).length;
  };

  const filtered = filterOrders(selectedTab);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Render ──

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#AF140B] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
        <p className="text-rose-600 font-bold text-lg mb-2">Đã xảy ra lỗi</p>
        <p className="text-gray-500 mb-6">{error}</p>
        <Button onClick={fetchOrders} className="bg-[#AF140B] hover:bg-[#8D0F08] text-white rounded-xl">Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => navigate('/account')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#AF140B] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại tài khoản
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Đơn hàng của tôi</h1>
        <p className="text-gray-500 mt-1 italic">Quản lý và theo dõi hành trình niềm vui của bé</p>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
        <TabsList className="bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm w-full flex overflow-x-auto">
          {TAB_LIST.map((tab) => {
            const count = getTabCount(tab.value);
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 min-w-fit rounded-xl data-[state=active]:bg-[#AF140B] data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-2.5 transition-all"
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 bg-white/20 data-[state=active]:bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Content */}
      {selectedTab === 'RETURNED' ? (
        returnsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#AF140B] animate-spin" /></div>
        ) : returnRequests.length === 0 ? (
          <EmptyState />
        ) : (
          returnRequests.map((ret) => <ReturnCard key={ret.returnId} ret={ret} />)
        )
      ) : paged.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {paged.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              reviewedSkus={reviewedSkus}
              productImageMap={productImageMap}
              ordersWithReturns={ordersWithReturns}
              onCancel={handleCancelOrder}
              onReview={(item) => {
                setReviewItem(item);
                setReviewRating(5);
                setReviewHover(0);
                setReviewComment('');
              }}
              onViewReturn={() => setSelectedTab('RETURNED')}
            />
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="rounded-xl">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500 font-medium">Trang {safePage} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="rounded-xl">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Review Dialog */}
      <ReviewDialog
        reviewItem={reviewItem}
        reviewRating={reviewRating}
        reviewHover={reviewHover}
        reviewComment={reviewComment}
        reviewSubmitting={reviewSubmitting}
        onClose={() => setReviewItem(null)}
        onRatingChange={setReviewRating}
        onHoverChange={setReviewHover}
        onCommentChange={setReviewComment}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Package className="w-10 h-10 text-gray-300" />
      </div>
      <p className="text-gray-500 font-bold text-lg mb-1">Không tìm thấy đơn hàng</p>
      <p className="text-gray-400 text-sm">Hãy bắt đầu mua sắm để tạo đơn hàng đầu tiên!</p>
    </div>
  );
}
