import { useState } from 'react';
import { ClipboardList, BarChart3, LogOut, FileText } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import ComplaintForm from './components/ComplaintForm';
import ComplaintsTable from './components/ComplaintsTable';
import Analytics from './components/Analytics';

function App() {
  const { user, loading, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'complaints' | 'analytics'>('complaints');

  const handleComplaintSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-800">Classroom Issue Tracker</h1>
                <p className="text-gray-600">Report and monitor classroom problems efficiently</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-md inline-flex">
            <button
              onClick={() => setActiveTab('complaints')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'complaints'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Complaints
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'complaints' ? (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Form laporan (kiri) */}
            <ComplaintForm onSuccess={handleComplaintSuccess} />

            {/* Informasi akun dan bantuan (kanan) */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account & Help</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-500">Logged in as</p>
                <p className="text-base font-medium text-gray-900">
                  {user?.email || 'Unknown user'}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-800 mb-2">Informasi</p>
                <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                  <li>Jangan menggunakan emoticon</li>
                  <li>
                    Jika ada kendala dan ingin menghapus data silakan hubungi{' '}
                    <a
                      href="https://wa.me/6282136146737"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      wa.me/6282136146737
                    </a>{' '}
                    (Wili)
                  </li>
                </ul>
              </div>
            </div>

            {/* Tabel keluhan */}
            <div className="lg:col-span-2">
              <ComplaintsTable refresh={refreshKey} />
            </div>
          </div>
        ) : (
          <Analytics />
        )}
      </div>
    </div>
  );
}

export default App;
