export interface GPS {
  lat: number;
  lng: number;
}

export interface Photo {
  id: string;
  file: File;
  url: string;
  gps?: GPS;
  timestamp?: Date;
  tags: string[];
}

export interface Location {
  id: string;
  lat: number;
  lng: number;
  name: string;
  city?: string;
  country?: string;
  photos: Photo[];
  startTime?: Date;
  endTime?: Date;
}

export interface TripSummary {
  discoveredLens: string;
  region: string;
  totalPhotos: number;
  noGpsCount: number;
}

export type ProcessingStage =
  | 'idle'
  | 'reading'
  | 'classifying'
  | 'clustering'
  | 'geocoding'
  | 'done'
  | 'error';
