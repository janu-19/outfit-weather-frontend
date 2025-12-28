import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { wardrobeAPI } from '../../api';
import { OutfitCard } from './OutfitCard';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export function OutfitCalendar({ refreshTrigger }) {
    const [date, setDate] = useState(new Date());
    const [history, setHistory] = useState(new Set()); // Stores dates as strings "YYYY-MM-DD"
    const [selectedOutfits, setSelectedOutfits] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHistory();
        fetchOutfitsForDate(date);
    }, [refreshTrigger, date]); // Reload when trigger changes or date changes

    const loadHistory = async () => {
        try {
            const allOutfits = await wardrobeAPI.getAllOutfits();
            const dates = new Set();
            allOutfits.forEach(outfit => {
                if (outfit.worn_history) {
                    outfit.worn_history.forEach(d => {
                        dates.add(new Date(d).toDateString());
                    });
                }
            });
            setHistory(dates);
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    const fetchOutfitsForDate = async (selectedDate) => {
        setLoading(true);
        try {
            const data = await wardrobeAPI.getOutfitsByDate(selectedDate);
            setSelectedOutfits(data || []);
        } catch (error) {
            console.error("Failed to fetch daily outfits", error);
        } finally {
            setLoading(false);
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            if (history.has(date.toDateString())) {
                return 'bg-blue-100 text-blue-600 font-bold rounded-full';
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in-up">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                Outfit Calendar
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Calendar View */}
                <div className="wardrobe-calendar-wrapper">
                    <Calendar
                        onChange={setDate}
                        value={date}
                        className="w-full border-none rounded-xl shadow-sm p-4 font-sans"
                        tileClassName={tileClassName}
                    />
                </div>

                {/* Daily Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-700 border-b pb-2">
                        Worn on {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : selectedOutfits.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                            {selectedOutfits.map(outfit => (
                                <div key={outfit.id} className="scale-90 origin-top-left transform transition-transform">
                                    <OutfitCard outfit={outfit} minimal={true} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-400">No outfits recorded for this day.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Styles for Calendar */}
            <style>{`
                .react-calendar { 
                    width: 100%; 
                    background: white; 
                    border: 1px solid #e2e8f0; 
                    font-family: inherit;
                }
                .react-calendar__tile {
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .react-calendar__tile--now {
                    background: #eff6ff;
                    color: #2563eb;
                }
                .react-calendar__tile--active {
                    background: #2563eb !important;
                    color: white !important;
                }
                .react-calendar__navigation button {
                    font-size: 1.1rem;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}
