import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-4 py-2 rounded-xl border-2 border-[#C9A562]/30 bg-[#6B5D3F]/20 text-[#F5F1E8] hover:border-[#C9A562] hover:bg-[#C9A562]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#C9A562]/30 disabled:hover:bg-[#6B5D3F]/20"
      >
        <ChevronLeft className="size-5" />
        <span className="hidden sm:inline">Trước</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-[#E8D5B7]">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[44px] px-4 py-2 rounded-xl font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#C9A562] to-[#E8D5B7] text-[#2A2718] shadow-lg'
                  : 'border-2 border-[#C9A562]/30 bg-[#6B5D3F]/20 text-[#F5F1E8] hover:border-[#C9A562] hover:bg-[#C9A562]/20'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-4 py-2 rounded-xl border-2 border-[#C9A562]/30 bg-[#6B5D3F]/20 text-[#F5F1E8] hover:border-[#C9A562] hover:bg-[#C9A562]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#C9A562]/30 disabled:hover:bg-[#6B5D3F]/20"
      >
        <span className="hidden sm:inline">Sau</span>
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}