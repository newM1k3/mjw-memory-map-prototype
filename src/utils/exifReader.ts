import { GPS } from '../types';
import { dmsToDecimal } from './geoUtils';

interface RawExif {
  gps?: GPS;
  timestamp?: Date;
}

const EXIF_MARKER = 0xffe1;
const EXIF_HEADER = 0x45786966;

function readUint16(view: DataView, offset: number, le: boolean): number {
  return view.getUint16(offset, le);
}

function readUint32(view: DataView, offset: number, le: boolean): number {
  return view.getUint32(offset, le);
}

function readRational(view: DataView, offset: number, le: boolean): number {
  const num = readUint32(view, offset, le);
  const den = readUint32(view, offset + 4, le);
  return den === 0 ? 0 : num / den;
}

function readAscii(view: DataView, offset: number, count: number): string {
  let str = '';
  for (let i = 0; i < count - 1; i++) {
    const code = view.getUint8(offset + i);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}

function parseIFD(
  view: DataView,
  ifdOffset: number,
  tiffStart: number,
  le: boolean
): Record<number, unknown> {
  const tags: Record<number, unknown> = {};
  let offset = ifdOffset;
  const entryCount = readUint16(view, offset, le);
  offset += 2;

  for (let i = 0; i < entryCount; i++) {
    const tag = readUint16(view, offset, le);
    const type = readUint16(view, offset + 2, le);
    const count = readUint32(view, offset + 4, le);
    const valueOffset = offset + 8;

    let dataOffset = valueOffset;
    const byteSize = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8][type] ?? 1;
    if (byteSize * count > 4) {
      dataOffset = tiffStart + readUint32(view, valueOffset, le);
    }

    if (type === 2) {
      tags[tag] = readAscii(view, dataOffset, count);
    } else if (type === 5) {
      const rationals: number[] = [];
      for (let j = 0; j < count; j++) {
        rationals.push(readRational(view, dataOffset + j * 8, le));
      }
      tags[tag] = count === 1 ? rationals[0] : rationals;
    } else if (type === 3) {
      const vals: number[] = [];
      for (let j = 0; j < count; j++) {
        vals.push(readUint16(view, dataOffset + j * 2, le));
      }
      tags[tag] = count === 1 ? vals[0] : vals;
    } else if (type === 4) {
      const vals: number[] = [];
      for (let j = 0; j < count; j++) {
        vals.push(readUint32(view, dataOffset + j * 4, le));
      }
      tags[tag] = count === 1 ? vals[0] : vals;
    } else if (type === 1) {
      tags[tag] = view.getUint8(dataOffset);
    }

    offset += 12;
  }

  return tags;
}

function parseExifBuffer(buffer: ArrayBuffer): RawExif {
  const view = new DataView(buffer);

  if (view.getUint16(0) !== 0xffd8) return {};

  let offset = 2;
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset);
    offset += 2;

    if (marker === EXIF_MARKER) {
      offset += 2;

      if (view.getUint32(offset) !== EXIF_HEADER) break;

      const tiffStart = offset + 6;
      const byteOrder = view.getUint16(tiffStart);
      const le = byteOrder === 0x4949;

      const ifd0Offset = tiffStart + readUint32(view, tiffStart + 4, le);
      const ifd0 = parseIFD(view, ifd0Offset, tiffStart, le);

      const gpsIFDOffset = ifd0[0x8825] as number | undefined;
      let gps: GPS | undefined;
      if (gpsIFDOffset !== undefined) {
        const gpsIFD = parseIFD(view, tiffStart + gpsIFDOffset, tiffStart, le);
        const latArr = gpsIFD[0x0002] as number[] | undefined;
        const latRef = gpsIFD[0x0001] as string | undefined;
        const lngArr = gpsIFD[0x0004] as number[] | undefined;
        const lngRef = gpsIFD[0x0003] as string | undefined;

        if (latArr && lngArr && latRef && lngRef) {
          const lat = dmsToDecimal(latArr, latRef);
          const lng = dmsToDecimal(lngArr, lngRef);
          if (lat !== 0 || lng !== 0) {
            gps = { lat, lng };
          }
        }
      }

      const exifIFDOffset = ifd0[0x8769] as number | undefined;
      let timestamp: Date | undefined;
      if (exifIFDOffset !== undefined) {
        const exifIFD = parseIFD(view, tiffStart + exifIFDOffset, tiffStart, le);
        const dateStr = exifIFD[0x9003] as string | undefined;
        if (dateStr) {
          const normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
          const parsed = new Date(normalized);
          if (!isNaN(parsed.getTime())) timestamp = parsed;
        }
      }

      if (!timestamp) {
        const dateStr = ifd0[0x0132] as string | undefined;
        if (dateStr) {
          const normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
          const parsed = new Date(normalized);
          if (!isNaN(parsed.getTime())) timestamp = parsed;
        }
      }

      return { gps, timestamp };
    }

    if (marker === 0xffda) break;

    const length = view.getUint16(offset);
    offset += length;
  }

  return {};
}

export function readExif(file: File): Promise<RawExif> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target!.result as ArrayBuffer;
        const result = parseExifBuffer(buffer);
        if (!result.timestamp && file.lastModified) {
          result.timestamp = new Date(file.lastModified);
        }
        resolve(result);
      } catch {
        resolve({ timestamp: file.lastModified ? new Date(file.lastModified) : undefined });
      }
    };
    reader.onerror = () => resolve({});
    reader.readAsArrayBuffer(file);
  });
}
