function decodeUserComment(userComment) {
  if (typeof userComment === 'string') return userComment;

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

export default decodeUserComment;
