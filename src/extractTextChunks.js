import pako from 'pako';

async function extractTextChunks(imgUrl) {
  const response = await fetch(imgUrl);
  const arrayBuffer = await response.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  let position = 8; // Skip PNG signature
  const textChunks = {};

  while (position < dataView.byteLength) {
    const length = dataView.getUint32(position);
    const type = String.fromCharCode(
      dataView.getUint8(position + 4),
      dataView.getUint8(position + 5),
      dataView.getUint8(position + 6),
      dataView.getUint8(position + 7)
    );

    if (type === 'tEXt') {
      const chunkData = new Uint8Array(arrayBuffer, position + 8, length);
      const text = new TextDecoder().decode(chunkData);
      const separatorIndex = text.indexOf("\x00");
      if (separatorIndex !== -1) {
        const keyword = text.slice(0, separatorIndex);
        const value = text.slice(separatorIndex + 1);
        textChunks[keyword] = value;
      }
    } else if (type === 'iTXt') {
      const chunkData = new Uint8Array(arrayBuffer, position + 8, length);
      let offset = 0;

      const nullIndex = chunkData.indexOf(0, offset);
      if (nullIndex === -1) continue;

      const keyword = new TextDecoder().decode(chunkData.slice(offset, nullIndex));
      offset = nullIndex + 1;

      const compressionFlag = chunkData[offset];
      offset += 2;

      const langTagEnd = chunkData.indexOf(0, offset);
      if (langTagEnd === -1) continue;
      offset = langTagEnd + 1;

      const translatedKeywordEnd = chunkData.indexOf(0, offset);
      if (translatedKeywordEnd === -1) continue;
      offset = translatedKeywordEnd + 1;

      const remainingData = chunkData.slice(offset);
      const value = new TextDecoder().decode(compressionFlag ? pako.inflate(remainingData) : remainingData);
      textChunks[keyword] = value;
    }

    position += 8 + length + 4; // chunk header (8) + data length + CRC (4)
  }

  return textChunks;
}


export default extractTextChunks;
