import * as exifr from 'exifr';
import decodeUserComment from "./decodeUserComment";

function extractExifChunkFromWebP(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  const length = dataView.byteLength;

  for (let i = 12; i < length - 8;) {
    const chunkHeader = String.fromCharCode(
      dataView.getUint8(i),
      dataView.getUint8(i + 1),
      dataView.getUint8(i + 2),
      dataView.getUint8(i + 3)
    );

    const chunkSize = dataView.getUint32(i + 4, true); // little-endian

    if (chunkHeader === 'EXIF') {
      const exifStart = i + 8;
      const exifEnd = exifStart + chunkSize;
      const fullExif = new Uint8Array(arrayBuffer.slice(exifStart, exifEnd));

      // Strip "Exif\0\0" header (6 bytes)
      if (
        fullExif[0] === 0x45 && fullExif[1] === 0x78 &&
        fullExif[2] === 0x69 && fullExif[3] === 0x66 &&
        fullExif[4] === 0x00 && fullExif[5] === 0x00
      ) {
        return fullExif.slice(6); // just the TIFF part
      } else {
        console.warn('EXIF chunk does not start with "Exif\\0\\0"');
        return null;
      }
    }

    i += 8 + chunkSize + (chunkSize % 2); // move to next chunk
  }

  return null;
}

async function extractExifFromWebp(imgUrl) {
  const response = await fetch(imgUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  let exif;
  try {
    const exifChunk = extractExifChunkFromWebP(arrayBuffer);
    exif = await exifr.parse(exifChunk, { userComment: true });
  } catch (e) { }
  if (!exif) return {};

  if (exif?.userComment instanceof Uint8Array) {
    const decoded = decodeUserComment(exif.userComment);
    delete exif.userComment;
    exif = { UserComment: decoded, ...exif };
  }

  return exif;
}

export default extractExifFromWebp;
