import { BookOpen, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  locationId: string;
  story?: string;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  onGenerate: () => void;
  onRetry: () => void;
}

export default function StoryView({ story, isLoading, hasError, errorMessage, onGenerate, onRetry }: Props) {
  if (isLoading) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-5 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
          <span className="text-stone-400 text-sm animate-pulse">
            Discovering the story of this place...
          </span>
        </div>
        <div className="space-y-3">
          {[100, 90, 95, 80, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 bg-stone-800 rounded animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
          <div className="pt-2 space-y-3">
            {[85, 92, 75, 88].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-stone-800 rounded animate-pulse"
                style={{ width: `${w}%`, animationDelay: `${(i + 5) * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="py-4">
        <div className="flex items-start gap-3 p-4 bg-red-950/30 border border-red-900/40 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-none mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-medium mb-1">Story generation failed</p>
            <p className="text-stone-500 text-xs mb-3 font-mono break-words">
              {errorMessage || 'Story generation failed. Check the function logs for details.'}
            </p>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (story) {
    return (
      <div className="py-4">
        <div className="prose prose-invert prose-sm max-w-none">
          {story.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i} className="text-stone-300 text-sm leading-relaxed mb-4 last:mb-0">
              {para.trim()}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <button
        onClick={onGenerate}
        className="
          w-full flex items-center justify-center gap-3 py-4 px-6
          bg-amber-400/10 hover:bg-amber-400/20
          border border-amber-400/30 hover:border-amber-400/50
          rounded-xl transition-all duration-200
          text-amber-300 hover:text-amber-200
          group
        "
      >
        <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">Generate Story</span>
      </button>
      <p className="text-stone-600 text-xs text-center mt-2">
        Powered by Google Gemini
      </p>
    </div>
  );
}
