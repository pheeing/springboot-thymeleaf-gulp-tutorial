const { src, dest } = require('gulp');
const sass = require('sass');
const gulpSass = require('gulp-sass');

const sassTask = gulpSass(sass);

exports.buildSass = function() {
  return src('gulp-src/sass/main.scss')
    .pipe(sassTask().on('error', sassTask.logError))
    .pipe(dest('src/main/resources/static/dist/css/'));
}