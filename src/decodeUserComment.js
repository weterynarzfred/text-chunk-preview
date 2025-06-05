import { TextDecoder } from 'util';

function decodeUserComment(exif) {
  let userComment = exif?.userComment;

  if (!(userComment instanceof Uint8Array))
    return exif;

  const prefixBytes = userComment.slice(0, 8);
  const prefix = String.fromCharCode(...prefixBytes);
  const data = userComment.slice(8);

  switch (prefix) {
    case 'ASCII\0\0\0':
      userComment = String.fromCharCode(...data).replace(/\0/g, '').trim();
    case 'UNICODE\0':
      userComment = new TextDecoder('utf-16be').decode(new Uint8Array(data)).replace(/\0/g, '').trim();
    default:
      userComment = new TextDecoder('utf-8').decode(new Uint8Array(data)).replace(/\0/g, '').trim();
  }

  console.log('changing userComment');
  delete exif.userComment;
  exif = { userComment, ...exif };
  return exif;
}

export default decodeUserComment;
