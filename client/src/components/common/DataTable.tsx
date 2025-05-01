import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => any);
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    pageSize: number;
    pageIndex: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

export default function DataTable<T>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = "No data available",
  pagination,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter data based on search term if provided
  const filteredData = searchTerm.trim() === "" 
    ? data 
    : data.filter(item => 
        columns.some(column => {
          const value = typeof column.accessorKey === 'function' 
            ? column.accessorKey(item) 
            : item[column.accessorKey];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
      
  // Handle getting cell value
  const getCellValue = (item: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell(item);
    }
    
    if (typeof column.accessorKey === 'function') {
      return column.accessorKey(item);
    }
    
    return item[column.accessorKey];
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Render table with data
  return (
    <div className="w-full">
      {/* Search and page size controls */}
      {(pagination || searchTerm !== undefined) && (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          
          {pagination && (
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={value => pagination.onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder={`${pagination.pageSize} per page`} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={cn(onRowClick ? "cursor-pointer hover:bg-slate-50" : "")}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {getCellValue(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination controls */}
      {pagination && pagination.pageCount > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-slate-500">
            Page {pagination.pageIndex + 1} of {pagination.pageCount}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(0)}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex === pagination.pageCount - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageCount - 1)}
              disabled={pagination.pageIndex === pagination.pageCount - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
