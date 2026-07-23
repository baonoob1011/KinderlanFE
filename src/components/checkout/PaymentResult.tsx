import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle, XCircle, AlertTriangle, Home, ClipboardList, Loader2 } from 'lucide-react';

type PaymentStatus = 'loading' | 'success' | 'cancelled' | 'failed' | 'invalid';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      // Collect all VNPay params from URL
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      const txnRef = params['vnp_TxnRef'];
      if (txnRef) setOrderId(txnRef);

      // If we have VNPay params, verify with backend
      if (params['vnp_ResponseCode']) {
        try {
          const response = await fetch('/api/v1/payment/verify-vnpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          });
          const data = await response.json();
          setStatus(data.status as PaymentStatus);
        } catch {
          // If backend is down, check response code directly
          const code = params['vnp_ResponseCode'];
          if (code === '00') setStatus('success');
          else if (code === '24') setStatus('cancelled');
          else setStatus('failed');
        }
      } else {
        // No VNPay params — check if status was passed directly
        const directStatus = params['status'];
        if (directStatus && ['success', 'cancelled', 'failed', 'invalid'].includes(directStatus)) {
          setStatus(directStatus as PaymentStatus);
        } else {
          navigate('/');
        }
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  const config: Record<PaymentStatus, {
    icon: React.ReactNode;
    title: string;
    message: string;
    iconBg: string;
  }> = {
    loading: {
      icon: <Loader2 className="size-16 text-gray-400 animate-spin" />,
      title: 'Đang xử lý...',
      message: 'Vui lòng đợi trong khi chúng tôi xác nhận thanh toán.',
      iconBg: 'bg-gray-100',
    },
    success: {
      icon: <CheckCircle className="size-16 text-green-500" />,
      title: 'Thanh toán thành công',
      message: orderId
        ? `Đơn hàng #${orderId} đã được thanh toán thành công. Đơn hàng sẽ được xử lý sớm nhất.`
        : 'Đơn hàng đã được thanh toán. Cảm ơn bạn đã mua sắm tại Kinderland!',
      iconBg: 'bg-green-100',
    },
    cancelled: {
      icon: <AlertTriangle className="size-16 text-yellow-500" />,
      title: 'Thanh toán đã bị hủy',
      message: 'Bạn đã hủy giao dịch. Đơn hàng vẫn được giữ, bạn có thể thanh toán lại.',
      iconBg: 'bg-yellow-100',
    },
    failed: {
      icon: <XCircle className="size-16 text-red-500" />,
      title: 'Thanh toán thất bại',
      message: 'Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
      iconBg: 'bg-red-100',
    },
    invalid: {
      icon: <XCircle className="size-16 text-red-500" />,
      title: 'Giao dịch không hợp lệ',
      message: 'Xác thực không thành công. Vui lòng liên hệ hỗ trợ nếu bạn đã bị trừ tiền.',
      iconBg: 'bg-red-100',
    },
  };

  const current = config[status];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className={`p-4 rounded-full ${current.iconBg}`}>
            {current.icon}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {current.title}
        </h1>

        {/* Order info */}
        {orderId && status === 'success' && (
          <p className="text-sm text-gray-500 mb-2">
            Đơn hàng #{orderId}
          </p>
        )}

        {/* Message */}
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {current.message}
        </p>

        {/* Buttons */}
        {status !== 'loading' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-sm"
            >
              <Home className="size-4" />
              Về trang chủ
            </button>
            <button
              onClick={() => navigate('/account/orders')}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              <ClipboardList className="size-4" />
              Xem đơn hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
