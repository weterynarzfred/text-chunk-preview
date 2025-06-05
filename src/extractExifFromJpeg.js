import * as exifr from 'exifr';
import decodeUserComment from "./decodeUserComment";

async function extractExifFromJpeg(imgUrl) {
  const response = await fetch(imgUrl);
  const blob = await response.blob();

  let exif;
  try {
    exif = await exifr.parse(blob, { userComment: true });
  } catch (e) { }
  if (!exif) return {};

  if (exif?.userComment instanceof Uint8Array) {
    const decoded = decodeUserComment(exif.userComment);
    delete exif.userComment;
    exif = { UserComment: decoded, ...exif };
  }

  return exif;
}

export default extractExifFromJpeg;
