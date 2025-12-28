import { useState } from 'react';
import { Upload, Loader2, Shirt, Check } from 'lucide-react';
import { wardrobeAPI } from '../../api';
import { Button } from '../ui/Button';
import { toast } from 'react-toastify';

export function OutfitUpload({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [type, setType] = useState('t-shirt');
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            // 1. Upload Image
            const uploadResult = await wardrobeAPI.uploadOutfit(file, type);

            // 2. Save Metadata
            const saved = await wardrobeAPI.saveOutfit({
                image_url: uploadResult.image_url,
                category: type,
                // Default values for robustness
                color: "Unknown",
                occasion: "Casual",
                notes: "Uploaded via Wardrobe",
                confidence: 1.0
            });

            // Show ID to confirm persistence
            toast.success(`Outfit saved to Wardrobe! (ID: ${saved.outfit?.id || saved.id || '?'})`);

            if (onUploadSuccess) onUploadSuccess();

            // Reset form on success
            setFile(null);
            setPreview(null);
            setType('t-shirt');
        } catch (err) {
            console.error("Upload/Save failed:", err);
            toast.error(err.response?.data?.detail || "Failed to save outfit to wardrobe.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                Add New Item
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Image Upload Area */}
                <div className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center h-48 cursor-pointer transition-colors relative overflow-hidden group
                    ${preview ? 'border-blue-200 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />

                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center text-slate-400">
                            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50 block" />
                            <span className="text-sm font-medium">Click to upload</span>
                        </div>
                    )}
                </div>

                {/* Form Controls */}
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                'shirt', 't-shirt', 'pants', 'jeans', 'dress',
                                'jacket', 'shoes', 'shorts', 'skirt', 'sweater',
                                'hoodie', 'coat', 'blazer', 'traditional', 'accessories'
                            ].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setType(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize
                                        ${type === cat
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full md:w-auto"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirm Upload
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
