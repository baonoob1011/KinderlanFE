import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { ReturnRequest, RETURN_STATUS_CONFIG, formatPrice } from './orderTypes';
import { returnApi } from '../../../services/returnApi';

interface ReturnCardProps {
  ret: ReturnRequest;
}

export default function ReturnCard({ ret }: ReturnCardProps) {
  const [printing, setPrinting] = useState(false);

  const statusCfg = RETURN_STATUS_CONFIG[ret.returnStatus] || {
    label: ret.returnStatus,
    color: 'bg-gray-100 text-gray-800',
  };

  const canPrintLabel = ret.returnStatus === 'APPROVED';

  const handlePrintLabel = async () => {
    setPrinting(true);
    try {
      const html = await returnApi.getShippingLabel(ret.returnId);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (err) {
      console.error('Failed to fetch shipping label:', err);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Card className="mb-5 overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
      <div className="h-1.5 w-full bg-purple-200" />
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-gray-900">
              Yêu cầu #{ret.returnCode}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Đơn hàng #{ret.orderId} · {ret.productName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canPrintLabel && (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrintLabel}
                disabled={printing}
                className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {printing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                )}
                In phiếu gửi hàng
              </Button>
            )}
            <Badge variant="outline" className={`${statusCfg.color} border font-bold px-3 py-1 rounded-full`}>
              {statusCfg.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Lý do trả</p>
            <p className="font-medium">{ret.returnReason}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Số lượng</p>
            <p className="font-medium">{ret.quantity}</p>
          </div>
          {ret.refundAmount && (
            <div>
              <p className="text-gray-500 text-xs">Số tiền hoàn</p>
              <p className="font-bold text-green-600">{formatPrice(ret.refundAmount)}</p>
            </div>
          )}
          {ret.rejectionReason && (
            <div className="col-span-2">
              <p className="text-gray-500 text-xs">Lý do từ chối</p>
              <p className="font-medium text-rose-600">{ret.rejectionReason}</p>
            </div>
          )}
        </div>
        {ret.photoUrls && ret.photoUrls.length > 0 && (
          <div className="flex gap-2 mt-3">
            {ret.photoUrls.map((url, i) => (
              <img key={i} src={url} alt={`Return photo ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
