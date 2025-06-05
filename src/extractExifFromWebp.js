import * as exifr from 'exifr';
import decodeUserComment from "./decodeUserComment.js";

function extractExifChunkFromWebp(arrayBuffer) {
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

async function extractExifFromWebp(imageResponse) {
  const arrayBuffer = await imageResponse.arrayBuffer();

  let exif;
  try {
    const exifChunk = extractExifChunkFromWebp(arrayBuffer);
    exif = await exifr.parse(exifChunk, { userComment: true });
  } catch (e) { }
  if (!exif) return {};

  return decodeUserComment(exif);
}

export default extractExifFromWebp;
