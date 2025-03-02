// ==UserScript==
// @name        Display tEXt chunks
// @include     /.*\.png(\?.*)?$/
// @grant       none
// @version     1.0
// @author      AntlersAnon
// ==/UserScript==

async function extractTEXTChunks(pngUrl) {
  const response = await fetch(pngUrl);
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
  console.log(chunks);
  if (Object.values(chunks).length === 0) return;

  const style = document.createElement('style');
  style.textContent = `
#png-text-button {
  position: fixed;
  z-index: 1;
  top: .5rem;
  left: .5rem;
  font-family: monospace;
  font-weight: 700;
  font-size: .8rem;
  padding: .25em .5em;
  background-color: #111d;
  color: #fff;
  border: 1px solid #999;
  box-shadow: 0 0 0 1px #111;
  cursor: pointer;
}

#png-text-button:hover {
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
  max-width: 80%;
  height: 100%;
  overflow: scroll;

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
}
`;

  let isTextChunkActive = false;

  const button = document.createElement('div');
  button.id = 'png-text-button';
  button.textContent = "tEXt";
  button.addEventListener('click', () => {
    if (isTextChunkActive) {
      container.classList.remove('active');
    } else {
      container.classList.add('active');
    }
    isTextChunkActive = !isTextChunkActive;
  });

  const container = document.createElement('div');
  container.id = 'png-text-chunks';
  for (chunkKey in chunks) {
    console.log(chunkKey);
    const chunkElement = document.createElement('div');
    chunkElement.classList.add('png-text-chunk');
    chunkElement.innerHTML = `
<span class="png-text-chunk-key">${chunkKey}:</span> <span class="png-text-chunk-value">${chunks[chunkKey]}</span>
`;
    container.appendChild(chunkElement);
  }

  document.body.appendChild(style);
  document.body.appendChild(button);
  document.body.appendChild(container);
}

(async () => {
  const chunks = await extractTEXTChunks(document.location);
  displayChunks(chunks);
})();
