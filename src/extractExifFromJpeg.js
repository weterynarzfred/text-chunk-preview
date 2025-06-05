import * as exifr from 'exifr';
import decodeUserComment from "./decodeUserComment.js";

async function extractExifFromJpeg(imageResponse) {
  const blob = await imageResponse.blob();

  let exif;
  try {
    exif = await exifr.parse(blob, { userComment: true });
  } catch (e) { }
  if (!exif) return {};

  return decodeUserComment(exif);
}

export default extractExifFromJpeg;
