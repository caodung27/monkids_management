import { Pagination as MantinePagination } from '@mantine/core';
import { useEffect, useState } from 'react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }: PaginationProps) {
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setTotalPages(Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);

  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Show simplified pagination for few pages
  const showCompactVersion = totalPages <= 5;

  return (
    <div className="flex justify-center my-4">
      <MantinePagination 
        total={totalPages} 
        value={currentPage}
        onChange={onPageChange}
        withEdges={!showCompactVersion}
        siblings={showCompactVersion ? 1 : 1}
        boundaries={showCompactVersion ? 0 : 1}
      />
    </div>
  );
} 