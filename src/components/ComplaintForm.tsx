import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  'Photo Lab',
  'Auditorium',
  'Content Lab',
  'MAC A',
  'MAC B',
  'PR Lab',
  'BDV',
  '205',
  'Incubator Lab',
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

type ComplaintFormProps = {
  onSuccess: () => void;
};

export default function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    user_name: '',
    complaint: '',
    category: '',
    room_number: '',
    admin_name: user?.email?.split('@')[0] || '',
    status: 'late'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const { error: submitError } = await supabase
      .from('complaints')    
      .insert([formData]);

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      user_name: '',
      complaint: '',
      category: '',
      room_number: '',
      admin_name: user?.email?.split('@')[0] || '',
      status: 'late'
    });

    setTimeout(() => setSuccess(false), 3000);
    onSuccess();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Report a Classroom Issue</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800 text-sm">Complaint submitted successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 mb-1">
            User
          </label>
          <input
            type="text"
            id="user_name"
            value={formData.user_name}
            onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
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
          <label htmlFor="room_number" className="block text-sm font-medium text-gray-700 mb-1">
            Room Number
          </label>
          <select
            id="room_number"
            value={formData.room_number}
            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
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
          <label htmlFor="complaint" className="block text-sm font-medium text-gray-700 mb-1">
            Complaint Details
          </label>
          <textarea
            id="complaint"
            value={formData.complaint}
            onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the problem..."
            rows={4}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
}
