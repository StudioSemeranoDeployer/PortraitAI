
export interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  message?: string;
  progress?: number;
}

export type OperationType = 'colorize' | 'animate';

export interface MediaResult {
  type: 'image' | 'video';
  url: string;
  originalUrl: string;
}
