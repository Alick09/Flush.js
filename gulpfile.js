const { src, dest } = require('gulp');
const minify = require('gulp-minify');
const babel = require('gulp-babel');
var browserify = require('gulp-browserify');
 
exports.default = function() {
  return src('src/*.js')
    .pipe(babel({
        presets: ['@babel/env']
    })).pipe(browserify({
      insertGlobals : true
    }))
    .pipe(minify({ext: {min: ".min.js"}, noSource: true}))
    .pipe(dest('dist/'));
}