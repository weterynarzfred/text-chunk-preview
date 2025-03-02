// ==UserScript==
// @name        tEXt chunk preview
// @include     /.*\.(png|jpe?g)(\?.*)?$/
// @grant       none
// @require     https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.js
// @version     1.1
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
    chunkElement.innerHTML = `<span class="png-text-chunk-key">${chunkKey}:</span> <span class="png-text-chunk-value">${chunks[chunkKey]}</span>`;
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
    chunkElement.innerHTML = `<span class="png-text-chunk-key">${exifKey}:</span> <span class="png-text-chunk-value">${exif[exifKey]}</span>`;
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
    const exif = await extractExifFromJpeg(url);
    hasData = Object.values(exif).length > 0;
    if (hasData) displayExif(exif);
  } else if (url.endsWith(".png")) {
    const chunks = await extractTEXTChunks(url);
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
  white-space: pre-wrap;

  -ms-overflow-style: none;
  scrollbar-width: none;
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
`;
  document.body.appendChild(style);
})();
