# tEXt Chunk Preview

A browser userscript that reveals textual metadata stored inside image files mainly meant for prompts from stable diffusion but it works for other types of metadata as well. When you open a PNG, JPEG, or WebP image directly, the script scans the file for EXIF entries, PNG text chunks, or NovelAI-style data embedded in the alpha channel.

- **EXIF extraction** – JPEG and WebP images are parsed using [exifr](https://github.com/MikeKovarik/exifr).
- **PNG text chunks** – tEXt and iTXt chunks are decoded and displayed.
- **NovelAI alpha layer data** – detects and decompresses prompts stored in the PNG alpha channel - adapted from [SD-Prompts-Checker](https://github.com/albertlast/SD-Prompts-Checker)
- **Formatted output** – Stable Diffusion prompts and JSON strings are prettified for readability.

## Usage

1. Install a userscript manager such as Tampermonkey, Greasemonkey, or Violentmonkey.
2. Open [`text-chunk-preview.user.js`](https://gitgud.io/AntlersAnon/text-chunk-preview/-/raw/master/text-chunk-preview.user.js?ref_type=heads) and add it to your userscript manager.
3. Open an image file in your browser. When metadata is present, a button labelled `tEXt`, `EXIF`, or `alpha` will appear.

## License

[MIT](LICENSE)