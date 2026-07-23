interface SkuSelectorProps {
  skus: any[];
  selectedSku: any;
  onSelectSku: (sku: any) => void;
}

export default function SkuSelector({ skus, selectedSku, onSelectSku }: SkuSelectorProps) {
  // Extract unique values for each variant dimension
  const colors = [...new Set(skus.map((s: any) => s.color).filter(Boolean))];
  const types = [...new Set(skus.map((s: any) => s.type).filter(Boolean))];
  // Sizes filtered by selected color/type for cascading selection
  const sizes = [...new Set(
    skus
      .filter((s: any) => !selectedSku?.color || s.color === selectedSku.color)
      .filter((s: any) => !selectedSku?.type || s.type === selectedSku.type)
      .map((s: any) => s.size)
      .filter(Boolean)
  )];

  const hasAnyVariant = colors.length > 0 || sizes.length > 0 || types.length > 0;

  // If there's nothing to select, render nothing
  if (!hasAnyVariant && skus.length <= 1) return null;

  return (
    <div className="mt-4 space-y-4">
      {/* Color selector */}
      {colors.length > 0 && (
        <div>
          <p className="font-semibold mb-2 text-sm text-gray-700">
            Màu sắc: {selectedSku?.color && <span className="font-bold text-gray-900">{selectedSku.color}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color: any) => {
              const isSelected = selectedSku?.color === color;
              const matchingSku = skus.find((s: any) =>
                s.color === color && (!selectedSku?.size || s.size === selectedSku.size)
              ) || skus.find((s: any) => s.color === color);
              return (
                <button
                  key={color}
                  onClick={() => matchingSku && onSelectSku(matchingSku)}
                  title={color}
                  className={`flex items-center gap-2 px-3 py-1.5 border-2 rounded-full text-sm font-medium transition-all ${isSelected
                    ? 'border-[#AF140B] bg-[#FFE5E3] text-[#AF140B]'
                    : 'border-gray-200 bg-white hover:border-gray-400 text-gray-700'
                    }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Type selector */}
      {types.length > 0 && (
        <div>
          <p className="font-semibold mb-2 text-sm text-gray-700">
            Loại: {selectedSku?.type && <span className="font-bold text-gray-900">{selectedSku.type}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {types.map((type: any) => {
              const isSelected = selectedSku?.type === type;
              const matchingSku = skus.find((s: any) =>
                s.type === type && (!selectedSku?.color || s.color === selectedSku.color)
              ) || skus.find((s: any) => s.type === type);
              return (
                <button
                  key={type}
                  onClick={() => matchingSku && onSelectSku(matchingSku)}
                  className={`px-4 py-2 border-2 rounded-lg text-sm font-semibold transition-all ${isSelected
                    ? 'bg-[#AF140B] text-white border-[#AF140B] shadow-md'
                    : 'bg-white border-gray-200 hover:border-[#AF140B]/40 text-gray-700'
                    }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size selector */}
      {sizes.length > 0 && (
        <div>
          <p className="font-semibold mb-2 text-sm text-gray-700">
            Kích cỡ: {selectedSku?.size && <span className="font-bold text-gray-900">{selectedSku.size}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size: any) => {
              const isSelected = selectedSku?.size === size;
              const matchingSku = skus.find((s: any) =>
                s.size === size && (!selectedSku?.color || s.color === selectedSku.color)
              ) || skus.find((s: any) => s.size === size);
              return (
                <button
                  key={size}
                  onClick={() => matchingSku && onSelectSku(matchingSku)}
                  className={`px-4 py-2 border-2 rounded-lg text-sm font-semibold transition-all ${isSelected
                    ? 'bg-[#AF140B] text-white border-[#AF140B] shadow-md'
                    : 'bg-white border-gray-200 hover:border-[#AF140B]/40 text-gray-700'
                    }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
