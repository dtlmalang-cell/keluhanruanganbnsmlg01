'use client';
import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Download, FileText, Calendar, AlertCircle } from 'lucide-react';
import { supabase, type Complaint } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Recharts (client only check)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

function isClient() {
  return typeof window !== 'undefined';
}

// ---- utils aman ----
function safeDate(input: any): Date | null {
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}
function fmtDateShort(input: any) {
  const d = safeDate(input);
  return d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
}
function toYYYYMMDD(date: Date) {
  // gunakan zona lokal untuk stabilitas label
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

export default function Analytics() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    late: 0,
    done: 0,
    byCategory: {} as Record<string, number>,
    byRoom: {} as Record<string, number>,
  });

  useEffect(() => {
    if (startDate && endDate) void fetchFilteredData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchFilteredData = async () => {
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

      const rows = (data as Complaint[]) || [];
      setFilteredComplaints(rows);
      calculateStats(rows);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (complaints: Complaint[]) => {
    const late = complaints.filter(c => (c as any)?.status === 'late').length;
    const done = complaints.filter(c => (c as any)?.status === 'done').length;

    const byCategory: Record<string, number> = {};
    const byRoom: Record<string, number> = {};

    complaints.forEach(c => {
      const cat = (c as any)?.category ?? 'Unknown';
      const room = (c as any)?.room_number ?? 'Unknown';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      byRoom[room] = (byRoom[room] || 0) + 1;
    });

    setStats({
      total: complaints.length,
      late,
      done,
      byCategory,
      byRoom,
    });
  };

  // ---- data untuk chart ----
  const statusPieData = useMemo(
    () => [
      { name: 'late', value: stats.late },
      { name: 'Done', value: stats.done },
    ],
    [stats.late, stats.done]
  );

  const categoryPieData = useMemo(
    () =>
      Object.entries(stats.byCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    [stats.byCategory]
  );

  const roomBarData = useMemo(
    () =>
      Object.entries(stats.byRoom)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
    [stats.byRoom]
  );

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

  
  const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#14b8a6'];

  // ---- export aman ----
const exportToPDF = () => {
  // Gunakan landscape agar kolom panjang muat
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header
  doc.setFontSize(16);
  doc.text('Classroom Issues Report', 14, 14);
  doc.setFontSize(10);
  doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 20);

  // Header kolom sesuai urutan yang diminta
  const head = [['Date', 'User', 'Category', 'Room', 'Complaint', 'Admin', 'Solution', 'Status']];

  // Helper: sanitisasi string agar aman untuk PDF (hapus newline berlebih)
  const s = (v: unknown) => String(v ?? '').replace(/\r?\n/g, ' ').trim();

  // Body data sesuai urutan
  const body = filteredComplaints.map((c: any) => [
    fmtDateShort(c?.date),              // Date
    s(c?.user_name),                    // User
    s(c?.category),                     // Category
    s(c?.room_number),                  // Room
    s(c?.complaint),                    // Complaint
    s(c?.admin_name),                   // Admin
    s(c?.solution ?? c?.resolution),    // Solution (fallback ke resolution)
    s(c?.status),                       // Status
  ]);

  autoTable(doc, {
    startY: 26,
    head,
    body,
    // Gaya umum
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak', // bungkus teks panjang
    },
    headStyles: {
      fillColor: [37, 99, 235], // biru
      textColor: 255,
      halign: 'left',
    },
    // Lebar kolom (atur agar kolom panjang punya ruang)
    columnStyles: {
      0: { cellWidth: 26 },  // Date
      1: { cellWidth: 36 },  // User
      2: { cellWidth: 30 },  // Category
      3: { cellWidth: 15 },  // Room
      4: { cellWidth: 60 },  // Complaint (panjang)
      5: { cellWidth: 20 },  // Admin
      6: { cellWidth: 60 },  // Solution (panjang)
      7: { cellWidth: 24 },  // Status
    },
    // Buat header di tiap halaman
    didDrawPage: (data) => {
      doc.setFontSize(16);
      doc.text('Classroom Issues Report', 14, 14);
      doc.setFontSize(10);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 20);
      // Footer halaman
      const str = `Page ${doc.getNumberOfPages()}`;
      doc.text(str, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);
    },
  });

  doc.save(`classroom-issues-${startDate}-to-${endDate}.pdf`);
};


const exportToCSV = () => {
  // Urutan header sesuai permintaan
  const headers = ['Date', 'User', 'Category', 'Room', 'Complaint', 'Admin', 'Solution', 'Status'];

  // helper: bungkus nilai dengan tanda kutip, escape " dan hapus newline
  const q = (v: unknown) =>
    `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

  const rows = filteredComplaints.map((c: any) => [
    q(c?.date),                 // Date (yyyy-mm-dd dari DB)
    q(c?.user_name),            // User
    q(c?.category),             // Category
    q(c?.room_number),          // Room
    q(c?.complaint),            // Complaint
    q(c?.admin_name),           // Admin
    q(c?.solution ?? c?.resolution), // Solution (fallback ke resolution jika ada)
    q(c?.status),               // Status ('late' | 'done')
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `classroom-issues-${startDate}-to-${endDate}.csv`;
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

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading data...</span>
          </div>
        )}

        {!loading && startDate && endDate && filteredComplaints.length > 0 && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-1">Total Issues</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm text-amber-600 font-medium mb-1">Late</p>
                <p className="text-3xl font-bold text-amber-900">{stats.late}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-1">Done</p>
                <p className="text-3xl font-bold text-green-900">{stats.done}</p>
              </div>
            </div>

            {isClient() && (
              <>
                {/* Charts row */}
                <div className="grid lg:grid-cols-3 gap-6 mb-6">
                  {/* Pie Status */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Status Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={24} />
                          <Pie
                            data={statusPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {statusPieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Category */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Issues by Category</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={24} />
                          <Pie
                            data={categoryPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            paddingAngle={2}
                          >
                            {categoryPieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>


{/* Bar Rooms */}
<div className="bg-white rounded-lg border p-4">
  <h3 className="font-semibold text-gray-800 mb-3">Top Affected Rooms</h3>
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={roomBarData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="total" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
                </div>
                


                {/* Line Daily Trend */}
                <div className="bg-white rounded-lg border p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Daily Trend</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* Lists + Export */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Issues by Category</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{category}</span>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Top Affected Rooms</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byRoom)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([room, count]) => (
                      <div key={room} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{room}</span>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={exportToPDF}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Export to PDF
              </button>
              <button
                onClick={() => exportToCSV()}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export to CSV
              </button>
            </div>
          </>
        )}

        {!loading && startDate && endDate && filteredComplaints.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No data found for selected date range</p>
          </div>
        )}

        {(!startDate || !endDate) && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Select a date range to view analytics</p>
          </div>
        )}
      </div>

{filteredComplaints.length > 0 && (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
      <h3 className="text-xl font-bold text-gray-800">Detailed Report</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solution</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredComplaints.map((c: any) => (
            <tr key={c.id ?? `${c.date}-${c.room_number}-${c.user_name}`} className="hover:bg-gray-50">
              {/* Date */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {fmtDateShort(c?.date)}
              </td>

              {/* User */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {c?.user_name ?? ''}
              </td>

              {/* Category */}
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {c?.category ?? ''}
                </span>
              </td>

              {/* Room */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {c?.room_number ?? ''}
              </td>

              {/* Complaint */}
              <td className="px-6 py-4 text-sm text-gray-900">
                <p className="line-clamp-2 max-w-md">
                  {c?.complaint ?? ''}
                </p>
              </td>

              {/* Admin */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {c?.admin_name ?? ''}
              </td>

              {/* Solution (fallback ke resolution bila ada) */}
              <td className="px-6 py-4 text-sm text-gray-900">
                <p className="line-clamp-2 max-w-md">
                  {c?.solution ?? c?.resolution ?? ''}
                </p>
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    c?.status === 'done'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {c?.status ?? ''}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

    </div>
  );
}
