export interface TextStats {
  characters: number;
  words: number;
  lines: number;
  spaces: number;
  paragraphs: number;
}

export interface ProcessingResult {
  text: string;
  stats: TextStats;
  processingTime: number;
}

export class TextProcessor {
  static getStats(text: string): TextStats {
    const characters = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const lines = text === '' ? 0 : text.split('\n').length;
    const spaces = (text.match(/\s/g) || []).length;
    const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).length;

    return {
      characters,
      words,
      lines,
      spaces,
      paragraphs,
    };
  }

  static removeExtraSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  static removeEmptyLines(text: string): string {
    return text.replace(/^\s*[\r\n]/gm, '');
  }

  static toLowerCase(text: string): string {
    return text.toLowerCase();
  }

  static toUpperCase(text: string): string {
    return text.toUpperCase();
  }

  static toTitleCase(text: string): string {
    return text.replace(/\w\S*/g, (word) => {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    });
  }

  static removeSpecialCharacters(text: string, preserveSpaces: boolean = true): string {
    if (preserveSpaces) {
      return text.replace(/[^\w\s]/gi, '');
    }
    return text.replace(/[^\w]/gi, '');
  }

  static removeNumbers(text: string): string {
    return text.replace(/\d+/g, '');
  }

  static removeDuplicates(text: string): string {
    const lines = text.split('\n');
    const uniqueLines = [...new Set(lines)];
    return uniqueLines.join('\n');
  }

  static sortLines(text: string, order: 'asc' | 'desc' = 'asc'): string {
    const lines = text.split('\n');
    lines.sort((a, b) => {
      if (order === 'asc') {
        return a.localeCompare(b);
      }
      return b.localeCompare(a);
    });
    return lines.join('\n');
  }

  static reverseText(text: string): string {
    return text.split('').reverse().join('');
  }

  static process(text: string, operations: string[]): ProcessingResult {
    const startTime = performance.now();
    let processedText = text;

    operations.forEach((operation) => {
      switch (operation) {
        case 'removeExtraSpaces':
          processedText = this.removeExtraSpaces(processedText);
          break;
        case 'removeEmptyLines':
          processedText = this.removeEmptyLines(processedText);
          break;
        case 'toLowerCase':
          processedText = this.toLowerCase(processedText);
          break;
        case 'toUpperCase':
          processedText = this.toUpperCase(processedText);
          break;
        case 'toTitleCase':
          processedText = this.toTitleCase(processedText);
          break;
        case 'removeSpecialCharacters':
          processedText = this.removeSpecialCharacters(processedText);
          break;
        case 'removeNumbers':
          processedText = this.removeNumbers(processedText);
          break;
        case 'removeDuplicates':
          processedText = this.removeDuplicates(processedText);
          break;
        case 'sortLines':
          processedText = this.sortLines(processedText);
          break;
        case 'reverseText':
          processedText = this.reverseText(processedText);
          break;
        default:
          console.warn(`Unknown operation: ${operation}`);
      }
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    return {
      text: processedText,
      stats: this.getStats(processedText),
      processingTime,
    };
  }
}

// Export utility functions
export const textUtils = {
  getStats: TextProcessor.getStats,
  removeExtraSpaces: TextProcessor.removeExtraSpaces,
  removeEmptyLines: TextProcessor.removeEmptyLines,
  toLowerCase: TextProcessor.toLowerCase,
  toUpperCase: TextProcessor.toUpperCase,
  toTitleCase: TextProcessor.toTitleCase,
  removeSpecialCharacters: TextProcessor.removeSpecialCharacters,
  removeNumbers: TextProcessor.removeNumbers,
  removeDuplicates: TextProcessor.removeDuplicates,
  sortLines: TextProcessor.sortLines,
  reverseText: TextProcessor.reverseText,
  process: TextProcessor.process,
};

export type { TextStats, ProcessingResult } from '../types';