import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shirt, Home, LogOut, LogIn, Sparkles } from 'lucide-react';
import { authAPI } from '../api';
import { toast } from 'react-toastify';

export function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const isLoggedIn = !!authAPI.getToken();

    const handleLogout = () => {
        authAPI.logout();
        toast.info("Logged out successfully");
        navigate('/login');
    };

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-white/40 shadow-xl rounded-full px-6 py-3 flex items-center gap-8 z-50">
            <Link
                to="/"
                className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Home className="w-6 h-6" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Home</span>
            </Link>

            <div className="w-px h-8 bg-slate-200" />

            <Link
                to="/predict"
                className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/predict' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Sparkles className="w-6 h-6" />
                <span className="text-[10px] font-medium uppercase tracking-wider">AI Assist</span>
            </Link>

            <div className="w-px h-8 bg-slate-200" />

            <Link
                to="/wardrobe"
                className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/wardrobe' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Shirt className="w-6 h-6" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Wardrobe</span>
            </Link>

            <div className="w-px h-8 bg-slate-200" />

            {isLoggedIn ? (
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 transition-colors text-slate-400 hover:text-red-500"
                >
                    <LogOut className="w-6 h-6" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Log Out</span>
                </button>
            ) : (
                <Link
                    to="/login"
                    className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/login' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <LogIn className="w-6 h-6" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Sign In</span>
                </Link>
            )}
        </nav>
    );
}
