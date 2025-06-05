import { readFileSync, writeFileSync } from 'fs';
import { dirname } from "path";
import { fileURLToPath } from "url";

const mode = 'production';
const entry = ['./src/index.js'];
const output = {
  filename: 'text-chunk-preview.user.js',
  path: dirname(fileURLToPath(import.meta.url)),
};
const module = {
  rules: [
    {
      test: /\.js$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'swc-loader',
      },
    },
  ],
};
const plugins = [
  {
    apply: compiler => {
      compiler.hooks.afterEmit.tap('AddUserscriptHeader', () => {
        const header = readFileSync('./userscript-header.js', 'utf8');
        const bundledScript = readFileSync('./text-chunk-preview.user.js', 'utf8');
        writeFileSync('./text-chunk-preview.user.js', `${header}\n${bundledScript}`);
      });
    },
  }
];

export default {
  mode,
  entry,
  output,
  module,
  plugins,
};
