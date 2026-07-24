import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Wallet as WalletIcon, RotateCcw } from 'lucide-react';
import { walletApi, WalletTopUp, topUpErrorMessage } from '../../services/walletApi';
import { Button } from '../ui/button';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

/**
 * IPN của VNPay là server-to-server và có thể tới SAU khi trình duyệt đã quay về đây, nên
 * lần hỏi đầu tiên rất hay nhận PENDING. Hỏi lại vài nhịp thay vì kết luận ngay "thất bại".
 */
const POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 2000;

export default function WalletTopUpResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topupCode = searchParams.get('topupCode');

  const [topUp, setTopUp] = useState<WalletTopUp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  // Nơi quay lại do luồng gọi nạp tiền đặt trước khi rời sang VNPay (vd. '/checkout').
  const returnTo = sessionStorage.getItem('walletTopUpReturnTo') || '/account/wallet';
  const returningToCheckout = returnTo !== '/account/wallet';

  const poll = useCallback(async (code: string, attempt: number) => {
    try {
      // Trạng thái lấy từ backend, KHÔNG suy từ vnp_ResponseCode trên URL — tham số trên
      // thanh địa chỉ có thể bị sửa, còn DB chỉ đổi khi callback đã qua kiểm tra chữ ký.
      const data = await walletApi.getTopUp(code);
      setTopUp(data);
      if (data.status === 'PENDING' && attempt < POLL_ATTEMPTS) {
        const id = window.setTimeout(() => poll(code, attempt + 1), POLL_INTERVAL_MS);
        timers.current.push(id);
        return;
      }
      setLoading(false);
    } catch (err) {
      setError(topUpErrorMessage(err));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!topupCode) {
      setError('Thiếu mã giao dịch nạp tiền.');
      setLoading(false);
      return;
    }
    poll(topupCode, 1);
    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, [topupCode, poll]);

  const goToWallet = () => {
    sessionStorage.removeItem('walletTopUpReturnTo');
    navigate('/account/wallet');
  };

  const goBackToReturnTo = () => {
    sessionStorage.removeItem('walletTopUpReturnTo');
    navigate(returnTo);
  };

  const status = topUp?.status;
  const isPending = loading || status === 'PENDING';

  const view = (() => {
    if (error) {
      return {
        icon: <XCircle className="size-16 text-red-500" />,
        iconBg: 'bg-red-100',
        title: 'Không kiểm tra được giao dịch',
        message: error,
      };
    }
    if (isPending) {
      return {
        icon: <Loader2 className="size-16 text-gray-400 animate-spin" />,
        iconBg: 'bg-gray-100',
        title: 'Đang kiểm tra giao dịch...',
        message: 'Giao dịch đang được xử lý. Vui lòng chờ trong giây lát.',
      };
    }
    if (status === 'SUCCESS') {
      return {
        icon: <CheckCircle className="size-16 text-green-500" />,
        iconBg: 'bg-green-100',
        title: 'Nạp tiền thành công',
        message: `${formatPrice(topUp?.amount ?? 0)} đã được cộng vào Ví Kinderland.`,
      };
    }
    if (status === 'EXPIRED') {
      return {
        icon: <AlertTriangle className="size-16 text-yellow-500" />,
        iconBg: 'bg-yellow-100',
        title: 'Yêu cầu nạp tiền đã hết hạn',
        message: 'Số dư ví chưa thay đổi. Bạn có thể tạo yêu cầu nạp tiền mới.',
      };
    }
    return {
      icon: <XCircle className="size-16 text-red-500" />,
      iconBg: 'bg-red-100',
      title: 'Nạp tiền không thành công',
      message: 'Số dư ví chưa thay đổi. Bạn có thể thử nạp lại.',
    };
  })();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-5">
          <div className={`p-4 rounded-full ${view.iconBg}`}>{view.icon}</div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">{view.title}</h1>

        {topUp && (
          <p className="text-sm text-gray-500 mb-2">
            Mã giao dịch: {topUp.topupCode}
            {topUp.vnpTransactionNo ? ` · VNPay ${topUp.vnpTransactionNo}` : ''}
          </p>
        )}

        <p className="text-gray-500 text-sm mb-8 leading-relaxed">{view.message}</p>

        {!isPending && (
          <div className="space-y-3">
            {returningToCheckout && status === 'SUCCESS' && (
              <Button className="w-full bg-[#AF140B] hover:bg-[#8f100a] text-white" onClick={goBackToReturnTo}>
                Quay lại thanh toán
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={goToWallet}>
              <WalletIcon className="size-4 mr-2" />
              Quay về ví
            </Button>
            {status !== 'SUCCESS' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/account/wallet?topup=1')}
              >
                <RotateCcw className="size-4 mr-2" />
                Thử nạp lại
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
