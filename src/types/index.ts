export interface HistoryItem {
  id: string;
  timestamp: string; // Simpan sebagai string
  inputPreview: string;
  outputPreview: string;
  operation: string;
  stats: {
    inputLength: number;
    outputLength: number;
    reduction: number;
  };
}

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