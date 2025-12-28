import { useState, useEffect } from 'react';
import { wardrobeAPI } from '../../api';
import { Loader2, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import { OutfitUpload } from './OutfitUpload';
import { OutfitCard } from './OutfitCard';
import { OutfitCalendar } from './OutfitCalendar';
import { Card } from '../ui/Card';
import { toast } from 'react-toastify';

export function WardrobePage() {
    const [loading, setLoading] = useState(true);
    const [outfits, setOutfits] = useState([]);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadWardrobe();
        loadStats();
    }, []);

    const loadWardrobe = async () => {
        setLoading(true);
        try {
            const data = await wardrobeAPI.getAllOutfits();
            console.log("Fetched wardrobe:", data); // Debug log
            if (Array.isArray(data)) {
                setOutfits(data);
            } else if (data && data.outfits && Array.isArray(data.outfits)) {
                setOutfits(data.outfits);
            } else {
                setOutfits([]);
                console.warn("Unexpected wardrobe data format:", data);
            }
        } catch (error) {
            console.error("Failed to load wardrobe", error);
            alert("Could not load wardrobe items. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await wardrobeAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load stats", error);
        }
    };

    const handleWear = async (id) => {
        try {
            await wardrobeAPI.wearOutfit(id);
            loadWardrobe();
            loadStats();
        } catch (error) {
            console.error("Failed to mark as worn", error);
        }
    };

    const handleDelete = async (id) => {
        // if (!confirm('Are you sure you want to delete this outfit?')) return; // Removed as requested
        try {
            await wardrobeAPI.deleteOutfit(id);
            setOutfits(prev => prev.filter(item => item.id !== id));
            loadStats();
            toast.success("Item deleted from wardrobe.");
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error("Could not delete item.");
        }
    };


    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-fade-in-up">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">My Wardrobe</h1>
                        <p className="text-slate-500">Manage and track your digital closet</p>
                    </div>
                    <button
                        onClick={() => { loadWardrobe(); loadStats(); }}
                        className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                        title="Reload Wardrobe"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {stats && (
                    <div className="flex gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between min-w-[200px] transition-transform hover:scale-105 duration-300">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Items</p>
                                <p className="text-3xl font-extrabold text-slate-800">{stats.total_items || outfits.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                                <Sparkles className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <div className="space-y-8">
                {/* Upload Section - Full Width */}
                <OutfitUpload onUploadSuccess={() => { loadWardrobe(); loadStats(); }} />



                {/* Gallery Section */}
                <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center justify-between">
                        <span>My Collection</span>
                        <span className="text-sm font-normal text-slate-500">{outfits.length} items</span>
                    </h3>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        </div>
                    ) : outfits.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {outfits.map(outfit => (
                                <OutfitCard
                                    key={outfit.id}
                                    outfit={outfit}
                                    onWear={handleWear}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 text-lg">Your wardrobe is empty.</p>
                            <p className="text-slate-400 text-sm mt-2 mb-6">Use the form above to add your first item!</p>
                        </div>
                    )}
                </div>
            </div>

            <OutfitCalendar refreshTrigger={outfits} />
        </div>
    );
}
