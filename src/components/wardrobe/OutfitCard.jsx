import { Trash2, Calendar, RotateCw } from 'lucide-react';
import { Button } from '../ui/Button';

export function OutfitCard({ outfit, onWear, onDelete, minimal = false }) {
    // Determine status color based on usage
    const isWornRecently = outfit.last_worn &&
        (new Date() - new Date(outfit.last_worn) < 7 * 24 * 60 * 60 * 1000);

    if (minimal) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all">
                <div className="relative aspect-square bg-slate-50">
                    <img
                        src={outfit.image_url}
                        alt={outfit.type}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="p-2">
                    <h4 className="font-medium text-slate-700 capitalize text-xs truncate">{outfit.type}</h4>
                    <p className="text-[10px] text-slate-400">Worn: {outfit.last_worn ? new Date(outfit.last_worn).toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all duration-300">
            {/* Image Container */}
            <div className="relative aspect-[3/4] bg-slate-50 overflow-hidden">
                <img
                    src={outfit.image_url}
                    alt={outfit.type}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button
                        size="sm"
                        className="bg-white text-blue-600 hover:bg-blue-50 border-none"
                        onClick={() => onWear(outfit.id)}
                    >
                        <RotateCw className="w-3 h-3 mr-1.5" />
                        Wear Today
                    </Button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(outfit.id); }}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-red-500 hover:text-white transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-slate-700 capitalize text-sm">{outfit.type}</h4>
                    {isWornRecently && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                            Active
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span>
                        {outfit.last_worn
                            ? `Last worn: ${new Date(outfit.last_worn).toLocaleDateString()}`
                            : 'Never worn'}
                    </span>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                    Worn <strong>{outfit.wear_count || 0}</strong> times
                </div>
            </div>
        </div>
    );
}
