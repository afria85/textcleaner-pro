import { useEffect } from 'react';

export interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const {
          key,
          ctrlKey = false,
          shiftKey = false,
          altKey = false,
          callback,
        } = shortcut;

        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          event.ctrlKey === ctrlKey &&
          event.shiftKey === shiftKey &&
          event.altKey === altKey
        ) {
          event.preventDefault();
          callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Predefined shortcuts for text processing
export const textProcessingShortcuts = {
  process: (callback: () => void): Shortcut => ({
    key: 'Enter',
    ctrlKey: true,
    callback,
  }),
  copy: (callback: () => void): Shortcut => ({
    key: 'c',
    ctrlKey: true,
    callback,
  }),
  paste: (callback: () => void): Shortcut => ({
    key: 'v',
    ctrlKey: true,
    callback,
  }),
  clear: (callback: () => void): Shortcut => ({
    key: 'Delete',
    callback,
  }),
};