var compressor = require('node-minify');
compressor.minify({
  compressor: 'gcc',
  input: 'component.js',
  output: 'component.min.js',
  options: {
    language: 'ECMASCRIPT6'
  },
  callback: function (err, min) {}
});