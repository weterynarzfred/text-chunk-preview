const fs = require('fs');

module.exports = {
  mode: 'production',
  entry: ['./src/index.js'],
  output: {
    filename: 'text-chunk-preview.user.js',
    path: __dirname,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'swc-loader',
        },
      },
    ],
  },
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.afterEmit.tap('AddUserscriptHeader', () => {
          const header = fs.readFileSync('./userscript-header.js', 'utf8');
          const bundledScript = fs.readFileSync('./text-chunk-preview.user.js', 'utf8');
          fs.writeFileSync('./text-chunk-preview.user.js', `${header}\n${bundledScript}`);
        });
      },
    }
  ],
};
