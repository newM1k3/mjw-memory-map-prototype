import { MapPin, Camera, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { Location } from '../types';
import PhotoStrip from './PhotoStrip';
import StoryView from './StoryView';

interface Props {
  locations: Location[];
  discoveredLens: string;
  selectedLocation: Location | null;
  stories: Record<string, string>;
  loadingIds: Set<string>;
  errorIds: Set<string>;
  errorMessages: Record<string, string>;
  onSelectLocation: (loc: Location | null) => void;
  onGenerateStory: (loc: Location) => void;
  onRetryStory: (loc: Location) => void;
}

function formatDate(date?: Date) {
  if (!date) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Sidebar({
  locations,
  discoveredLens,
  selectedLocation,
  stories,
  loadingIds,
  errorIds,
  errorMessages,
  onSelectLocation,
  onGenerateStory,
  onRetryStory,
}: Props) {
  if (selectedLocation) {
    const loc = selectedLocation;
    const placeName = [loc.name, loc.city].filter(Boolean).join(', ');
    const countryLine = loc.country;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-none p-6 border-b border-stone-800">
          <button
            onClick={() => onSelectLocation(null)}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors text-sm mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All locations
          </button>
          <h2 className="text-stone-100 text-lg font-medium leading-tight">{placeName}</h2>
          {countryLine && <p className="text-stone-500 text-sm mt-0.5">{countryLine}</p>}
          {loc.startTime && (
            <p className="text-stone-600 text-xs mt-2">
              {formatDate(loc.startTime)}
              {loc.endTime && loc.endTime.getTime() !== loc.startTime.getTime()
                ? ` – ${formatDate(loc.endTime)}`
                : ''}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b border-stone-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-stone-500" />
              <span className="text-stone-500 text-xs uppercase tracking-wider">
                {loc.photos.length} Photo{loc.photos.length !== 1 ? 's' : ''}
              </span>
            </div>
            <PhotoStrip photos={loc.photos} />
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-stone-400 text-xs uppercase tracking-wider">Story</span>
            </div>
            <StoryView
              locationId={loc.id}
              story={stories[loc.id]}
              isLoading={loadingIds.has(loc.id)}
              hasError={errorIds.has(loc.id)}
              errorMessage={errorMessages[loc.id]}
              onGenerate={() => onGenerateStory(loc)}
              onRetry={() => {
                onRetryStory(loc);
                onGenerateStory(loc);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const region = locations.length > 0
    ? (locations[0].country || locations[0].city || 'Unknown Region')
    : '';

  const sortedLocations = [...locations].sort(
    (a, b) => (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b border-stone-800">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-xs uppercase tracking-wider font-medium">Trip Lens</span>
        </div>
        <p className="text-stone-200 text-base leading-relaxed">
          Your journey{region ? ` through ${region}` : ''}
          {' '}through the lens of{' '}
          <span className="text-amber-300 font-medium">{discoveredLens}</span>
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-stone-500 text-xs">
            <MapPin className="w-3.5 h-3.5" />
            {locations.length} location{locations.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-1.5 text-stone-500 text-xs">
            <Camera className="w-3.5 h-3.5" />
            {locations.reduce((sum, l) => sum + l.photos.length, 0)} photos
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <p className="text-stone-600 text-xs uppercase tracking-wider px-3 py-2">Locations</p>
          {sortedLocations.map((loc, idx) => (
            <button
              key={loc.id}
              onClick={() => onSelectLocation(loc)}
              className="
                w-full flex items-center gap-3 p-3 rounded-xl
                hover:bg-stone-800/60 transition-all duration-150 text-left group
              "
            >
              <div className="
                w-7 h-7 rounded-full bg-stone-800 border border-stone-700
                flex items-center justify-center flex-none
                group-hover:border-amber-400/50 group-hover:bg-amber-400/10
                transition-all duration-150
              ">
                <span className="text-stone-400 text-xs group-hover:text-amber-400 transition-colors">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-stone-300 text-sm font-medium truncate group-hover:text-stone-100 transition-colors">
                  {loc.name}
                </p>
                <p className="text-stone-600 text-xs truncate">
                  {[loc.city, loc.country].filter(Boolean).join(', ')}
                  {loc.startTime ? ` · ${formatDate(loc.startTime)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-none">
                <span className="text-stone-600 text-xs">{loc.photos.length}</span>
                <Camera className="w-3 h-3 text-stone-700" />
                <ChevronRight className="w-3.5 h-3.5 text-stone-700 group-hover:text-stone-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
