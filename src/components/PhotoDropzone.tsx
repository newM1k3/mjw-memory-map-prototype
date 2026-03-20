import { useCallback, useRef, useState } from 'react';
import { Upload, MapPin, Camera, Sparkles } from 'lucide-react';

interface Props {
  onFiles: (files: FileList | File[]) => void;
}

export default function PhotoDropzone({ onFiles }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    },
    [onFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(e.target.files);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <MapPin className="w-7 h-7 text-amber-400" />
          <h1 className="text-3xl font-light tracking-widest text-stone-100 uppercase">
            Memory Map
          </h1>
        </div>
        <p className="text-stone-400 text-sm tracking-wider uppercase">
          Discover the hidden story of your journey
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative w-full max-w-2xl rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-300 p-16 text-center group
          ${isDragging
            ? 'border-amber-400 bg-amber-400/5 scale-[1.01]'
            : 'border-stone-700 hover:border-stone-500 bg-stone-900/50 hover:bg-stone-900'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        <div className={`flex flex-col items-center gap-6 transition-transform duration-300 ${isDragging ? 'scale-105' : ''}`}>
          <div className={`
            w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-300
            ${isDragging ? 'bg-amber-400/20' : 'bg-stone-800 group-hover:bg-stone-700'}
          `}>
            <Upload className={`w-9 h-9 transition-colors duration-300 ${isDragging ? 'text-amber-400' : 'text-stone-400 group-hover:text-stone-300'}`} />
          </div>

          <div>
            <p className="text-stone-200 text-xl font-light mb-2">
              Drop your vacation photos here
            </p>
            <p className="text-stone-500 text-sm">
              or click to browse your files
            </p>
          </div>

          <div className="w-full max-w-xs h-px bg-stone-800" />

          <p className="text-stone-600 text-xs leading-relaxed max-w-sm">
            Photos are processed entirely in your browser. Nothing is ever uploaded to a server.
          </p>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl w-full">
        {[
          {
            icon: Camera,
            title: 'Upload Photos',
            desc: 'Drop any batch of vacation photos, with or without GPS data',
          },
          {
            icon: MapPin,
            title: 'Plot Your Journey',
            desc: 'Watch your adventure come to life on an interactive map',
          },
          {
            icon: Sparkles,
            title: 'Discover Stories',
            desc: 'AI reveals the hidden narrative and unique lens of your trip',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center">
            <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto mb-3">
              <Icon className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-stone-300 text-sm font-medium mb-1">{title}</h3>
            <p className="text-stone-600 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
