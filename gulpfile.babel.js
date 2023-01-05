import gulp from 'gulp';
import browser from 'browser-sync';
import environments from 'gulp-environments';
import { deleteAsync } from 'del';
import uglifycss from 'gulp-uglifycss';
import image from 'gulp-image';
import sass from 'sass';
import gulpSass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import babelify from 'babelify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import cache from 'gulp-cache';
import uglify from 'gulp-uglify';
import streamify from 'gulp-streamify';
import watchify from 'watchify';

const sassTask = gulpSass(sass);

const browserSync = browser.create();
const production = environments.production;
const proxyUrl = 'localhost:8080';
const paths = {
  img: {
    src: 'gulp-src/img/*',
    dist: 'src/main/resources/static/dist/img/',
  },
  scss: {
    watch: 'gulp-src/sass/**/*.scss',
    src: 'gulp-src/sass/main.scss',
    dist: 'src/main/resources/static/dist/css/'
  },
  js: {
    entry: 'gulp-src/js/main.js',
    watch: 'gulp-src/js/**/*.js',
    src: 'gulp-src/js/**/*.js',
    dist: 'src/main/resources/static/dist/js/',
  }
};

const cleanDist = () => deleteAsync(['src/main/resources/static/dist/']);

const img = () => 
  gulp.src(paths.img.src)
    .pipe(production(image()))
    .pipe(gulp.dest(paths.img.dist));

const scss = () =>
  gulp
    .src(paths.scss.src)
    .pipe(sassTask().on('error', sassTask.logError))
    .pipe(autoprefixer())
    .pipe(production(uglifycss()))
    .pipe(gulp.dest(paths.scss.dist));

const js = () =>
  gulp.src([paths.js.src])
    browserify({
      entries: [paths.js.entry],
      transform: [
        babelify.configure({ presets: ['@babel/preset-env']}),
        ['uglifyify', { global: true }]
      ]
    })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(paths.js.dist));

const devJs = (done) => {
  const devBro = browserify({
    entries: [paths.js.entry],
    cache: {},
    packageCache: {},
    plugin: [watchify],
    transform: [
      babelify.configure({ presets: ['@babel/preset-env']}),
      ['uglifyify', { global: true }]
    ]
  });

  devBro.on('update', devBundle);
  devBro.on('log', function (msg) {console.log(msg);})
  devBro.bundle().pipe(source('bundle.js')).pipe(gulp.dest(paths.js.dist));

  function devBundle() {
    devBro.bundle().pipe(source('bundle.js')).pipe(gulp.dest(paths.js.dist));
  }
  
  done();
};

const devServer = () => {
  browserSync.init({
    proxy: proxyUrl,
  });

  gulp.watch(paths.img.src, gulp.series([img, 'clearCache', reload]));
  gulp.watch(paths.scss.watch, gulp.series([scss, 'clearCache', reload]));
  gulp.watch(paths.js.src, gulp.series([devJs, reload])); 
};

gulp.task('clearCache', function (done) {
  return cache.clearAll(done);
});

const reload = (done) => {
  browserSync.reload();
  done();
}

const prepare = gulp.series([cleanDist, img]);

const assetsProd = gulp.series([scss, js]);

const assetsDev = gulp.series([scss, devJs]);

export const build = gulp.series([prepare, assetsProd]);

export const dev = gulp.series([prepare, assetsDev, devServer]);
