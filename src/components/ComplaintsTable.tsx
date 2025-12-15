import { useEffect, useState, useMemo } from 'react';
import { 
  AlertCircle, Calendar, User, MapPin, Tag, FileText, 
  UserCog, Edit2, X, Filter, RotateCcw, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { supabase, type Complaint } from '../lib/supabase';

type ComplaintsTableProps = {
  refresh: number;
};

type EditFormData = {
  time_of_issue: string;
  time_of_repair: string;
  user_name: string;
  category: string;
  room_number: string;
  issue: string;
  complaint: string;
  solution: string;
  admin_name: string;
  pic: string;
};

type FilterState = {
  date: string;
  room: string;
  category: string;
  status: string;
  user: string;
  admin: string;
  pic: string;
};

const CATEGORIES = ['AC', 'Audio', 'ATK', 'BINUSMAYA', 'Computer', 'Internet', 'LCD', 'Room', 'Software', 'TV', 'Wacom', 'Webcam', 'Etc'];
const ROOM_NUMBERS = ['SB05', 'SB07', '101', '102-103', '114', '113 A', '113 B', '201', '202-203', '205', '206', '213', '214', '215', '305', '306', '307', '308', '309', '310', '311', '313', '314', '403', '405', '406', '407', '408', '409', '410', '411', '413'];

export default function ComplaintsTable({ refresh }: ComplaintsTableProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    date: '',
    room: '',
    category: '',
    status: '',
    user: '',
    admin: '',
    pic: ''
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchComplaints();
  }, [refresh]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setComplaints(data || []);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      if (filters.date && getDateOnly(complaint.date) !== filters.date) return false;
      if (filters.room && complaint.room_number !== filters.room) return false;
      if (filters.category && complaint.category !== filters.category) return false;
      if (filters.status && complaint.status !== filters.status) return false;

      if (filters.user) {
        const userName = (complaint.user_name || '').toLowerCase();
        if (!userName.includes(filters.user.toLowerCase())) return false;
      }

      if (filters.admin) {
        const adminName = (complaint.admin_name || '').toLowerCase();
        if (!adminName.includes(filters.admin.toLowerCase())) return false;
      }

      if (filters.pic) {
        const picValue = ((complaint as any).pic || '').toLowerCase();
        if (!picValue.includes(filters.pic.toLowerCase())) return false;
      }

      return true;
    });
  }, [complaints, filters]);

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

  const handleResetFilters = () => {
    setFilters({
      date: '',
      room: '',
      category: '',
      status: '',
      user: '',
      admin: '',
      pic: ''
    });
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== '').length;
  }, [filters]);

  // Handlers for Edit
  const handleEditClick = (complaint: Complaint) => {
    setEditingId(complaint.id);
    setEditFormData({
      time_of_issue: complaint.time_of_issue || '',
      time_of_repair: complaint.time_of_repair || '',
      user_name: complaint.user_name,
      category: complaint.category,
      room_number: complaint.room_number,
      issue: complaint.issue || '',
      complaint: complaint.complaint,
      solution: complaint.solution || '',
      admin_name: complaint.admin_name,
      pic: (complaint as any).pic || ''
    });
    setEditError('');
  };

  const handleEditSubmit = async () => {
    if (!editingId || !editFormData) return;
    setEditLoading(true);
    setEditError('');

    const updateData = {
      ...editFormData,
      ...(editFormData.solution && { status: 'ontime' })
    };

    const { error: updateError } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', editingId);

    if (updateError) {
      setEditError(updateError.message);
      setEditLoading(false);
      return;
    }

    setComplaints(complaints.map(c =>
      c.id === editingId ? { ...c, ...updateData } : c
    ));
    setEditingId(null);
    setEditFormData(null);
    setEditLoading(false);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData(null);
    setEditError('');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading complaints...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error loading complaints</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Reported Issues</h2>
        <p className="text-sm text-gray-600 mt-1">
          {complaints.length} {complaints.length === 1 ? 'complaint' : 'complaints'} recorded
          {activeFilterCount > 0 && (
            <span className="ml-2 text-blue-600 font-medium">
              ({filteredComplaints.length} filtered)
            </span>
          )}
        </p>
      </div>

      {/* Filter Section */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date Filter */}
          <div>
            <label htmlFor="filter-date" className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input type="date" id="filter-date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          {/* Room Filter */}
          <div>
            <label htmlFor="filter-room" className="block text-xs font-medium text-gray-700 mb-1">Room</label>
            <select id="filter-room" value={filters.room} onChange={(e) => setFilters({ ...filters, room: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Rooms</option>
              {ROOM_NUMBERS.map((room) => (<option key={room} value={room}>{room}</option>))}
            </select>
          </div>
          {/* Category Filter */}
          <div>
            <label htmlFor="filter-category" className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select id="filter-category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
          {/* Status Filter */}
          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select id="filter-status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Status</option>
              <option value="ontime">On Time</option>
              <option value="late">Late</option>
            </select>
          </div>
          {/* Text Searches */}
          <div>
            <label htmlFor="filter-user" className="block text-xs font-medium text-gray-700 mb-1">User</label>
            <input type="text" id="filter-user" value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })} placeholder="Search user..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="filter-admin" className="block text-xs font-medium text-gray-700 mb-1">Admin</label>
            <input type="text" id="filter-admin" value={filters.admin} onChange={(e) => setFilters({ ...filters, admin: e.target.value })} placeholder="Search admin..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="filter-pic" className="block text-xs font-medium text-gray-700 mb-1">PIC</label>
            <input type="text" id="filter-pic" value={filters.pic} onChange={(e) => setFilters({ ...filters, pic: e.target.value })} placeholder="Search PIC..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>
      </div>

      {/* Table Content */}
      {complaints.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No complaints reported yet</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-300 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-2">No results match your filters</p>
          <p className="text-sm text-gray-500 mb-4">Try adjusting or clearing your filters</p>
          <button onClick={handleResetFilters} className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Repair</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solution</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(complaint.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><p className="text-sm text-gray-900">{complaint.time_of_issue || '-'}</p></td>
                    <td className="px-6 py-4 whitespace-nowrap"><p className="text-sm text-gray-900">{complaint.time_of_repair || '-'}</p></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <User className="w-4 h-4 text-gray-400" />
                        {complaint.user_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{complaint.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {complaint.room_number}
                      </div>
                    </td>
                    <td className="px-6 py-4"><p className="text-sm text-gray-900 line-clamp-2 max-w-md">{complaint.issue || '-'}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-gray-900 line-clamp-2 max-w-md">{complaint.complaint}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-gray-900 line-clamp-2 max-w-md">{complaint.solution ? complaint.solution : <span className="text-gray-400 italic">No solution added</span>}</p></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <UserCog className="w-4 h-4 text-gray-400" />
                        {complaint.admin_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><p className="text-sm text-gray-900">{(complaint as any).pic || '-'}</p></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${complaint.status === 'ontime' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {complaint.status === 'ontime' ? 'On Time' : 'Late'}
                        </span>
                        <button onClick={() => handleEditClick(complaint)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit complaint">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
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
                Showing <span className="font-medium">{Math.min(indexOfFirstItem + 1, filteredComplaints.length)}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredComplaints.length)}</span> of <span className="font-medium">{filteredComplaints.length}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-white shadow-sm transition-colors text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center px-4 text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
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
        </>
      )}

      {/* Edit Modal */}
      {editingId && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Edit Complaint</h3>
              <button onClick={handleEditCancel} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {editError && (
              <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{editError}</p>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time of Issue</label>
                  <input type="time" value={editFormData.time_of_issue} onChange={(e) => setEditFormData({ ...editFormData, time_of_issue: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time of Repair</label>
                  <input type="time" value={editFormData.time_of_repair} onChange={(e) => setEditFormData({ ...editFormData, time_of_repair: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <input type="text" value={editFormData.user_name} onChange={(e) => setEditFormData({ ...editFormData, user_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={editFormData.category} onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select a category</option>
                      {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <select value={editFormData.room_number} onChange={(e) => setEditFormData({ ...editFormData, room_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select a room</option>
                      {ROOM_NUMBERS.map((room) => (<option key={room} value={room}>{room}</option>))}
                    </select>
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                <input type="text" value={editFormData.issue} onChange={(e) => setEditFormData({ ...editFormData, issue: e.target.value })} placeholder="Brief issue description" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Details</label>
                <textarea value={editFormData.complaint} onChange={(e) => setEditFormData({ ...editFormData, complaint: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solution <span className="text-gray-500 font-normal text-xs ml-2">(Adding a solution will mark as On Time)</span></label>
                <textarea value={editFormData.solution} onChange={(e) => setEditFormData({ ...editFormData, solution: e.target.value })} placeholder="Describe the repair or solution applied..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIC (Person In Charge)</label>
                <input type="text" value={editFormData.pic} onChange={(e) => setEditFormData({ ...editFormData, pic: e.target.value })} placeholder="Enter person in charge" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={handleEditCancel} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
              <button onClick={handleEditSubmit} disabled={editLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}