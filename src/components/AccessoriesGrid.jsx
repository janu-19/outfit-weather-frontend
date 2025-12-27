import { Glasses, Watch, Footprints, Briefcase, Umbrella, Sun, Shirt } from 'lucide-react';

const ICON_MAP = {
    'Glasses': Glasses,
    'Sunglasses': Glasses,
    'Watch': Watch,
    'Smart Watch': Watch,
    'Footprints': Footprints,
    'Shoes': Footprints,
    'Boots': Footprints,
    'Bag': Briefcase,
    'Handbag': Briefcase,
    'Umbrella': Umbrella,
    'Sun': Sun,
    'Scarf': Shirt // Fallback
};

export function AccessoriesGrid({ items }) {
    if (!items || items.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-3">
            {items.map((item, index) => {
                const Icon = ICON_MAP[item.icon] || ICON_MAP[item.name] || Shirt;
                return (
                    <div
                        key={index}
                        className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-default min-w-0 max-w-full"
                        title={item.name}
                    >
                        <div className="p-1.5 bg-blue-50 rounded-md flex-shrink-0 text-blue-600">
                            <Icon className="w-4 h-4" />
                        </div>
                        <span className="truncate">{item.name}</span>
                    </div>
                );
            })}
        </div>
    );
}
