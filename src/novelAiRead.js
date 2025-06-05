/**
 * Adapted from SD Prompts Checker by albertlast
 * MIT License: https://github.com/albertlast/SD-Prompts-Checker/blob/main/LICENSE
 * Source: https://github.com/albertlast/SD-Prompts-Checker
 */

function readBytes(alphaData, width, height, maxHeight) {
  let byte = 0;
  for (let i = 0; i < 8; i++) {
    byte <<= 1;
    byte |= alphaData[height][width];
    height++;
    if (height === maxHeight) {
      width++;
      height = 0;
    }
  }
  return {
    byte,
    width,
    height,
  };
}

async function novelAiRead(imageResponse) {
  const arrayBuffer = await imageResponse.arrayBuffer();
  const byteArray = new Uint8Array(arrayBuffer);
  const contentType = imageResponse.headers.get("Content-Type");

  let alphaData = {};
  let img = new Blob([byteArray], { type: contentType });
  let bitmap = await createImageBitmap(img);
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  let maxWidth = -1;
  let maxHeight = -1;
  maxWidth = bitmap.width;
  maxHeight = bitmap.height;
  canvas.width = maxWidth;
  canvas.height = maxHeight;
  ctx.drawImage(bitmap, 0, 0);

  let imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
  let rows = 0;
  let cols = 0;

  for (let x = 3; x < imgData.length; x += 4) {
    if (cols === 0) alphaData[rows] = {};
    alphaData[rows][cols] = imgData[x] & 1;
    cols++;
    if (cols === maxWidth) {
      rows++;
      cols = 0;
    }
  }

  // magic number check
  const magic = "stealth_pngcomp";
  let readWidth = 0;
  let readHeight = 0;
  let readObj;
  let pngByte = new Uint8Array();
  for (let y = 0; y < magic.length; y++) {
    const tempByte = pngByte;
    readObj = readBytes(alphaData, readWidth, readHeight, maxWidth, maxHeight);
    readWidth = readObj.width;
    readHeight = readObj.height;
    pngByte = new Uint8Array(pngByte.length + 1);
    pngByte.set(tempByte);
    pngByte.set([readObj.byte], tempByte.length);
  }

  const magicCode = String.fromCharCode(...pngByte);
  pngByte = new Uint8Array();

  if (magic !== magicCode) return;

  // get the size of data
  for (let y = 0; y < 4; y++) {
    const tempByte = pngByte;
    readObj = readBytes(alphaData, readWidth, readHeight, maxHeight);
    readWidth = readObj.width;
    readHeight = readObj.height;
    pngByte = new Uint8Array(pngByte.length + 1);
    pngByte.set(tempByte);
    pngByte.set([readObj.byte], tempByte.length);
  }

  const zipLong = new DataView(pngByte.buffer).getInt32(0, false) / 8;
  pngByte = new Uint8Array();
  // read data
  for (let y = 0; y < zipLong; y++) {
    const tempByte = pngByte;
    readObj = readBytes(alphaData, readWidth, readHeight, maxWidth, maxHeight);
    readWidth = readObj.width;
    readHeight = readObj.height;
    pngByte = new Uint8Array(pngByte.length + 1);
    pngByte.set(tempByte);
    pngByte.set([readObj.byte], tempByte.length);
  }

  let promp = pako.ungzip(pngByte);
  const utf8decoder = new TextDecoder();
  return { "alpha layer": utf8decoder.decode(promp) };
}

export default novelAiRead;
