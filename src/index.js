import pako from 'pako';
import EXIF from 'exif-js';

async function extractExifFromJpeg(imgUrl) {
  const response = await fetch(imgUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const exif = EXIF.readFromBinaryFile(arrayBuffer);

  delete exif.MakerNote;
  delete exif.thumbnail;

  if (exif && exif.UserComment)
    exif.UserComment = String.fromCharCode(...exif.UserComment.slice(8)).trim();

  return exif ? exif : {};
}

async function extractTEXTChunks(imgUrl) {
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

// adapted from https://github.com/albertlast/SD-Prompts-Checker
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

// adapted from https://github.com/albertlast/SD-Prompts-Checker
async function novelAiRead(imgUrl) {
  const response = await fetch(imgUrl);
  const arrayBuffer = await response.arrayBuffer();
  const byteArray = new Uint8Array(arrayBuffer);
  const contentType = response.headers.get("Content-Type");

  let aplhaData = {};
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
    if (cols === 0) aplhaData[rows] = {};
    aplhaData[rows][cols] = imgData[x] & 1;
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
    readObj = readBytes(aplhaData, readWidth, readHeight, maxWidth, maxHeight);
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
    readObj = readBytes(aplhaData, readWidth, readHeight, maxHeight);
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
    readObj = readBytes(aplhaData, readWidth, readHeight, maxWidth, maxHeight);
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

function escapeHTML(htmlString) {
  return htmlString.toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatPrompt(string) {
  const splitString = string.split(/\n(Negative prompt|Steps): /, 5);

  if (splitString.length !== 5) throw ("unknown prompt format");

  const data = {
    "prompt": splitString[0],
    "negative prompt": splitString[2],
  };
  splitString[4] = "Steps: " + splitString[4];
  splitString[4].match(/[a-zA-Z0-9 ]+: (\{.*?\}|[^\{\}:,]+)(, |$)/g).forEach(e => {
    const split = e.split(/: (.+)/, 2);
    if (split.length !== 2) return;
    data[split[0]] = split[1].replace(/, $/, "");
    if (data[split[0]].startsWith('{')) {
      try {
        const formatted = JSON.stringify(JSON.parse(data[split[0]]), null, 2);
        data[split[0]] = formatted;
      } catch (e) { }
    }
  });

  return "<table>" + Object.entries(data).map(([key, value]) => `<tr class="prompt-part"><td><b>${key}</b></td><td><code>${escapeHTML(value)}</code></td></tr>`).join("") + "</table>" + `<span class="png-text-chunk-key">raw parameters: </span>` + escapeHTML(string);
}

function formatString(string) {
  if (typeof string !== "string") return string;
  try {
    const data = JSON.parse(string);
    return "<code>" + escapeHTML(JSON.stringify(data, null, 2)) + "</code>";
  } catch (e) { }

  if (string.includes("Negative prompt")) {
    try {
      const data = formatPrompt(string);
      return data;
    } catch (e) { console.error(e); }
  }

  return (escapeHTML(string));
}

function displayData(data, label) {
  let isDataActive = false;

  const button = document.createElement('div');
  button.id = 'png-text-button';
  button.classList.add('metadata-preview-button');
  button.textContent = label;
  button.addEventListener('click', () => {
    if (isDataActive)
      container.classList.remove('active');
    else
      container.classList.add('active');
    isDataActive = !isDataActive;
  });

  const container = document.createElement('div');
  container.id = 'png-text-chunks';
  for (const dataKey in data) {
    const dataElement = document.createElement('div');
    dataElement.classList.add('png-text-chunk');
    dataElement.innerHTML = `<span class="png-text-chunk-key">${dataKey}:</span> <span class="png-text-chunk-value">${formatString(data[dataKey])}</span>`;
    container.appendChild(dataElement);
  }

  document.getElementById('metadata-preview-buttons').appendChild(button);
  document.body.appendChild(container);
}

(async () => {
  const url = document.location.href.split('?')[0].toLowerCase();
  const buttons = document.createElement('div');
  buttons.id = 'metadata-preview-buttons';
  document.body.appendChild(buttons);

  let hasData = false;
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) {
    const exif = await extractExifFromJpeg(document.location.href);
    hasData = Object.values(exif).length > 0;
    if (hasData) displayData(exif, 'EXIF');
  } else if (url.endsWith(".png")) {
    const chunks = await extractTEXTChunks(document.location.href);
    hasData = Object.values(chunks).length > 0;
    if (hasData) displayData(chunks, 'tEXt');
    else {
      const data = await novelAiRead(document.location.href);
      hasData = data && Object.values(data).length > 0;
      if (hasData) displayData(data, 'alpha');
    }
  }

  if (!hasData) return;

  const style = document.createElement('style');
  style.textContent = `
#metadata-preview-buttons {
  position: fixed;
  z-index: 1;
  top: .5rem;
  left: .5rem;
  font-family: monospace;
  font-weight: 700;
  font-size: .8rem;
}

.metadata-preview-button {
  padding: .25em .5em;
  background-color: #111d;
  color: #fff;
  border: 1px solid #999;
  box-shadow: 0 0 0 1px #111;
  cursor: pointer;
}

.metadata-preview-button:hover {
  background-color: #333;
}

#png-text-chunks {
  display: none;
  position:fixed;
  font-family: monospace;
  box-sizing: border-box;
  padding: 2rem .5rem .5rem .5rem;
  background-color: #111d;
  color: #fff;
  width: 60rem;
  max-width: 100%;
  height: 100%;
  overflow: scroll;

  -ms-overflow-style: none;
  scrollbar-width: none;
  }

#png-text-chunks code {
  white-space: pre-wrap;
}

#png-text-chunks::-webkit-scrollbar {
  display: none;
}

#png-text-chunks.active {
  display: block;
}

.png-text-chunk {
  padding: .5rem;
  border-bottom: 1px solid #555;
}

.png-text-chunk:last-child {
  border: none;
}

table {
  border-collapse: collapse;
}

.prompt-part td {
  border-top: 1px solid #333;
  padding: .3em;
}

.prompt-part:first-child td {
  border-top: none;
}

.prompt-part td:first-child {
  white-space: pre;
  text-align: center;
  background-color: #222;
}

.prompt-part b {
  padding: 0 .5em .1em .5em;
  border-radius: 5px;
}
`;
  document.body.appendChild(style);
})();
