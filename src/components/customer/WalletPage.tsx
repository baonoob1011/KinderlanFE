import { useCallback, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { walletApi, Wallet, WalletTransaction, WalletTransactionType } from '../../services/walletApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import WalletTopUpDialog from './WalletTopUpDialog';
import {
  Wallet as WalletIcon,
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  AlertCircle,
  Receipt,
  Plus,
} from 'lucide-react';

const FILTERS: { label: string; value: WalletTransactionType | undefined }[] = [
  { label: 'Tất cả', value: undefined },
  { label: 'Nạp tiền', value: 'TOP_UP' },
  { label: 'Thanh toán', value: 'PAYMENT' },
  { label: 'Hoàn tiền', value: 'RETURN_REFUND' },
];

const TYPE_LABEL: Record<WalletTransactionType, string> = {
  TOP_UP: 'Nạp tiền',
  PAYMENT: 'Thanh toán đơn hàng',
  CANCELLATION_REFUND: 'Hoàn tiền huỷ đơn',
  RETURN_REFUND: 'Hoàn tiền trả hàng',
  ADJUSTMENT_CREDIT: 'Điều chỉnh cộng',
  ADJUSTMENT_DEBIT: 'Điều chỉnh trừ',
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [filter, setFilter] = useState<WalletTransactionType | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();
  const [topUpOpen, setTopUpOpen] = useState(false);
  /**
   * Bấm "Thử nạp lại" ở trang kết quả điều hướng về /account/wallet?topup=1 — mở sẵn hộp thoại
   * rồi xoá tham số để F5 sau đó không tự mở lại.
   */
  useEffect(() => {
    if (searchParams.get('topup') === '1') {
      setTopUpOpen(true);
      searchParams.delete('topup');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const data = await walletApi.getMyWallet();
      setWallet(data);
    } catch (err: unknown) {
      setWalletError(err instanceof Error ? err.message : 'Không thể tải thông tin ví.');
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setTxLoading(true);
    try {
      const data = await walletApi.getMyTransactions({ page, size: 20, type: filter });
      setTransactions(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch wallet transactions:', err);
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /**
   * Quay lại tab ví sau khi thanh toán ở VNPay xong: số dư trong state là số cũ từ lần tải
   * trước, nên nạp lại cả số dư lẫn lịch sử khi trang được hiển thị lại.
   */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchWallet();
        fetchHistory();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchWallet, fetchHistory]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link to="/account">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại tài khoản
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ví Kinderland</h1>
          <p className="text-gray-600">Số dư, thanh toán và lịch sử hoàn tiền của bạn</p>
        </div>

        {/* Balance card */}
        <Card className="bg-gradient-to-br from-[#AF140B] via-[#D91810] to-[#AF140B] text-white shadow-2xl border-2 border-[#D4AF37]/30 mb-6">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/90 mb-2">Số dư khả dụng</p>
                {walletLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-white/70" />
                    <span className="text-white/70 text-lg">Đang tải...</span>
                  </div>
                ) : (
                  <span className="text-4xl font-bold">{formatPrice(wallet?.balance ?? 0)}</span>
                )}
              </div>
              <WalletIcon className="w-16 h-16 text-[#FFD700] drop-shadow-lg" />
            </div>
            <Button
              className="w-full sm:w-auto bg-white text-[#AF140B] hover:bg-white/90 font-bold mb-4"
              disabled={wallet?.status === 'CLOSED'}
              onClick={() => setTopUpOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nạp tiền
            </Button>
            {walletError && (
              <div className="flex items-center gap-2 text-yellow-200 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {walletError}
              </div>
            )}
            {!walletLoading && wallet?.status === 'LOCKED' && (
              <div className="flex items-center gap-2 text-yellow-200 text-xs mt-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Ví đang bị khoá — không thể dùng để thanh toán. Vẫn nhận được hoàn tiền bình thường.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction history */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#AF140B]" />
              Lịch sử giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={filter ?? 'ALL'}
              onValueChange={(v: string) => {
                setPage(0);
                setFilter(v === 'ALL' ? undefined : (v as WalletTransactionType));
              }}
            >
              <TabsList className="mb-4">
                {FILTERS.map((f) => (
                  <TabsTrigger key={f.label} value={f.value ?? 'ALL'}>
                    {f.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={filter ?? 'ALL'}>
                {txLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#AF140B] mb-3" />
                    <p className="text-gray-500">Đang tải lịch sử...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Receipt className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => {
                      const isCredit = tx.direction === 'CREDIT';
                      return (
                        <div
                          key={tx.transactionId}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isCredit ? 'bg-green-100' : 'bg-red-100'
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <ArrowUpCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {tx.description || TYPE_LABEL[tx.type] || tx.type}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(tx.createdAt).toLocaleString('vi-VN')}
                                {tx.orderId ? ` · ORD-${tx.orderId}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                              {isCredit ? '+' : '-'}
                              {formatPrice(tx.amount)}
                            </div>
                            <p className="text-xs text-gray-400">
                              Số dư: {formatPrice(tx.balanceAfter)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Trước
                    </Button>
                    <span className="text-sm text-gray-500">
                      Trang {page + 1}/{totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <WalletTopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} returnTo="/account/wallet" />
    </div>
  );
}
