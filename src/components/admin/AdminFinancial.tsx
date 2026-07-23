import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar as CalendarIcon, RefreshCw, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { financialApi, FinancialOverviewData } from '../../services/financialApi';
import { format } from 'date-fns';

// --- Formatter ---
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AdminFinancial() {
  const [overview, setOverview] = useState<FinancialOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Revenue by date state
  const [startDate, setStartDate] = useState<string>(
    format(new Date(new Date().setDate(1)), 'yyyy-MM-dd') // default to 1st of current month
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd') // default to today
  );
  const [rangedRevenue, setRangedRevenue] = useState<number | null>(null);
  const [loadingRange, setLoadingRange] = useState(false);

  // Fetch Overview Data
  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await financialApi.getFinancialOverview();
      setOverview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu tổng quan.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Revenue by Date Range
  const fetchRevenueRange = async () => {
    if (!startDate || !endDate) return;
    setLoadingRange(true);
    try {
      const revenue = await financialApi.getRevenueByDateRange(startDate, endDate);
      setRangedRevenue(revenue);
    } catch (err) {
      console.error("Failed to load revenue by range", err);
    } finally {
      setLoadingRange(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchRevenueRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFetchRange = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRevenueRange();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Tài chính</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan doanh thu của hệ thống</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchOverview} 
          disabled={loading}
          className="flex items-center gap-2 border-gray-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Doanh thu thuần</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : overview ? formatCurrency(overview.netRevenue ?? overview.totalRevenue) : '0 ₫'}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-gray-400">
                    {overview?.totalRefunds ? `Hoàn trả: -${formatCurrency(overview.totalRefunds)}` : 'Từ trước tới nay'}
                  </span>
                </div>
              </div>
              <div className="bg-[#AF140B]/10 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-[#AF140B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tháng này</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : overview ? formatCurrency(overview.thisMonthNetRevenue ?? overview.thisMonthRevenue) : '0 ₫'}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-medium text-green-600">
                    {overview?.thisMonthRefunds ? `Hoàn trả: -${formatCurrency(overview.thisMonthRefunds)}` : 'Đang cập nhật'}
                  </span>
                </div>
              </div>
              <div className="bg-[#D4AF37]/10 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Hôm nay</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : overview ? formatCurrency(overview.todayNetRevenue ?? overview.todayRevenue) : '0 ₫'}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-medium text-green-600">
                    {overview?.todayRefunds ? `Hoàn trả: -${formatCurrency(overview.todayRefunds)}` : 'Hôm nay'}
                  </span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Date Range Section */}
      <Card className="bg-white col-span-1 border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" /> 
            Doanh thu theo thời gian
          </CardTitle>
          <CardDescription>Tra cứu doanh thu trong một khoảng thời gian được chỉ định</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFetchRange} className="flex flex-col sm:flex-row items-end gap-4 mb-6">
            <div className="w-full sm:w-auto">
              <label className="block text-sm text-gray-600 mb-1">Từ ngày</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AF140B]/50"
                required
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm text-gray-600 mb-1">Đến ngày</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AF140B]/50"
                required
              />
            </div>
            <Button 
                type="submit" 
                disabled={loadingRange} 
                className="w-full sm:w-auto bg-[#AF140B] hover:bg-[#8A1009] text-white"
            >
              {loadingRange ? 'Đang lọc...' : 'Lọc doanh thu'}
            </Button>
          </form>

          <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center border border-gray-100">
            <p className="text-sm mb-2 text-gray-500">Doanh thu đạt được</p>
            <h2 className="text-4xl font-extrabold text-[#AF140B]">
              {loadingRange ? '...' : rangedRevenue !== null ? formatCurrency(rangedRevenue) : '0 ₫'}
            </h2>
            <div className="mt-4 px-3 py-1 bg-white rounded-full text-xs font-medium border border-gray-200 text-gray-600">
              {startDate} đến {endDate}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
