import { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import type { AttemptMedia } from '../types';

export const AudioRangePlayer = ({
  audio,
  autoPlay = false,
  hiddenControls = false,
  onEnded,
}: {
  audio: AttemptMedia;
  autoPlay?: boolean;
  hiddenControls?: boolean;
  onEnded?: () => void;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasEndedRef = useRef(false);
  const startSeconds = (audio.startMs ?? 0) / 1000;
  const endSeconds = audio.endMs ? audio.endMs / 1000 : null;

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    hasEndedRef.current = false;

    const handleLoadedMetadata = () => {
      if (startSeconds > 0 && Number.isFinite(startSeconds)) {
        element.currentTime = startSeconds;
      }
    };

    const handleTimeUpdate = () => {
      if (endSeconds !== null && element.currentTime >= endSeconds) {
        if (!hasEndedRef.current) {
          hasEndedRef.current = true;
          onEnded?.();
        }
        element.pause();
        element.currentTime = startSeconds;
      }
    };

    const handleEnded = () => {
      if (!hasEndedRef.current) {
        hasEndedRef.current = true;
        onEnded?.();
      }
    };

    element.addEventListener('loadedmetadata', handleLoadedMetadata);
    element.addEventListener('timeupdate', handleTimeUpdate);
    element.addEventListener('ended', handleEnded);

    return () => {
      element.removeEventListener('loadedmetadata', handleLoadedMetadata);
      element.removeEventListener('timeupdate', handleTimeUpdate);
      element.removeEventListener('ended', handleEnded);
    };
  }, [audio.id, endSeconds, onEnded, startSeconds]);

  const handleRewind = (seconds: number) => {
    if (audioRef.current) {
      let newTime = audioRef.current.currentTime - seconds;
      if (newTime < startSeconds) newTime = startSeconds;
      audioRef.current.currentTime = newTime;
    }
  };

  if (!audio.url) return null;

  if (hiddenControls) {
    return <audio ref={audioRef} autoPlay={autoPlay} preload="metadata" className="hidden" src={audio.url} />;
  }

  return (
    <div className="rounded-xl border border-[#d8dced] bg-[#f9fafb] p-2 px-3">
      <audio ref={audioRef} autoPlay={autoPlay} preload="metadata" controls className="w-full" src={audio.url} />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleRewind(1)}
          className="flex h-8 items-center gap-1.5 rounded-md border border-[#d8dced] bg-white px-3 text-xs font-bold text-[#344054] shadow-sm transition hover:bg-gray-50 hover:text-[#004ac6]"
          title="Lùi 1 giây"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          1s
        </button>
        <button
          type="button"
          onClick={() => handleRewind(3)}
          className="flex h-8 items-center gap-1.5 rounded-md border border-[#d8dced] bg-white px-3 text-xs font-bold text-[#344054] shadow-sm transition hover:bg-gray-50 hover:text-[#004ac6]"
          title="Lùi 3 giây"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          3s
        </button>
      </div>
    </div>
  );
};
