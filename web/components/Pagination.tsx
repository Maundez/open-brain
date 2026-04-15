"use client";

interface PaginationProps {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalCount,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-4 text-xs">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-2 py-1 text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        prev
      </button>
      <span className="text-text-muted">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-2 py-1 text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        next
      </button>
    </div>
  );
}
