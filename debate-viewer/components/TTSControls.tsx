"use client";

interface TTSControlsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  available: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  queueLength: number;
  isSpeaking: boolean;
  onSkip: () => void;
}

export default function TTSControls({
  enabled,
  onEnabledChange,
  available,
  volume,
  onVolumeChange,
  queueLength,
  isSpeaking,
  onSkip,
}: TTSControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onEnabledChange(!enabled)}
        disabled={!available}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          !available
            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
            : enabled
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
        }`}
        title={
          !available
            ? "VOICEVOX未接続 (localhost:50021)"
            : enabled
              ? "音声OFF"
              : "音声ON"
        }
      >
        {enabled ? "\u{1F50A}" : "\u{1F507}"}
      </button>

      {enabled && (
        <>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 accent-blue-500"
          />

          {queueLength > 0 && (
            <span className="text-xs text-gray-400">
              {queueLength}件待ち
            </span>
          )}

          {isSpeaking && (
            <button
              onClick={onSkip}
              className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              title="スキップ"
            >
              {"\u23ED"}
            </button>
          )}
        </>
      )}

      {!enabled && !available && (
        <span className="text-xs text-gray-600">VOICEVOX未接続</span>
      )}
    </div>
  );
}
