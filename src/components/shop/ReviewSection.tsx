import { useState, useEffect } from 'react';
import { Star, Loader2, MessageSquare, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { reviewApi, Review } from '../../services/reviewApi';
import StarRating from './StarRating';

interface ReviewSectionProps {
  productId: number;
  selectedSku: any;
}

export default function ReviewSection({ productId, selectedSku }: ReviewSectionProps) {
  const { user } = useApp();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(false);

  // Fetch reviews for this product
  useEffect(() => {
    if (!productId) return;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const data = await reviewApi.getByProduct(productId);
        setReviews(data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);

  // Detect if current user already reviewed this product
  useEffect(() => {
    if (!user || reviews.length === 0) return;
    
    // Also check cached accountId from previous 409 detection
    const cachedAccountId = localStorage.getItem('myAccountId');
    
    const found = reviews.find(r => {
      // Match by accountId (number vs string comparison)
      if (r.accountId && (String(r.accountId) === String(user.id))) return true;
      // Match by cached account ID from previous 409 detection
      if (r.accountId && cachedAccountId && String(r.accountId) === cachedAccountId) return true;
      // Match by reviewer name
      if (r.reviewerName && (r.reviewerName === user.name || r.reviewerName === user.username || r.reviewerName === user.email)) return true;
      return false;
    });
    
    if (found) {
      setMyReview(found);
      setReviewRating(found.rating);
      setReviewComment(found.comment);
    } else {
      setMyReview(null);
    }
  }, [reviews, user]);

  const handleSubmitReview = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập để đánh giá'); return; }
    if (!reviewComment.trim()) { toast.error('Vui lòng nhập nội dung đánh giá'); return; }
    if (!selectedSku) { toast.error('Vui lòng chọn loại sản phẩm trước khi đánh giá'); return; }
    setReviewSubmitting(true);
    try {
      if (myReview && editingReview) {
        const updated = await reviewApi.edit(myReview.id, { rating: reviewRating, comment: reviewComment.trim() });
        setReviews(prev => prev.map(r => r.id === myReview.id ? { ...r, ...updated, rating: reviewRating, comment: reviewComment.trim() } : r));
        setMyReview(prev => prev ? { ...prev, rating: reviewRating, comment: reviewComment.trim() } : null);
        setEditingReview(false);
        toast.success('Đã cập nhật đánh giá!');
      } else {
        const added = await reviewApi.addReview(selectedSku.id, { rating: reviewRating, comment: reviewComment.trim() });
        setReviews(prev => [added, ...prev]);
        setMyReview(added);
        setReviewComment('');
        toast.success('Cảm ơn bạn đã đánh giá!');
      }
    } catch (err: any) {
      console.log('[ReviewSection] CATCH block reached! err.message:', err.message);
      // Parse backend error message
      let errorMessage = 'Gửi đánh giá thất bại';
      try {
        const parsed = JSON.parse(err.message);
        errorMessage = parsed.message || errorMessage;
      } catch {
        errorMessage = err.message || errorMessage;
      }

      console.log('[ReviewSection] errorMessage:', errorMessage);

      if (errorMessage.includes('already reviewed') || err.message?.includes('409')) {
        toast.error('Bạn đã đánh giá sản phẩm này rồi', {
          description: 'Bạn có thể chỉnh sửa đánh giá bằng nút "Sửa" bên dưới.',
          duration: 5000,
        });
        // Re-fetch reviews and directly detect the user's review
        try {
          const data = await reviewApi.getByProduct(productId);
          setReviews(data);
          // Try to find user's review — backend confirmed user has one via 409
          if (user && data.length > 0) {
            const cachedAccountId = localStorage.getItem('myAccountId');
            const match = data.find((r: Review) => {
              if (r.accountId && String(r.accountId) === String(user.id)) return true;
              if (r.accountId && cachedAccountId && String(r.accountId) === cachedAccountId) return true;
              if (r.reviewerName && (r.reviewerName === user.name || r.reviewerName === user.username || r.reviewerName === user.email)) return true;
              return false;
            });
            const existing = match || data[0]; // fallback: pick first (backend confirmed it's ours)
            // Cache accountId for future page loads
            if (existing.accountId) {
              localStorage.setItem('myAccountId', String(existing.accountId));
            }
            setMyReview(existing);
            setReviewRating(existing.rating);
            setReviewComment(existing.comment);
          }
        } catch { /* ignore */ }
      } else if (errorMessage.includes('purchased') || errorMessage.includes('NOT_PURCHASED') || err.message?.includes('403')) {
        toast.error('Bạn cần mua sản phẩm này trước khi đánh giá', {
          description: 'Chỉ khách hàng đã mua sản phẩm mới có thể viết đánh giá.',
          duration: 5000,
        });
      } else if (err.message?.includes('401')) {
        toast.error('Vui lòng đăng nhập để đánh giá', {
          description: 'Bạn cần đăng nhập để sử dụng tính năng này.',
          duration: 4000,
        });
      } else {
        toast.error('Gửi đánh giá thất bại', {
          description: errorMessage,
          duration: 4000,
        });
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#AF140B]" />
          <h3 className="text-xl font-bold text-gray-800">
            Đánh giá sản phẩm
            {reviews.length > 0 && <span className="ml-2 text-sm font-medium text-gray-500">({reviews.length})</span>}
          </h3>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)} readonly />
            <span className="text-sm font-bold text-gray-700">
              {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}/5
            </span>
          </div>
        )}
      </div>

      {/* Reviews list */}
      {reviewsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#AF140B]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{r.reviewerName || 'Ẩn danh'}</p>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <StarRating value={r.rating} readonly />
              </div>
              <p className="text-sm text-gray-700">{r.comment}</p>
              {r.managerReply && (
                <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-[#AF140B] mb-1">💬 Phản hồi từ cửa hàng:</p>
                  <p className="text-sm text-gray-700">{r.managerReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
