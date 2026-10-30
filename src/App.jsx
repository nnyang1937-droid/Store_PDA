import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import Toaster from './components/Toaster';
import { isSupabaseConfigured } from './lib/supabase';
import AddProductPage from './pages/AddProductPage';
import CategoriesPage from './pages/CategoriesPage';
import EditProductPage from './pages/EditProductPage';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import SetupPage from './pages/SetupPage';
import { useAppStore } from './store/useAppStore';

const Router =
  import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;

function ProtectedRoute({ children }) {
  const storeKey = useAppStore((state) => state.currentStoreKey);
  return storeKey ? children : <Navigate to="/" replace />;
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupPage />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/main"
            element={
              <ProtectedRoute>
                <MainPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/main/add"
            element={
              <ProtectedRoute>
                <AddProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/main/edit/:id"
            element={
              <ProtectedRoute>
                <EditProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/main/category"
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
