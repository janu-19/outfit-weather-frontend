import { CheckCircle2 } from 'lucide-react';

export function PackingList({ items }) {
    if (!items || items.length === 0) return null;

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-slate-800">{item.item}</p>
                        <p className="text-sm text-slate-500">{item.reason}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
