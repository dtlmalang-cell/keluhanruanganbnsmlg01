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
  'SB07',
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

type ComplaintFormProps = {
  onSuccess: () => void;
};

export default function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time_of_issue: '',
    time_of_repair: '',
    user_name: '',
    complaint: '',
    category: '',
    room_number: '',
    issue: '',
    solution: '',
    admin_name: user?.email?.split('@')[0] || '',
    pic: '',
    status: 'late'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const calculateStatus = (timeOfIssue: string, timeOfRepair: string): string => {
    if (!timeOfIssue || !timeOfRepair) {
      return 'late';
    }

    const [issueHours, issueMinutes] = timeOfIssue.split(':').map(Number);
    const [repairHours, repairMinutes] = timeOfRepair.split(':').map(Number);

    const issueTimeInMinutes = issueHours * 60 + issueMinutes;
    const repairTimeInMinutes = repairHours * 60 + repairMinutes;

    const timeDifference = repairTimeInMinutes - issueTimeInMinutes;

    return timeDifference < 20 ? 'done' : 'late';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const calculatedStatus = calculateStatus(formData.time_of_issue, formData.time_of_repair);
    const submissionData = {
      ...formData,
      status: calculatedStatus
    };

    const { error: submitError } = await supabase
      .from('complaints')
      .insert([submissionData]);

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time_of_issue: '',
      time_of_repair: '',
      user_name: '',
      complaint: '',
      category: '',
      room_number: '',
      issue: '',
      solution: '',
      admin_name: user?.email?.split('@')[0] || '',
      pic: '',
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
        <div className="grid md:grid-cols-2 gap-4">
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
            <label htmlFor="time_of_issue" className="block text-sm font-medium text-gray-700 mb-1">
              Time of Issue
            </label>
            <input
              type="time"
              id="time_of_issue"
              value={formData.time_of_issue}
              onChange={(e) => setFormData({ ...formData, time_of_issue: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="time_of_repair" className="block text-sm font-medium text-gray-700 mb-1">
            Time of Repair
          </label>
          <input
            type="time"
            id="time_of_repair"
            value={formData.time_of_repair}
            onChange={(e) => setFormData({ ...formData, time_of_repair: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">
            Issue
          </label>
          <input
            type="text"
            id="issue"
            value={formData.issue}
            onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief issue description"
          />
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

        <div>
          <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-1">
            Solution
          </label>
          <textarea
            id="solution"
            value={formData.solution}
            onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the solution..."
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="pic" className="block text-sm font-medium text-gray-700 mb-1">
            PIC (Person In Charge)
          </label>
          <input
            type="text"
            id="pic"
            value={formData.pic}
            onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter person in charge"
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
