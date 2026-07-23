import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
    DollarSign, TrendingUp, Calendar, LayoutDashboard,
    LogOut, ArrowLeft, RefreshCw, AlertCircle
} from 'lucide-react';
import { financialApi, FinancialOverviewData } from '../../services/financialApi';

// --- Format tiền VNĐ ---
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

// --- Skeleton Card ---
function SkeletonCard() {
    return (
        <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-6">
                <div className="flex items-start justify-between animate-pulse">
                    <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-8 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function FinancialOverview() {
    const navigate = useNavigate();
    const { adminUser, logoutAdmin } = useAdmin();

    const [data, setData] = useState<FinancialOverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchOverview = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await financialApi.getFinancialOverview();
            setData(result);
            setLastUpdated(new Date());
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu tài chính.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    const handleLogout = () => {
        logoutAdmin();
        navigate('/login');
    };

    const metrics = data
        ? [
            {
                label: 'Doanh Thu Thuần',
                value: formatCurrency(data.netRevenue ?? data.totalRevenue),
                sub: data.totalRefunds ? `Sau hoàn trả: -${formatCurrency(data.totalRefunds)}` : 'Tính từ khi khai trương',
                icon: DollarSign,
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border-green-200',
            },
            {
                label: 'Doanh Thu Hôm Nay',
                value: formatCurrency(data.todayNetRevenue ?? data.todayRevenue),
                sub: data.todayRefunds ? `Hoàn trả: -${formatCurrency(data.todayRefunds)}` : new Date().toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }),
                icon: TrendingUp,
                color: 'text-[#AF140B]',
                bg: 'bg-red-50',
                border: 'border-red-200',
            },
            {
                label: 'Doanh Thu Tháng Này',
                value: formatCurrency(data.thisMonthNetRevenue ?? data.thisMonthRevenue),
                sub: data.thisMonthRefunds ? `Hoàn trả: -${formatCurrency(data.thisMonthRefunds)}` : new Date().toLocaleDateString('vi-VN', {
                    month: 'long',
                    year: 'numeric',
                }),
                icon: Calendar,
                color: 'text-[#D4AF37]',
                bg: 'bg-amber-50',
                border: 'border-amber-200',
            },
        ]
        : [];

    return (
        <div className="min-h-full bg-white">

            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2C2C2C]">Quản Lý Tài Chính</h1>
                                <p className="text-sm text-gray-600">
                                    {adminUser?.name} · {adminUser?.storeName || 'Tất cả chi nhánh'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/manager/dashboard')}
                                className="border-gray-300"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="border-[#AF140B] text-[#AF140B] hover:bg-[#AF140B] hover:text-white"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Title row */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-[#2C2C2C]">Tổng Quan Doanh Thu</h2>
                        {lastUpdated && (
                            <p className="text-xs text-gray-500 mt-1">
                                Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
                            </p>
                        )}
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

                {/* Error Banner */}
                {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Không thể tải dữ liệu</p>
                            <p className="text-sm mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {loading
                        ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                        : metrics.map((m, i) => {
                            const Icon = m.icon;
                            return (
                                <Card
                                    key={i}
                                    className={`border ${m.border} shadow-md hover:shadow-lg transition-shadow`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600 mb-1">{m.label}</p>
                                                <p className="text-2xl font-bold text-[#2C2C2C] mb-1 break-all">
                                                    {m.value}
                                                </p>
                                                <p className="text-xs text-gray-500">{m.sub}</p>
                                            </div>
                                            <div className={`${m.bg} p-3 rounded-xl ml-3`}>
                                                <Icon className={`w-6 h-6 ${m.color}`} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                </div>

                {/* Info Card */}
                {!loading && !error && (
                    <Card className="border border-gray-200 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-green-600" />
                                Ghi Chú
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                                <li>
                                    Số liệu được lấy trực tiếp từ hệ thống và có thể có độ trễ nhỏ.
                                </li>
                                <li>
                                    Nhấn <strong>Làm mới</strong> để cập nhật số liệu mới nhất.
                                </li>
                                <li>
                                    Doanh thu tính bằng đồng Việt Nam (VNĐ).
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
