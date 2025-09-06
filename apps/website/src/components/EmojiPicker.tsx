import { useState } from 'react';

interface EmojiPickerProps {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_LIST = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '🙃',
  '😉',
  '😌',
  '😍',
  '🥰',
  '😘',
  '😗',
  '😙',
  '😚',
  '😋',
  '😛',
  '😝',
  '😜',
  '🤪',
  '🤨',
  '🧐',
  '🤓',
  '😎',
  '🤩',
  '🥳',
  '😏',
  '😒',
  '😞',
  '😔',
  '😟',
  '😕',
  '🙁',
  '☹️',
  '😣',
  '😖',
  '😫',
  '😩',
  '🥺',
  '😢',
  '😭',
  '😤',
  '😠',
  '😡',
  '🤬',
  '🤯',
  '😳',
  '🥵',
  '🥶',
  '😱',
  '😨',
  '😰',
  '😥',
  '😓',
  '🤗',
  '🤔',
  '🤭',
  '🤫',
  '🤥',
  '😶',
  '😐',
  '😑',
  '😬',
  '🙄',
  '😯',
  '😦',
  '😧',
  '😮',
  '😲',
  '🥱',
  '😴',
  '🤤',
  '😪',
  '😵',
  '🤐',
  '🥴',
  '🤢',
  '🤮',
  '🤧',
  '😷',
  '🤒',
  '🤕',
  '🤑',
  '🤠',
  '😈',
  '👿',
  '👹',
  '👺',
  '🤡',
  '💩',
  '👻',
  '💀',
  '☠️',
  '👽',
  '👾',
  '🤖',
  '🎃',
  '😺',
  '😸',
  '😹',
  '😻',
  '😼',
  '😽',
  '🙀',
  '😿',
  '😾',
];

export const EmojiPicker = ({
  selectedEmoji,
  onEmojiSelect,
}: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 15px',
          fontSize: '24px',
          backgroundColor: '#f8f9fa',
          border: '2px solid #dee2e6',
          borderRadius: '10px',
          cursor: 'pointer',
          minWidth: '60px',
        }}
      >
        {selectedEmoji}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '300px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '5px',
            }}
          >
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onEmojiSelect(emoji);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px',
                  fontSize: '20px',
                  backgroundColor:
                    selectedEmoji === emoji ? '#007bff' : 'transparent',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  ':hover': {
                    backgroundColor: '#f8f9fa',
                  },
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
