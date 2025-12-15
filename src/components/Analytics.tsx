'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart3, Download, FileText, Calendar, AlertCircle, Filter, RotateCcw, 
  ChevronDown, CheckSquare, Square, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase, type Complaint } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Recharts
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

function isClient() {
  return typeof window !== 'undefined';
}

// ---- Constants ----
const CATEGORIES = ['AC', 'Audio', 'ATK', 'BINUSMAYA', 'Computer', 'Internet', 'LCD', 'Room', 'Software', 'TV', 'Wacom', 'Webcam', 'Etc'];
const ROOM_NUMBERS = ['SB05', 'SB07', '101', '102-103', '114', '113 A', '113 B', '201', '202-203', '205', '206', '213', '214', '215', '305', '306', '307', '308', '309', '310', '311', '313', '314', '403', '405', '406', '407', '408', '409', '410', '411', '413'];

// ---- Utils ----
function safeDate(input: any): Date | null {
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}
function fmtDateShort(input: any) {
  const d = safeDate(input);
  return d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
}
function toYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function fmtAxisDay(yyyyMMdd: string) {
  const parts = yyyyMMdd.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}
const fmtTime = (t?: string | null) => {
  if (!t) return '-';
  const m = /^(\d{2}):(\d{2})/.exec(t);
  return m ? `${m[1]}:${m[2]}` : t;
};

const PIC_COLORS: Record<string, string> = {
  DTL: 'bg-indigo-100 text-indigo-800',
  IT:  'bg-emerald-100 text-emerald-800',
  LSC: 'bg-amber-100 text-amber-800',
  BM:  'bg-fuchsia-100 text-fuchsia-800',
  ME:  'bg-sky-100 text-sky-800',
};

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#14b8a6'];

export default function Analytics() {
  // State Data Utama
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rawComplaints, setRawComplaints] = useState<Complaint[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UI State
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // State Filter
  const [filters, setFilters] = useState({
    rooms: [] as string[], 
    category: '',
    status: '',
    pic: '',
    user: '',  
    admin: ''  
  });

  // Close dropdown logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(event.target as Node)) {
        setIsRoomDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 1. Fetching Data ---
  useEffect(() => {
    if (startDate && endDate) void fetchRawData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchRawData = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('complaints')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setRawComplaints((data as Complaint[]) || []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Filtering Logic ---
  const filteredComplaints = useMemo(() => {
    return rawComplaints.filter(item => {
      const checkText = (field: string | null, search: string) => 
        (field || '').toLowerCase().includes(search.toLowerCase());

      if (filters.rooms.length > 0 && !filters.rooms.includes(item.room_number)) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.pic && !checkText((item as any).pic, filters.pic)) return false;
      if (filters.user && !checkText(item.user_name, filters.user)) return false;
      if (filters.admin && !checkText(item.admin_name, filters.admin)) return false;

      return true;
    });
  }, [rawComplaints, filters]);

  // --- 3. Pagination Logic (Table Only) ---
  // Reset page ke 1 jika filter atau tanggal berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, startDate, endDate]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableData = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

  // --- 4. Stats Calculation (Uses ALL Filtered Data) ---
  const stats = useMemo(() => {
    const late = filteredComplaints.filter(c => (c as any)?.status === 'late').length;
    const ontime = filteredComplaints.filter(c => (c as any)?.status === 'ontime').length;
    const byCategory: Record<string, number> = {};
    const byRoom: Record<string, number> = {};

    filteredComplaints.forEach(c => {
      const cat = (c as any)?.category ?? 'Unknown';
      const room = (c as any)?.room_number ?? 'Unknown';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      byRoom[room] = (byRoom[room] || 0) + 1;
    });

    return { total: filteredComplaints.length, late, ontime, byCategory, byRoom };
  }, [filteredComplaints]);

  // --- 5. Chart Data (Uses ALL Filtered Data) ---
  const statusPieData = useMemo(() => [
    { name: 'Late', value: stats.late }, { name: 'On Time', value: stats.ontime },
  ].filter(d => d.value > 0), [stats.late, stats.ontime]);

  const categoryPieData = useMemo(() => 
    Object.entries(stats.byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
  [stats.byCategory]);

  const roomBarData = useMemo(() => 
    Object.entries(stats.byRoom).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 10),
  [stats.byRoom]);

  const timeSeriesData = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = safeDate(startDate);
    const end = safeDate(endDate);
    if (!start || !end) return [];
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const buckets: Record<string, number> = {};
    const keys: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = toYYYYMMDD(d);
      keys.push(key);
      buckets[key] = 0;
    }

    filteredComplaints.forEach(c => {
      const d = safeDate((c as any)?.date);
      if (!d) return;
      d.setHours(0, 0, 0, 0);
      const key = toYYYYMMDD(d);
      if (key in buckets) buckets[key] += 1;
    });

    return keys.map(k => ({ day: fmtAxisDay(k), total: buckets[k] || 0 }));
  }, [filteredComplaints, startDate, endDate]);

  // --- Handlers ---
  const handleResetFilters = () => {
    setFilters({ rooms: [], category: '', status: '', pic: '', user: '', admin: '' });
  };

  const toggleRoom = (room: string) => {
    setFilters(prev => {
      const currentRooms = prev.rooms;
      if (currentRooms.includes(room)) {
        return { ...prev, rooms: currentRooms.filter(r => r !== room) };
      } else {
        return { ...prev, rooms: [...currentRooms, room] };
      }
    });
  };

  const activeFilterCount = (filters.rooms.length > 0 ? 1 : 0) + 
    (filters.category ? 1 : 0) + (filters.status ? 1 : 0) + 
    (filters.pic ? 1 : 0) + (filters.user ? 1 : 0);

  // --- Export Functions (Export ALL filtered data, not just current page) ---
  const s = (v: unknown) => String(v ?? '').replace(/\r?\n/g, ' ').trim();
  const cleanText = (v: unknown) => String(v ?? '').normalize('NFKC').replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ').replace(/\s+/g, ' ').trim();

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Filtered Issues Report', 14, 14);
    doc.setFontSize(10);
    doc.text(`Date: ${startDate} to ${endDate}`, 14, 20);
    
    let roomText = "All Rooms";
    if (filters.rooms.length > 0) {
      roomText = filters.rooms.length > 5 ? `${filters.rooms.length} rooms selected` : filters.rooms.join(', ');
    }
    
    doc.setTextColor(100);
    doc.text(`Rooms: ${roomText} | Category: ${filters.category || 'All'} | Status: ${filters.status || 'All'}`, 14, 26);
    doc.setTextColor(0);

    const head = [['Date', 'User', 'Category', 'Room', 'Complaint', 'Admin', 'Solution', 'Status']];
    const body = filteredComplaints.map((c: any) => [
      fmtDateShort(c?.date), s(c?.user_name), s(c?.category), s(c?.room_number),
      s(c?.complaint), s(c?.admin_name), s(c?.solution ?? c?.resolution), s(c?.status),
    ]);

    autoTable(doc, {
      startY: 32,
      head, body,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 26 }, 1: { cellWidth: 36 }, 2: { cellWidth: 30 }, 3: { cellWidth: 15 },
        4: { cellWidth: 60 }, 5: { cellWidth: 20 }, 6: { cellWidth: 60 }, 7: { cellWidth: 24 },
      },
    });
    doc.save(`analytics-report-${startDate}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time Issue', 'Time Repair', 'User', 'Category', 'Room', 'Issue', 'Complaint', 'Solution', 'Admin', 'PIC', 'Status'];
    const q = (v: unknown) => `"${cleanText(v).replace(/"/g, '""')}"`;
    const rows = filteredComplaints.map((c: any) => [
      q(c?.date), q(c?.time_of_issue), q(c?.time_of_repair), q(c?.user_name),
      q(c?.category), q(c?.room_number), q(c?.issue), q(c?.complaint),
      q(c?.solution ?? c?.resolution), q(c?.admin_name), q((c as any)?.pic), q(c?.status),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${startDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Analytics & Reports</h2>
        </div>

        {/* Date Range */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* Filters */}
        {!loading && startDate && endDate && rawComplaints.length > 0 && (
          <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                   <Filter className="w-4 h-4 text-gray-600" />
                   <h3 className="text-sm font-semibold text-gray-800">Refine Results</h3>
                   {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{activeFilterCount} active</span>
                   )}
                </div>
                {activeFilterCount > 0 && (
                   <button onClick={handleResetFilters} className="text-xs flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                      <RotateCcw className="w-3 h-3" /> Reset Filters
                   </button>
                )}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Room Multi-Select */}
                <div className="relative" ref={roomDropdownRef}>
                  <button onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)} className="w-full text-left px-3 py-2 text-sm border border-gray-300 rounded-md bg-white flex items-center justify-between focus:ring-2 focus:ring-blue-500">
                    <span className="truncate block">{filters.rooms.length === 0 ? 'All Rooms' : `${filters.rooms.length} Room${filters.rooms.length > 1 ? 's' : ''} Selected`}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {isRoomDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-100 sticky top-0 bg-white flex justify-between items-center">
                         <span className="text-xs font-semibold text-gray-500">Select Rooms</span>
                         {filters.rooms.length > 0 && (<button onClick={() => setFilters({...filters, rooms: []})} className="text-xs text-red-500 hover:text-red-700">Clear</button>)}
                      </div>
                      <div className="p-1">
                        {ROOM_NUMBERS.map(room => (
                          <div key={room} onClick={() => toggleRoom(room)} className="flex items-center gap-2 px-2 py-2 hover:bg-blue-50 cursor-pointer rounded-md">
                            {filters.rooms.includes(room) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                            <span className={`text-sm ${filters.rooms.includes(room) ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{room}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <select className="text-sm border-gray-300 rounded-md shadow-sm" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                   <option value="">All Categories</option>
                   {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select className="text-sm border-gray-300 rounded-md shadow-sm" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                   <option value="">All Status</option>
                   <option value="ontime">On Time</option>
                   <option value="late">Late</option>
                </select>

                <div className="relative">
                   <input type="text" placeholder="Filter PIC or User..." className="w-full pl-2 pr-2 py-2 text-sm border border-gray-300 rounded-md" value={filters.pic || filters.user} onChange={e => setFilters({...filters, pic: e.target.value, user: e.target.value})} />
                </div>
             </div>
          </div>
        )}

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex gap-3"><AlertCircle className="w-5 h-5 text-red-600" />{error}</div>}
        {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span className="ml-3 text-gray-600">Analyzing data...</span></div>}

        {!loading && startDate && endDate && filteredComplaints.length > 0 && (
          <>
            {/* KPI & Charts (Code omitted for brevity, same as before) */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200"><p className="text-sm text-blue-600 font-medium mb-1">Total Issues</p><p className="text-3xl font-bold text-blue-900">{stats.total}</p></div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200"><p className="text-sm text-amber-600 font-medium mb-1">Late</p><p className="text-3xl font-bold text-amber-900">{stats.late}</p></div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200"><p className="text-sm text-green-600 font-medium mb-1">On Time</p><p className="text-3xl font-bold text-green-900">{stats.ontime}</p></div>
            </div>

            {isClient() && (
              <>
                 <div className="grid lg:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg border p-4">
                       <h3 className="font-semibold text-gray-800 mb-3">Status Distribution</h3>
                       <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip /><Legend verticalAlign="bottom" height={24} /><Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>{statusPieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#ef4444' : '#16a34a'} />)}</Pie></PieChart></ResponsiveContainer></div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                       <h3 className="font-semibold text-gray-800 mb-3">Issues by Category</h3>
                       <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip /><Legend verticalAlign="bottom" height={24} /><Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} paddingAngle={2}>{categoryPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                       <h3 className="font-semibold text-gray-800 mb-3">Top Affected Rooms</h3>
                       <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={roomBarData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} tick={{fontSize: 12}} /><YAxis allowDecimals={false} /><Tooltip cursor={{fill: '#f3f4f6'}} /><Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                    </div>
                 </div>
                 <div className="bg-white rounded-lg border p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Daily Issue Trend</h3>
                    <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={timeSeriesData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} /></LineChart></ResponsiveContainer></div>
                 </div>
              </>
            )}

            <div className="flex gap-4 mb-8">
              <button onClick={exportToPDF} className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"><FileText className="w-5 h-5" /> Export PDF</button>
              <button onClick={exportToCSV} className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"><Download className="w-5 h-5" /> Export CSV</button>
            </div>
          </>
        )}

        {/* Empty States */}
        {!loading && startDate && endDate && rawComplaints.length > 0 && filteredComplaints.length === 0 && (
           <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300"><Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-medium">No issues match your current filters</p><button onClick={handleResetFilters} className="mt-2 text-blue-600 hover:underline text-sm">Clear filters</button></div>
        )}
        {!loading && startDate && endDate && rawComplaints.length === 0 && (
          <div className="text-center py-12"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No data recorded in this date range</p></div>
        )}
        {(!startDate || !endDate) && (
          <div className="text-center py-12"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Please select a Start and End date to view analytics</p></div>
        )}
      </div>

      {/* DETAILED REPORT TABLE (WITH PAGINATION) */}
      {filteredComplaints.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Detailed Report</h3>
            <span className="text-sm text-gray-500">
               Showing {Math.min(indexOfFirstItem + 1, filteredComplaints.length)} - {Math.min(indexOfLastItem, filteredComplaints.length)} of {filteredComplaints.length} records
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PIC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTableData.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtDateShort(c?.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmtTime(c?.time_of_issue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c?.user_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{c?.category}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c?.room_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{c?.complaint}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`px-2 py-1 text-xs font-medium rounded-full ${PIC_COLORS[c?.pic] || 'bg-gray-100 text-gray-600'}`}>{c?.pic || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`px-2 py-1 text-xs font-medium rounded-full ${c?.status === 'ontime' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {c?.status === 'ontime' ? 'On Time' : 'Late'}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {filteredComplaints.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-white shadow-sm transition-colors text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-white shadow-sm transition-colors text-gray-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}