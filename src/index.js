import novelAiRead from "./novelAiRead";
import extractExifFromJpeg from "./extractExifFromJpeg";
import extractTextChunks from "./extractTextChunks";
import displayData from "./displayData";
import extractExifFromWebp from "./extractExifFromWebp";

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
  } else if (url.endsWith(".webp")) {
    const exif = await extractExifFromWebp(document.location.href);
    hasData = Object.values(exif).length > 0;
    if (hasData) displayData(exif, 'EXIF');
  } else if (url.endsWith(".png")) {
    const chunks = await extractTextChunks(document.location.href);
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
