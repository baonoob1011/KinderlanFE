import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Package, ShoppingCart, Users, DollarSign,
  ArrowUpRight, TrendingUp, RotateCcw, Eye,
  Loader2, RefreshCw, Clock, CheckCircle, XCircle,
  Truck, CreditCard, Gift, MessageSquare, FileText,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend,
} from 'recharts';
import api from '../../services/api';
import { financialApi } from '../../services/financialApi';

// ─── Helpers ─────────────────────────────────────────────
const fmtMoney = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
};

const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return s; }
};

const ORDER_STATUS_CFG: Record<string, { label: string; color: string; hex: string; icon: typeof Clock }> = {
  PENDING: { label: 'Chờ XN', color: 'bg-yellow-100 text-yellow-700', hex: '#eab308', icon: Clock },
  PAID: { label: 'Đã TT', color: 'bg-blue-100 text-blue-700', hex: '#3b82f6', icon: CreditCard },
  CONFIRMED: { label: 'Đã XN', color: 'bg-indigo-100 text-indigo-700', hex: '#6366f1', icon: CheckCircle },
  SHIPPING: { label: 'Đang giao', color: 'bg-cyan-100 text-cyan-700', hex: '#06b6d4', icon: Truck },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-700', hex: '#22c55e', icon: CheckCircle },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700', hex: '#10b981', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', hex: '#ef4444', icon: XCircle },
};

const PIE_COLORS = ['#AF140B', '#D4AF37', '#3b82f6', '#06b6d4', '#22c55e', '#10b981', '#ef4444'];

// ─── Custom tooltip ──────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-bold">{typeof p.value === 'number' && p.value > 1000 ? fmtMoney(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Component ───────────────────────────────────────────
export default function AdminDashboard() {
  const { adminUser } = useAdmin();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [financial, setFinancial] = useState<{
    totalRevenue: number; todayRevenue: number; thisMonthRevenue: number;
    totalRefunds?: number; todayRefunds?: number; thisMonthRefunds?: number;
    netRevenue?: number; todayNetRevenue?: number; thisMonthNetRevenue?: number;
  } | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);

  // ─── Fetch ─────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      financialApi.getFinancialOverview(),
      api.get('/api/v1/orders?page=0&size=200'),
      api.get('/api/v1/products?size=1000'),
      api.get('/api/v1/admin/accounts'),
      api.get('/api/v1/return-requests?page=0&size=100'),
    ]);

    if (results[0].status === 'fulfilled') setFinancial(results[0].value);
    if (results[1].status === 'fulfilled') {
      const d = results[1].value?.data ?? results[1].value;
      const content = d?.content ?? d ?? [];
      const sorted = (Array.isArray(content) ? content : []).sort((a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setAllOrders(sorted);
      setTotalOrders(d?.totalElements ?? sorted.length);
    }
    if (results[2].status === 'fulfilled') {
      const d = results[2].value;
      const arr = d?.data?.content ?? d?.data ?? d?.content ?? d ?? [];
      setProducts(Array.isArray(arr) ? arr : []);
    }
    if (results[3].status === 'fulfilled') {
      const d = results[3].value;
      const arr = d?.data?.content ?? d?.data ?? d?.content ?? d ?? [];
      setUsers(Array.isArray(arr) ? arr : []);
    }
    if (results[4].status === 'fulfilled') {
      const d = results[4].value?.data ?? results[4].value;
      const content = d?.content ?? d ?? [];
      setReturns(Array.isArray(content) ? content : []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ─── Derived data ──────────────────────────────────────

  // Order status counts for pie chart
  const ordersByStatus = allOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(ORDER_STATUS_CFG)
    .map(([key, cfg]) => ({ name: cfg.label, value: ordersByStatus[key] || 0, status: key }))
    .filter(d => d.value > 0);

  // Revenue by month (last 6 months from order data, NET = gross - refunds)
  const MONTH_NAMES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const revenueByMonth = (() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${MONTH_NAMES[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
      months[key] = 0;
    }
    // Add gross revenue from delivered orders only
    allOrders.forEach(o => {
      if (o.orderStatus !== 'DELIVERED') return;
      const date = new Date(o.createdAt || o.orderDate);
      const key = `${MONTH_NAMES[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`;
      if (months[key] !== undefined) months[key] += (o.totalAmount || 0);
    });
    // Subtract refunded amounts
    returns.forEach((r: any) => {
      if (r.returnStatus === 'REFUNDED' && r.refundedAt && r.refundAmount) {
        const date = new Date(r.refundedAt);
        const key = `${MONTH_NAMES[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`;
        if (months[key] !== undefined) months[key] -= r.refundAmount;
      }
    });
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue: Math.max(0, revenue) }));
  })();

  // Orders per month bar chart
  const ordersPerMonth = (() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${MONTH_NAMES[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
      months[key] = 0;
    }
    allOrders.forEach(o => {
      const date = new Date(o.createdAt || o.orderDate);
      const key = `${MONTH_NAMES[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`;
      if (months[key] !== undefined) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  })();

  // Return status for horizontal bar
  const returnsByStatus = returns.reduce<Record<string, number>>((acc, r) => {
    acc[r.returnStatus] = (acc[r.returnStatus] || 0) + 1;
    return acc;
  }, {});
  const returnBarData = [
    { name: 'Chờ duyệt', value: returnsByStatus['PENDING'] || 0, fill: '#eab308' },
    { name: 'Đã duyệt', value: returnsByStatus['APPROVED'] || 0, fill: '#3b82f6' },
    { name: 'Đã nhận', value: returnsByStatus['RECEIVED'] || 0, fill: '#6366f1' },
    { name: 'Đã hoàn tiền', value: returnsByStatus['REFUNDED'] || 0, fill: '#22c55e' },
    { name: 'Từ chối', value: returnsByStatus['REJECTED'] || 0, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  // Top products by order frequency
  const productFreq: Record<string, number> = {};
  allOrders.forEach(o => {
    const items = o.items || o.orderItems;
    if (items && Array.isArray(items)) {
      items.forEach((item: any) => {
        const name = item.productName || item.skuName || `SKU-${item.skuId}`;
        productFreq[name] = (productFreq[name] || 0) + (item.quantity || 1);
      });
    }
  });
  const topProducts = Object.entries(productFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, qty]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, qty }));

  const pendingReturns = returns.filter((r: any) => r.returnStatus === 'PENDING');

  // Stat cards
  const statCards = [
    { label: 'Doanh thu thuần', value: financial ? fmtMoney(financial.netRevenue ?? financial.totalRevenue) : '—', sub: financial?.totalRefunds ? `Hoàn trả: -${fmtMoney(financial.totalRefunds)}` : `Hôm nay: ${fmtMoney(financial?.todayRevenue ?? 0)}`, icon: DollarSign, bg: 'bg-gradient-to-br from-[#AF140B] to-[#d92e24]', onClick: () => navigate('/admin/financial') },
    { label: 'Doanh thu tháng', value: financial ? fmtMoney(financial.thisMonthNetRevenue ?? financial.thisMonthRevenue) : '—', sub: financial?.thisMonthRefunds ? `Hoàn trả: -${fmtMoney(financial.thisMonthRefunds)}` : 'Tháng hiện tại', icon: TrendingUp, bg: 'bg-gradient-to-br from-[#D4AF37] to-[#e8c94a]', onClick: () => navigate('/admin/financial') },
    { label: 'Tổng đơn hàng', value: totalOrders.toLocaleString('vi-VN'), sub: `${ordersByStatus['PENDING'] || 0} chờ xử lý`, icon: ShoppingCart, bg: 'bg-gradient-to-br from-blue-600 to-blue-500', onClick: () => navigate('/admin/orders') },
    { label: 'Sản phẩm', value: products.length.toLocaleString('vi-VN'), sub: `${products.filter((p: any) => p.active !== false).length} hoạt động`, icon: Package, bg: 'bg-gradient-to-br from-emerald-600 to-emerald-500', onClick: () => navigate('/admin/products') },
    { label: 'Người dùng', value: users.length.toLocaleString('vi-VN'), sub: 'Tổng tài khoản', icon: Users, bg: 'bg-gradient-to-br from-violet-600 to-violet-500', onClick: () => navigate('/admin/users') },
    { label: 'Hoàn trả', value: returns.length.toString(), sub: `${pendingReturns.length} chờ duyệt`, icon: RotateCcw, bg: 'bg-gradient-to-br from-orange-500 to-orange-400', onClick: () => navigate('/admin/returns') },
  ];

  // ─── JSX ───────────────────────────────────────────────
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👋 Xin chào, {adminUser?.name || 'Admin'}!</h1>
          <p className="text-sm text-gray-500 mt-0.5">Chào mừng bạn trở lại hệ thống quản trị Kinderland.</p>
        </div>
        <Button variant="outline" onClick={fetchAll} disabled={loading} className="border-gray-300 hover:border-[#AF140B] hover:text-[#AF140B]">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Làm mới
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#AF140B]" />
          <span className="ml-3 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <button key={i} onClick={s.onClick} className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`${s.bg} w-10 h-10 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#AF140B] transition-colors" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 truncate">{s.value}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{s.label}</p>
                  {s.sub && <p className="text-[10px] text-gray-400 mt-1 truncate">{s.sub}</p>}
                </button>
              );
            })}
          </div>

          {/* ── Charts Row 1: Revenue Area + Order Status Pie ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Revenue Area Chart (2/3) */}
            <Card className="lg:col-span-2 border border-gray-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                  <DollarSign className="w-4 h-4 text-[#AF140B]" />
                  Doanh thu theo tháng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenueByMonth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#AF140B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#AF140B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#9ca3af' }} width={55} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#AF140B" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#AF140B', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Pie Chart (1/3) */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                  <ShoppingCart className="w-4 h-4 text-[#D4AF37]" />
                  Trạng thái đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={ORDER_STATUS_CFG[pieData[i].status]?.hex || PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => [val, 'Đơn']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ORDER_STATUS_CFG[d.status]?.hex || PIE_COLORS[i] }} />
                          {d.name} ({d.value})
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 py-10">Chưa có dữ liệu</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Charts Row 2: Orders Bar + Return Status Bar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Orders per day bar chart */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                  Số đơn hàng theo tháng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ordersPerMonth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Đơn hàng" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Return status breakdown */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                    <RotateCcw className="w-4 h-4 text-orange-500" />
                    Trạng thái hoàn trả
                  </CardTitle>
                  <Badge className="bg-orange-100 text-orange-700 text-[10px]">{returns.length} tổng</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {returnBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={returnBarData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Số lượng" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {returnBarData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 py-10 text-center">Chưa có yêu cầu hoàn trả.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Row 3: Top Products + Recent Orders ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Top Products Chart */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                  <Package className="w-4 h-4 text-emerald-500" />
                  Sản phẩm bán chạy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="qty" name="Số lượng bán" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 py-10 text-center">Chưa có dữ liệu sản phẩm.</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                    <ShoppingCart className="w-4 h-4 text-[#D4AF37]" />
                    Đơn hàng gần đây
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => navigate('/admin/orders')} className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />Tất cả
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {allOrders.length === 0 ? (
                  <p className="text-center text-gray-400 py-6 text-sm">Chưa có đơn hàng.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {allOrders.slice(0, 6).map((o: any) => {
                      const cfg = ORDER_STATUS_CFG[o.orderStatus] || { label: o.orderStatus, color: 'bg-gray-100 text-gray-600' };
                      return (
                        <div key={o.orderId} className="flex items-center justify-between pb-2.5 border-b last:border-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-800">ORD-{o.orderId}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(o.createdAt || '')}</p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <p className="font-bold text-sm text-gray-800">{fmtMoney(o.totalAmount || 0)}</p>
                            <Badge variant="outline" className={`${cfg.color} text-[10px] mt-1`}>{cfg.label}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </>
      )}
    </div>
  );
}