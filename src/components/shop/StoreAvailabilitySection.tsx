import { MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { StoreAvailability } from '../../services/inventoryApi';

interface StoreAvailabilitySectionProps {
  storeAvailability: StoreAvailability[];
  storesWithStock: StoreAvailability[];
  availabilityLoading: boolean;
  selectedSku: any;
  onShowStoreModal: () => void;
}

export default function StoreAvailabilitySection({
  storesWithStock,
  availabilityLoading,
  selectedSku,
  onShowStoreModal,
}: StoreAvailabilitySectionProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 mb-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="size-5 text-[#AF140B]" />
        <h3 className="font-bold text-gray-800">Tình Trạng Tại Cửa Hàng</h3>
      </div>

      {availabilityLoading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
          <Loader2 className="size-5 animate-spin" />
          <span>Đang tải tình trạng cửa hàng...</span>
        </div>
      ) : storesWithStock.length > 0 ? (
        <div className="space-y-3">
          {storesWithStock.slice(0, 3).map((store) => (
            <div key={store.storeId} className="p-3 bg-[#FFE5E3] rounded-xl border border-[#AF140B]/20">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 line-clamp-1">{store.storeName}</p>
                  <p className="text-sm text-gray-600 line-clamp-1">{store.address}</p>
                </div>
                <span className="text-[#AF140B] font-bold text-sm whitespace-nowrap">
                  Còn {store.quantity} sp
                </span>
              </div>
            </div>
          ))}

          {storesWithStock.length > 3 && (
            <button
              onClick={onShowStoreModal}
              className="flex items-center justify-center gap-2 text-[#AF140B] hover:text-[#8D0F08] font-semibold text-sm py-2 w-full"
            >
              Xem tất cả {storesWithStock.length} cửa hàng
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <div>
          <p className="text-gray-600 text-sm mb-4">
            {selectedSku
              ? "Sản phẩm hiện tại đã hết hàng ở tất cả các chi nhánh."
              : "Vui lòng chọn loại sản phẩm để kiểm tra tình trạng tại cửa hàng."}
          </p>
          <button
            onClick={onShowStoreModal}
            className="flex items-center gap-2 text-[#AF140B] hover:text-[#8D0F08] font-semibold text-sm"
          >
            <MapPin className="size-4" />
            Xem tình trạng tại cửa hàng →
          </button>
        </div>
      )}
    </div>
  );
}
