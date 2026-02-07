import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, wardrobeAPI } from '../../api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.login(email, password);

            // Check for pending guest outfit
            const pendingOutfit = localStorage.getItem('pendingOutfit');
            if (pendingOutfit) {
                try {
                    const outfitData = JSON.parse(pendingOutfit);
                    await wardrobeAPI.saveOutfit(outfitData);
                    localStorage.removeItem('pendingOutfit');
                    toast.success("Welcome back! Saved your outfit to wardrobe. 🧥");
                } catch (saveErr) {
                    console.error("Failed to save pending outfit", saveErr);
                    toast.success("Welcome back! (Couldn't save pending outfit)");
                }
            } else {
                toast.success("Welcome back! 👋");
            }

            navigate('/wardrobe');
        } catch (error) {
            console.error("Login failed", error);
            const msg = error.response?.data?.detail || "Login failed. Check your connection or credentials.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in-up">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Sign In</h1>
                    <p className="mt-2 text-slate-600">Access your digital wardrobe</p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
                            Sign up
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
