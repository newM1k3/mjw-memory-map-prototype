import { useState, useRef } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import { Photo, Location, ProcessingStage } from '../types';
import { readExif } from '../utils/exifReader';
import { haversineDistance, centroid } from '../utils/geoUtils';
import { discoverLens } from '../utils/lensMapping';

const CLUSTER_RADIUS_METERS = 500;

async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; city?: string; country?: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    const addr = data.address || {};
    const name =
      addr.tourism || addr.historic || addr.amenity ||
      addr.leisure || addr.natural || addr.suburb ||
      addr.neighbourhood || addr.village || addr.town ||
      addr.city || addr.county || 'Unknown Location';
    const city = addr.city || addr.town || addr.village || addr.county;
    const country = addr.country;
    return { name, city, country };
  } catch {
    return { name: 'Unknown Location' };
  }
}

export function usePhotoProcessor() {
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [discoveredLens, setDiscoveredLens] = useState<string>('Exploration');
  const [noGpsCount, setNoGpsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<mobilenet.MobileNet | null>(null);

  async function getModel(): Promise<mobilenet.MobileNet> {
    if (!modelRef.current) {
      await tf.ready();
      modelRef.current = await mobilenet.load({ version: 1, alpha: 0.25 });
    }
    return modelRef.current;
  }

  async function classifyImage(file: File): Promise<string[]> {
    try {
      const model = await getModel();
      const objectUrl = URL.createObjectURL(file);
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
          try {
            const preds = await model.classify(img);
            URL.revokeObjectURL(objectUrl);
            const tags = preds.flatMap((p) =>
              p.className.toLowerCase().split(',').map((s) => s.trim())
            );
            resolve(tags);
          } catch {
            URL.revokeObjectURL(objectUrl);
            resolve([]);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve([]);
        };
        img.src = objectUrl;
      });
    } catch {
      return [];
    }
  }

  async function processPhotos(files: FileList | File[]) {
    try {
      setError(null);
      setStage('reading');
      setProgress(0);

      const fileArray = Array.from(files);
      const processed: Photo[] = [];
      let withoutGps = 0;

      setStage('classifying');

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const url = URL.createObjectURL(file);

        const [exif, tags] = await Promise.all([
          readExif(file),
          classifyImage(file),
        ]);

        if (!exif.gps) withoutGps++;

        processed.push({
          id: `photo-${i}-${Date.now()}`,
          file,
          url,
          gps: exif.gps,
          timestamp: exif.timestamp,
          tags,
        });

        setProgress(Math.round(((i + 1) / fileArray.length) * 70));
      }

      setPhotos(processed);
      setNoGpsCount(withoutGps);

      const allTags = processed.flatMap((p) => p.tags);
      const lens = discoverLens(allTags);
      setDiscoveredLens(lens);

      setStage('clustering');
      const gpsPhotos = processed.filter((p) => p.gps);

      if (gpsPhotos.length === 0) {
        setLocations([]);
        setStage('done');
        setProgress(100);
        return;
      }

      const sorted = [...gpsPhotos].sort(
        (a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0)
      );

      const clusters: Photo[][] = [];
      const assigned = new Set<string>();

      for (const photo of sorted) {
        if (assigned.has(photo.id)) continue;
        const cluster: Photo[] = [photo];
        assigned.add(photo.id);

        for (const other of sorted) {
          if (assigned.has(other.id)) continue;
          const dist = haversineDistance(
            photo.gps!.lat, photo.gps!.lng,
            other.gps!.lat, other.gps!.lng
          );
          if (dist <= CLUSTER_RADIUS_METERS) {
            cluster.push(other);
            assigned.add(other.id);
          }
        }
        clusters.push(cluster);
      }

      setStage('geocoding');

      const rawLocations: Location[] = clusters.map((cluster, idx) => {
        const coords = cluster.map((p) => p.gps!);
        const center = centroid(coords);
        const times = cluster
          .map((p) => p.timestamp?.getTime())
          .filter(Boolean) as number[];
        return {
          id: `loc-${idx}`,
          lat: center.lat,
          lng: center.lng,
          name: 'Loading...',
          photos: cluster,
          startTime: times.length ? new Date(Math.min(...times)) : undefined,
          endTime: times.length ? new Date(Math.max(...times)) : undefined,
        };
      });

      const geocodedLocations = await Promise.all(
        rawLocations.map(async (loc, i) => {
          const geo = await reverseGeocode(loc.lat, loc.lng);
          setProgress(70 + Math.round(((i + 1) / rawLocations.length) * 30));
          return { ...loc, ...geo };
        })
      );

      setLocations(geocodedLocations);
      setStage('done');
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('Failed to process photos. Please try again.');
      setStage('error');
    }
  }

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setLocations([]);
    setDiscoveredLens('Exploration');
    setNoGpsCount(0);
    setStage('idle');
    setProgress(0);
    setError(null);
  }

  return {
    stage,
    progress,
    photos,
    locations,
    discoveredLens,
    noGpsCount,
    error,
    processPhotos,
    reset,
  };
}
