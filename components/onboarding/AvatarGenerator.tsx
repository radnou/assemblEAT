'use client';

const COLORS = [
  'bg-gradient-to-br from-green-500 to-green-600',
  'bg-gradient-to-br from-purple-500 to-purple-600',
  'bg-gradient-to-br from-blue-500 to-blue-600',
  'bg-gradient-to-br from-orange-500 to-orange-600',
  'bg-gradient-to-br from-pink-500 to-pink-600',
  'bg-gradient-to-br from-teal-500 to-teal-600',
];

const FOOD_EMOJIS = ['🍎', '🥑', '🥕', '🍳', '🧑‍🍳', '🍋'];

interface AvatarGeneratorProps {
  firstName: string;
  selectedColor: number;
  selectedEmoji: number;
  onColorChange: (index: number) => void;
  onEmojiChange: (index: number) => void;
}

export function AvatarGenerator({
  firstName,
  selectedColor,
  selectedEmoji,
  onColorChange,
  onEmojiChange,
}: AvatarGeneratorProps) {
  const initial = firstName.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-20 h-20">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold text-white ${COLORS[selectedColor]}`}>
          {initial}
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg shadow-md">
          {FOOD_EMOJIS[selectedEmoji]}
        </div>
      </div>
      <div className="flex gap-2">
        {COLORS.map((color, i) => (
          <button key={i} onClick={() => onColorChange(i)}
            className={`w-8 h-8 rounded-full ${color} ${selectedColor === i ? 'ring-2 ring-offset-2 ring-green-500 scale-110' : ''} transition-all`} />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">Choisis ton compagnon food</div>
      <div className="flex gap-2">
        {FOOD_EMOJIS.map((emoji, i) => (
          <button key={i} onClick={() => onEmojiChange(i)}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ${selectedEmoji === i ? 'bg-green-50 ring-2 ring-green-500 scale-110' : 'bg-muted'} transition-all`}
            aria-label={`Compagnon : ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export { COLORS, FOOD_EMOJIS };
