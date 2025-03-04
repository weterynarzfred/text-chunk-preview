// ==UserScript==
// @name        tEXt chunk preview
// @include     /.*\.(png|jpe?g)(\?.*)?$/
// @grant       none
// @require     https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.js
// @version     1.4
// @namespace   text-chunk-preview
// @author      AntlersAnon
// ==/UserScript==

async function extractExifFromJpeg(imgUrl) {
  const response = await fetch(imgUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const exif = EXIF.readFromBinaryFile(arrayBuffer);

  if (exif && exif.UserComment)
    exif.UserComment = String.fromCharCode(...exif.UserComment.slice(8)).trim();

  return exif ? exif : {};
}

async function extractTEXTChunks(imgUrl) {
  const response = await fetch(imgUrl);
  const arrayBuffer = await response.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  let position = 8; // Skip the PNG signature
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
      if (separatorIndex === -1) continue;

      const keyword = text.slice(0, separatorIndex);
      const value = text.slice(separatorIndex + 1);
      textChunks[keyword] = value;
    }

    position += 8 + length + 4;
  }

  return textChunks;
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
  console.log(string);
  const splitString = string.split(/\n(Negative prompt|Steps): /, 5);

  if (splitString.length !== 5) throw ("unknown prompt format");

  const data = {
    "prompt": splitString[0],
    "negative prompt": splitString[2],
  };
  splitString[4] = "Steps: " + splitString[4];
  console.log(splitString[4]);
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

function displayChunks(chunks) {
  let isTextChunkActive = false;

  const button = document.createElement('div');
  button.id = 'png-text-button';
  button.classList.add('metadata-preview-button');
  button.textContent = "tEXt";
  button.addEventListener('click', () => {
    if (isTextChunkActive)
      container.classList.remove('active');
    else
      container.classList.add('active');
    isTextChunkActive = !isTextChunkActive;
  });

  const container = document.createElement('div');
  container.id = 'png-text-chunks';
  for (chunkKey in chunks) {
    const chunkElement = document.createElement('div');
    chunkElement.classList.add('png-text-chunk');
    chunkElement.innerHTML = `<span class="png-text-chunk-key">${chunkKey}:</span> <span class="png-text-chunk-value">${formatString(chunks[chunkKey])}</span>`;
    container.appendChild(chunkElement);
  }

  document.getElementById('metadata-preview-buttons').appendChild(button);
  document.body.appendChild(container);
}

function displayExif(exif) {
  let isExifActive = false;

  const button = document.createElement('div');
  button.id = 'exif-button';
  button.classList.add('metadata-preview-button');
  button.textContent = "EXIF";
  button.addEventListener('click', () => {
    if (isExifActive)
      container.classList.remove('active');
    else
      container.classList.add('active');
    isExifActive = !isExifActive;
  });

  const container = document.createElement('div');
  container.id = 'png-text-chunks';
  for (exifKey in exif) {
    const chunkElement = document.createElement('div');
    chunkElement.classList.add('png-text-chunk');
    chunkElement.innerHTML = `<span class="png-text-chunk-key">${exifKey}:</span> <span class="png-text-chunk-value">${formatString(exif[exifKey])}</span>`;
    container.appendChild(chunkElement);
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
    if (hasData) displayExif(exif);
  } else if (url.endsWith(".png")) {
    const chunks = await extractTEXTChunks(document.location.href);
    hasData = Object.values(chunks).length > 0;
    if (hasData) displayChunks(chunks);
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
