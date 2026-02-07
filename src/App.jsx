import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HomePage } from './components/HomePage';
import { WardrobePage } from './components/wardrobe/WardrobePage';
import { PredictPage } from './components/PredictPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NavBar } from './components/NavBar';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 font-sans relative">
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Decorative Background Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none fixed" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none fixed" />

        <div className="relative z-10 pb-24"> {/* Added padding for floating navbar */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/predict" element={<PredictPage />} />
            <Route path="/wardrobe" element={
              <ProtectedRoute>
                <WardrobePage />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </div>

        <NavBar />

        {/* Footer in Background */}
        <footer className="fixed bottom-2 w-full text-center text-slate-300 text-xs pointer-events-none z-0">
          <p>Powered by AI • Weather data from OpenWeather</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
