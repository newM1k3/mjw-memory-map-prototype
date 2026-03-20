import { ProcessingStage } from '../types';

interface Props {
  stage: ProcessingStage;
  progress: number;
}

const STAGE_MESSAGES: Record<string, string> = {
  reading: 'Reading photo metadata...',
  classifying: 'Classifying images with AI...',
  clustering: 'Discovering locations...',
  geocoding: 'Identifying places...',
};

export default function LoadingOverlay({ stage, progress }: Props) {
  const message = STAGE_MESSAGES[stage] || 'Processing...';

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="text-center max-w-sm px-8">
        <div className="w-16 h-16 rounded-full border-2 border-stone-800 border-t-amber-400 animate-spin mx-auto mb-8" />

        <p className="text-stone-300 text-base font-light mb-2">{message}</p>
        <p className="text-stone-600 text-sm mb-8">This may take a moment for large batches</p>

        <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-stone-600 text-xs mt-2 tabular-nums">{progress}%</p>
      </div>
    </div>
  );
}
