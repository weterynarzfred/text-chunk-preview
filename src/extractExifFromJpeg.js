import EXIF from 'exif-js';

function decodeUserComment(userComment) {
  const prefixBytes = userComment.slice(0, 8);
  const prefix = String.fromCharCode(...prefixBytes);
  const data = userComment.slice(8);

  switch (prefix) {
    case 'ASCII\0\0\0':
      return String.fromCharCode(...data).replace(/\0/g, '').trim();
    case 'UNICODE\0':
      return new TextDecoder('utf-16be').decode(new Uint8Array(data)).replace(/\0/g, '').trim();
    default:
      return new TextDecoder('utf-8').decode(new Uint8Array(data)).replace(/\0/g, '').trim();
  }
}

async function extractExifFromJpeg(imgUrl) {
  const response = await fetch(imgUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  let exif = EXIF.readFromBinaryFile(arrayBuffer);

  delete exif.MakerNote;
  delete exif.thumbnail;

  if (exif.UserComment) {
    const decodedUserComment = decodeUserComment(exif.UserComment);
    delete exif.UserComment;
    exif = {
      UserComment: decodedUserComment,
      ...exif,
    };
  }

  return exif;
}

export default extractExifFromJpeg;
