import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Wallet as WalletIcon } from 'lucide-react';
import {
  walletApi,
  WalletTopUpConfig,
  topUpErrorMessage,
} from '../../services/walletApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const FALLBACK_QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Nơi đưa khách quay lại sau khi nạp xong (vd. '/checkout'). Lưu vào sessionStorage vì
   * redirect sang VNPay rời hẳn khỏi SPA — mọi state trong bộ nhớ đều mất.
   */
  returnTo?: string;
}

export default function WalletTopUpDialog({ open, onOpenChange, returnTo }: Props) {
  const [config, setConfig] = useState<WalletTopUpConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || config) return;
    setConfigLoading(true);
    walletApi
      .getTopUpConfig()
      .then(setConfig)
      // Hạn mức chỉ để hiển thị/chặn sớm; backend vẫn là bên chốt, nên mất config
      // không được phép chặn khách nạp tiền.
      .catch(() => setConfig(null))
      .finally(() => setConfigLoading(false));
  }, [open, config]);

  const minAmount = config?.minAmount ?? 50000;
  const maxAmount = config?.maxAmount ?? 10000000;
  const quickAmounts = config?.quickAmounts?.length ? config.quickAmounts : FALLBACK_QUICK_AMOUNTS;

  const amount = useMemo(() => {
    if (selected !== null) return selected;
    const parsed = Number(customAmount.replace(/\D/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [selected, customAmount]);

  const validationError = useMemo(() => {
    if (amount <= 0) return null;
    if (amount < minAmount) return `Số tiền nạp tối thiểu là ${formatPrice(minAmount)}`;
    if (amount > maxAmount) return `Số tiền nạp tối đa là ${formatPrice(maxAmount)}`;
    return null;
  }, [amount, minAmount, maxAmount]);

  const canSubmit = amount > 0 && !validationError && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const topUp = await walletApi.createTopUp(amount);
      if (!topUp.paymentUrl) {
        throw new Error('Không lấy được link thanh toán VNPay');
      }
      // Ghi TRƯỚC khi rời trang: sau redirect, component này không còn tồn tại để ghi nữa.
      sessionStorage.setItem('walletTopUpReturnTo', returnTo || '/account/wallet');
      window.location.href = topUp.paymentUrl;
    } catch (err) {
      toast.error(topUpErrorMessage(err));
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSelected(null);
    setCustomAmount('');
    setSubmitting(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nạp tiền vào Ví Kinderland</DialogTitle>
          <DialogDescription>
            Chọn nhanh một mức tiền hoặc nhập số tiền bạn muốn nạp.
          </DialogDescription>
        </DialogHeader>

        {configLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#AF140B]" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelected(value);
                    setCustomAmount('');
                  }}
                  className={`py-2 px-1 rounded-lg border-2 text-sm font-semibold transition-colors ${
                    selected === value
                      ? 'border-[#AF140B] bg-[#FFE5E3] text-[#AF140B]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {new Intl.NumberFormat('vi-VN').format(value)}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="topup-custom-amount">
                Nhập số tiền khác
              </label>
              <Input
                id="topup-custom-amount"
                inputMode="numeric"
                placeholder="Ví dụ: 750.000"
                value={customAmount ? new Intl.NumberFormat('vi-VN').format(Number(customAmount)) : ''}
                onChange={(e) => {
                  setSelected(null);
                  setCustomAmount(e.target.value.replace(/\D/g, ''));
                }}
              />
              <p className="text-xs text-gray-400 mt-1">
                Tối thiểu {formatPrice(minAmount)} · Tối đa {formatPrice(maxAmount)}
              </p>
              {validationError && (
                <p className="text-xs text-red-500 mt-1">{validationError}</p>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền nạp</span>
                <span className="font-bold text-gray-900">{formatPrice(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phương thức</span>
                <span className="font-medium text-gray-900">VNPay</span>
              </div>
            </div>

            <Button
              className="w-full bg-[#AF140B] hover:bg-[#8f100a] text-white"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang chuyển tới VNPay...
                </>
              ) : (
                <>
                  <WalletIcon className="w-4 h-4 mr-2" />
                  Thanh toán qua VNPay
                </>
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Số dư ví chỉ được cộng sau khi VNPay xác nhận thanh toán thành công.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
