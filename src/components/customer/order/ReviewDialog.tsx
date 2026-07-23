import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { Star, Loader2 } from 'lucide-react';
import { OrderItemDTO } from './orderTypes';

interface ReviewDialogProps {
  reviewItem: OrderItemDTO | null;
  reviewRating: number;
  reviewHover: number;
  reviewComment: string;
  reviewSubmitting: boolean;
  onClose: () => void;
  onRatingChange: (rating: number) => void;
  onHoverChange: (hover: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}

export default function ReviewDialog({
  reviewItem, reviewRating, reviewHover, reviewComment, reviewSubmitting,
  onClose, onRatingChange, onHoverChange, onCommentChange, onSubmit,
}: ReviewDialogProps) {
  return (
    <Dialog open={!!reviewItem} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Đánh giá sản phẩm</DialogTitle>
          <DialogDescription className="text-gray-500">
            {reviewItem?.productName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Stars */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onRatingChange(star)}
                onMouseEnter={() => onHoverChange(star)}
                onMouseLeave={() => onHoverChange(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    (reviewHover || reviewRating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            className="w-full border rounded-xl p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-[#AF140B]/20 focus:border-[#AF140B] outline-none"
          />
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            disabled={reviewSubmitting}
            className="bg-[#AF140B] hover:bg-[#8D0F08] text-white rounded-xl font-bold"
          >
            {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Gửi đánh giá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
