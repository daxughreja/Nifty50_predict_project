import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table as TableIcon, Search, ArrowUpDown, ChevronLeft, 
  ChevronRight, Download, Filter, HelpCircle 
} from 'lucide-react';
import { apiService } from '../services/api';
import { SkeletonLoader, ErrorState, EmptyState } from '../components/LoadingStates';
import { showToast } from '../layouts/RootLayout';

export const Dataset = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  
  // Sorting States
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const fetchData = async () => {
    console.log("📍 [Dataset Page]: Executing fetchData()...");
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getStockData();
      console.log("✅ [Dataset Page]: Received dataset records count:", result?.length);
      setData(result);
    } catch (err) {
      console.error('❌ [Dataset Page]: Error fetching stock dataset:', err);
      setError('Unable to fetch dataset. Make sure your FastAPI backend is running and the new_data.csv file exists.');
    } finally {
      console.log("🏁 [Dataset Page]: Clearing loading state.");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("📍 [Dataset Page]: Component mounted.");
    fetchData();
  }, []);

  // Dynamically extract columns from the data object
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Handle Sort trigger
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to page 1 on sort
  };

  // Perform search filter and sort
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Search Filter across all values in each row
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((row) => {
        return Object.values(row).some((val) => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
        );
      });
    }

    // 2. Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        // Numeric Sort
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        
        // Date / String Sort
        return sortConfig.direction === 'asc' 
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  // Pagination slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    
    const headers = columns.join(',');
    const rows = data.map((row) => 
      columns.map((col) => {
        const val = row[col];
        return val === null || val === undefined ? '' : `"${val}"`;
      }).join(',')
    );

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers, ...rows].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'nifty50_dataset_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported entire Nifty 50 dataset to CSV.', 'success');
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 py-4">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Historical Stock Dataset</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Explorer view for Nifty 50 historical training data schema.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-blue-500/20"
        >
          <Download size={16} />
          <span>Export Dataset CSV</span>
        </button>
      </div>

      {/* Filter / Actions Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dataset (date, price, etc)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-350/50 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex items-center space-x-3.5">
          <span className="text-xs font-semibold text-slate-450 dark:text-slate-550">Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-350/50 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Dataset Table Panel */}
      {processedData.length === 0 ? (
        <EmptyState title="No Records Match Search" description="Try adjusting your date string or clear search filter." />
      ) : (
        <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-4">
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase select-none">
                  {columns.map((col) => (
                    <th 
                      key={col} 
                      onClick={() => requestSort(col)}
                      className="py-3 px-4 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{col.replace('_', ' ')}</span>
                        <ArrowUpDown size={12} className="opacity-60" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    {columns.map((col) => {
                      const val = row[col];
                      const isDate = col.toLowerCase() === 'date';
                      const isPrediction = col.toLowerCase() === 'tomorrow_close';
                      
                      let displayVal = val;
                      if (val !== null && typeof val === 'number') {
                        displayVal = col.toLowerCase() === 'volume' ? val.toLocaleString() : `₹${val.toFixed(2)}`;
                      } else if (val === null || val === undefined) {
                        displayVal = '-';
                      }

                      return (
                        <td 
                          key={col} 
                          className={`py-3.5 px-4 font-medium text-xs ${
                            isDate 
                              ? 'text-slate-900 dark:text-white font-bold' 
                              : isPrediction
                              ? 'text-emerald-500 font-bold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200/30 dark:border-slate-800/30">
            <span className="text-xs font-semibold text-slate-450 dark:text-slate-550">
              Showing {Math.min(processedData.length, (currentPage - 1) * rowsPerPage + 1)}-
              {Math.min(processedData.length, currentPage * rowsPerPage)} of{' '}
              {processedData.length.toLocaleString()} records
            </span>

            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-300 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer disabled:opacity-40 transition"
                  title="First Page"
                >
                  <ChevronLeft size={16} className="double-arrow -mr-1" />
                  {/* <ChevronLeft size={16} /> */}
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer disabled:opacity-40 transition font-bold text-xs"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <div className="px-3 text-xs font-bold text-slate-650 dark:text-slate-350">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer disabled:opacity-40 transition font-bold text-xs"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-300 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer disabled:opacity-40 transition"
                  title="Last Page"
                >
                  {/* <ChevronRight size={16} /> */}
                  <ChevronRight size={16} className="-ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
