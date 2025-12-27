import { Card } from './ui/Card';
import { AccessoriesGrid } from './AccessoriesGrid';
import { PackingList } from './PackingList';
import { Check, X, Thermometer, CloudRain, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

export function ResultSection({ data, onReset }) {
    if (!data) return null;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Analysis Result</h2>
                <Button variant="ghost" onClick={onReset} className="text-sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Analyze New
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Verdict Card */}
                <Card className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            {data.outfitType && (
                                <p className="text-sm font-semibold text-blue-600 mb-1 uppercase tracking-wide">
                                    Detected: {data.outfitType}
                                </p>
                            )}
                            <h3 className="text-lg font-medium text-slate-500">Verdict</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-3xl font-bold ${data.verdictColor === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                                    {data.verdict}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Confidence</p>
                            <span className={`text-lg font-bold px-3 py-1 rounded-full bg-${data.confidenceColor}-100 text-${data.confidenceColor}-700 whitespace-nowrap`}>
                                {data.confidenceLabel}
                            </span>
                        </div>
                    </div>

                    {/* Reasons (Explainability) */}
                    {data.reasons && data.reasons.length > 0 && (
                        <div className="space-y-1">
                            {data.reasons.map((reason, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-slate-600">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium">{reason}</span>
                                </div>
                            ))}
                        </div>
                    )}



                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3">
                            <Thermometer className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-slate-500">Temp</p>
                                <p className="font-bold text-slate-800">{data.weather.temp}°C</p>
                            </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl flex items-center gap-3">
                            <CloudRain className="w-8 h-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Weather Context</p>
                                <div className="space-y-0.5">
                                    {data.weather.breakdown.map((item, idx) => (
                                        <p key={idx} className="text-xs font-semibold text-slate-700">{item}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fabric Awareness Card */}
                    {data.fabricTips && (
                        <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl">
                            <h4 className="font-semibold text-amber-900 mb-2">{data.fabricTips.title}</h4>
                            <p className="text-amber-800 text-sm leading-relaxed">
                                {data.fabricTips.tip}
                            </p>
                        </div>
                    )}

                    {/* Suggested Alternatives */}
                    {data.suggestions && data.suggestions.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                            <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Alternative Options</h4>
                            <div className="flex flex-wrap gap-2">
                                {data.suggestions.map((item, idx) => (
                                    <span key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 shadow-sm">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Packing List / Accessories Column */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="font-semibold text-slate-800 mb-4">You might need</h3>
                        <AccessoriesGrid items={data.accessories} />
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-slate-800 mb-4">Travel Essentials</h3>
                        <PackingList items={data.packingList} />
                    </Card>
                </div>
            </div >
        </div >
    );
}
