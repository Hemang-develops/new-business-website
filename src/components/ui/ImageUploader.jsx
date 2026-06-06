import { useEffect, useState } from "react";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

export default function ImageUploader({ onPick, disabled = false, maxSize = DEFAULT_MAX_BYTES, label = "Attach image" }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > maxSize) {
      if (onPick) onPick(null, new Error("Image is too large (max 5 MB)"));
      setFile(null);
      return;
    }
    setFile(f);
    if (onPick) onPick(f);
  };

  const clear = (e) => {
    e?.preventDefault();
    setFile(null);
    setPreviewUrl(null);
    if (onPick) onPick(null);
  };

  return (
    <div className="flex items-center gap-3">
      {previewUrl ? (
        <div className="flex items-center gap-3">
          <img src={previewUrl} alt="preview" className="h-12 w-12 rounded-md object-cover" />
          <button onClick={clear} className="text-sm text-teal-300">Remove</button>
        </div>
      ) : (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
          <input type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={disabled} />
          {label}
        </label>
      )}
    </div>
  );
}
