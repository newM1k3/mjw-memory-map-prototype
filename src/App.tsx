import { useState } from 'react';
import { MapPin, RotateCcw, AlertTriangle } from 'lucide-react';
import PhotoDropzone from './components/PhotoDropzone';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import LoadingOverlay from './components/LoadingOverlay';
import { usePhotoProcessor } from './hooks/usePhotoProcessor';
import { useStoryGenerator } from './hooks/useStoryGenerator';
import { Location } from './types';

export default function App() {
  const {
    stage,
    progress,
    locations,
    discoveredLens,
    noGpsCount,
    error,
    processPhotos,
    reset,
  } = usePhotoProcessor();

  const { stories, loadingIds, errorIds, errorMessages, generateStory, clearStory } = useStoryGenerator();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const isProcessing = ['reading', 'classifying', 'clustering', 'geocoding'].includes(stage);
  const hasData = stage === 'done';

  function handleFiles(files: FileList | File[]) {
    processPhotos(files);
  }

  function handleReset() {
    reset();
    setSelectedLocation(null);
  }

  function handleSelectLocation(loc: Location | null) {
    setSelectedLocation(loc);
  }

  function handleRetryStory(loc: Location) {
    clearStory(loc.id);
  }

  if (stage === 'idle') {
    return <PhotoDropzone onFiles={handleFiles} />;
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-stone-950">
        <LoadingOverlay stage={stage} progress={progress} />
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-stone-200 text-lg font-light mb-2">Something went wrong</h2>
          <p className="text-stone-500 text-sm mb-6">{error}</p>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-stone-300 text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'done' && locations.length === 0) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-6 h-6 text-stone-500" />
          </div>
          <h2 className="text-stone-200 text-lg font-light mb-2">No location data found</h2>
          <p className="text-stone-500 text-sm mb-2">
            {noGpsCount > 0
              ? `We couldn't find GPS coordinates in any of your ${noGpsCount} photo${noGpsCount !== 1 ? 's' : ''}.`
              : "We couldn't find GPS coordinates in your photos."}
          </p>
          <p className="text-stone-600 text-xs mb-6">
            Try photos taken with GPS enabled on your phone or camera.
          </p>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-stone-300 text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Upload different photos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-950 flex flex-col overflow-hidden">
      <header className="flex-none h-14 border-b border-stone-800 flex items-center justify-between px-4 md:px-6 z-10">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-amber-400" />
          <span className="text-stone-200 font-light tracking-widest text-sm uppercase">Memory Map</span>
        </div>

        <div className="flex items-center gap-4">
          {noGpsCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-stone-600 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-stone-600" />
              {noGpsCount} photo{noGpsCount !== 1 ? 's' : ''} without GPS
            </div>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New trip</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          {hasData && (
            <MapView
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
            />
          )}
        </div>

        <aside className="
          w-full md:w-96 flex-none
          border-t md:border-t-0 md:border-l border-stone-800
          bg-stone-950
          overflow-hidden
          flex flex-col
          h-[45vh] md:h-full
        ">
          {hasData && (
            <Sidebar
              locations={locations}
              discoveredLens={discoveredLens}
              selectedLocation={selectedLocation}
              stories={stories}
              loadingIds={loadingIds}
              errorIds={errorIds}
              errorMessages={errorMessages}
              onSelectLocation={handleSelectLocation}
              onGenerateStory={(loc) => generateStory(loc, discoveredLens)}
              onRetryStory={handleRetryStory}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
