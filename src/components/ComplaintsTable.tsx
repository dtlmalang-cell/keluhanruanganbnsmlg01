import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, User, MapPin, Tag, FileText, UserCog, Edit2, X } from 'lucide-react';
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

const CATEGORIES = [
  'Webcam',
  'Audio',
  'ATK',
  'Computer',
  'BINUSMAYA',
  'Software',
  'Wacom',
  'LCD',
  'TV',
  'Internet',
  'Room'
];

const ROOM_NUMBERS = [
  'SB05',
  'Lab Furniture',
  '101',
  '102-103',
  '114',
  '113 A',
  '113 B',
  '201',
  '202-203',
  '205',
  '206',
  '213',
  '214',
  '215',
  '304',
  '305',
  '306',
  '307',
  '308',
  '309',
  '310',
  '311',
  '313',
  '401',
  '402',
  '403',
  '404',
  '405',
  '406',
  '407',
  '408',
  '409',
  '410',
  '411',
  '413'
];

export default function ComplaintsTable({ refresh }: ComplaintsTableProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [refresh]);

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

  const handleStatusChange = async (complaintId: string, newStatus: 'late' | 'done') => {
    setUpdatingStatus(complaintId);

    const { error: updateError } = await supabase
      .from('complaints')
      .update({ status: newStatus })
      .eq('id', complaintId);

    if (updateError) {
      setError(updateError.message);
      setUpdatingStatus(null);
      return;
    }

    setComplaints(complaints.map(c =>
      c.id === complaintId ? { ...c, status: newStatus } : c
    ));
    setUpdatingStatus(null);
  };

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
      ...(editFormData.solution && { status: 'done' })
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Reported Issues</h2>
        <p className="text-sm text-gray-600 mt-1">
          {complaints.length} {complaints.length === 1 ? 'complaint' : 'complaints'} recorded
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No complaints reported yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time of Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time of Repair
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PIC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(complaint.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{complaint.time_of_issue || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{complaint.time_of_repair || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <User className="w-4 h-4 text-gray-400" />
                      {complaint.user_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {complaint.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {complaint.room_number}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                      {complaint.issue || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                      {complaint.complaint}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                      {complaint.solution ? complaint.solution : <span className="text-gray-400 italic">No solution added</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <UserCog className="w-4 h-4 text-gray-400" />
                      {complaint.admin_name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{(complaint as any).pic || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value as 'late' | 'done')}
                        disabled={updatingStatus === complaint.id}
                        className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer transition-all ${
                          complaint.status === 'done'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        } ${updatingStatus === complaint.id ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                      >
                        <option value="late">Late</option>
                        <option value="done">Done</option>
                      </select>
                      <button
                        onClick={() => handleEditClick(complaint)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit complaint"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingId && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Edit Complaint</h3>
              <button
                onClick={handleEditCancel}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time of Issue
                  </label>
                  <input
                    type="time"
                    value={editFormData.time_of_issue}
                    onChange={(e) => setEditFormData({ ...editFormData, time_of_issue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time of Repair
                  </label>
                  <input
                    type="time"
                    value={editFormData.time_of_repair}
                    onChange={(e) => setEditFormData({ ...editFormData, time_of_repair: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <input
                  type="text"
                  value={editFormData.user_name}
                  onChange={(e) => setEditFormData({ ...editFormData, user_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number
                </label>
                <select
                  value={editFormData.room_number}
                  onChange={(e) => setEditFormData({ ...editFormData, room_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a room</option>
                  {ROOM_NUMBERS.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue
                </label>
                <input
                  type="text"
                  value={editFormData.issue}
                  onChange={(e) => setEditFormData({ ...editFormData, issue: e.target.value })}
                  placeholder="Brief issue description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complaint Details
                </label>
                <textarea
                  value={editFormData.complaint}
                  onChange={(e) => setEditFormData({ ...editFormData, complaint: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solution
                  <span className="text-gray-500 font-normal text-xs ml-2">(Adding a solution will mark as Done)</span>
                </label>
                <textarea
                  value={editFormData.solution}
                  onChange={(e) => setEditFormData({ ...editFormData, solution: e.target.value })}
                  placeholder="Describe the repair or solution applied..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIC (Person In Charge)
                </label>
                <input
                  type="text"
                  value={editFormData.pic}
                  onChange={(e) => setEditFormData({ ...editFormData, pic: e.target.value })}
                  placeholder="Enter person in charge"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
