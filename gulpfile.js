/**
 * General variables
 */

const gulp = require('gulp'),
    csso = require('gulp-csso'),
    rename = require('gulp-rename'),
    browserSync = require('browser-sync'),
    uglify = require('gulp-uglify'),
    autoprefixer = require('gulp-autoprefixer'),
    fileInclude = require('gulp-file-include'),
    argv = require('yargs').argv,
    sass = require('gulp-sass'),
    tildeImporter = require('node-sass-tilde-importer'),
    zip = require('gulp-zip'),
    sourcemaps = require('gulp-sourcemaps'),
    htmlmin = require('gulp-htmlmin'),
    imagemin = require('gulp-imagemin'),
    iconfont = require("gulp-iconfont"),
    iconfontCss = require("gulp-iconfont-css"),
    webp = require('gulp-webp'),
    del = require('del');

// Build settings

let srcPath = './src';
let devPath = './dev';
let distPath = './dist';

if (argv.srcPath === 'this') {
    srcPath = '..';
    distPath = '..';
    devPath = '..';
}

const isDisableOptimize = !!argv.disableOptimize;

/**
 * Browser Sync Init
 */

function browser() {
    browserSync.init({
        server: {
            baseDir: devPath,
            index: 'index.html'
        }
    });
}

/**
 * Build fonts
 */

function buildFonts(cb) {
    del.sync([srcPath + '/assets/font/tpl-icons/']);
    return gulp.src(srcPath + "/assets/img/tpl-icons/**/*.svg")
        .pipe(
            iconfontCss({
                fontName: "tpl-icons",
                cssClass: "h-tpl-icon",
                targetPath: "_index.scss",
                fontPath: "../font/tpl-icons/"
            })
        )
        .pipe(
            iconfont({
                fontName: "tpl-icons",
                prependUnicode: true,
                normalize: true,
                fontHeight: 5000,
                centerHorizontally: true,
                formats: ["svg", "ttf", "eot", "woff", "woff2"]
            })
        )
        .pipe(gulp.dest(srcPath + "/assets/font/tpl-icons"));
}

/**
 * Build styles
 */

function buildStyles(cb) {
    if (isDisableOptimize) {
        return gulp.src(srcPath + '/assets/css/main.scss')
            .pipe(sourcemaps.init())
            .pipe(sass({
                importer: tildeImporter
            }).on('error', onError))
            .pipe(autoprefixer({overrideBrowserslist: ['last 100 versions']}))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(devPath + '/assets/css'))
            .pipe(rename({suffix: '.min', prefix: ''}))
            .pipe(gulp.dest(devPath + '/assets/css'))
            .pipe(browserSync.stream());
    } else {
        return gulp.src(srcPath + '/assets/css/main.scss')
            .pipe(sass({
                importer: tildeImporter
            }).on('error', onError))
            .pipe(autoprefixer({overrideBrowserslist: ['last 100 versions'], cascade: false}))
            .pipe(gulp.dest(distPath + '/assets/css'))
            .pipe(csso({
                comments: false
            }))
            .pipe(rename({suffix: '.min', prefix: ''}))
            .pipe(gulp.dest(distPath + '/assets/css'))
            .pipe(browserSync.stream());
    }
}

/**
 * Build scripts
 */

function buildScripts(cb) {
    if (isDisableOptimize) {
        return gulp.src(srcPath + '/assets/js/main.js')
            .pipe(fileInclude('//@@'))
            .pipe(gulp.dest(devPath + '/assets/js'))
            .on('error', onError)
            .pipe(rename({suffix: '.min', prefix: ''}))
            .pipe(gulp.dest(devPath + '/assets/js'));
    } else {
        return gulp.src(srcPath + '/assets/js/main.js')
            .pipe(fileInclude('//@@'))
            .pipe(gulp.dest(distPath + '/assets/js'))
            .pipe(uglify())
            .on('error', onError)
            .pipe(rename({suffix: '.min', prefix: ''}))
            .pipe(gulp.dest(distPath + '/assets/js'));
    }
}

/**
 * Optimize Images
 */

function images(cb) {
    return gulp.src([srcPath + '/**/*.png', srcPath + '/**/*.svg', srcPath + '/**/*.jpg', srcPath + '/**/*.jpeg', srcPath + '/**/*.gif'])
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true, optimizationLevel: 3}),
            imagemin.mozjpeg({progressive: true}),
            imagemin.optipng({optimizationLevel: 7}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(webp({
            lossless: true
        }))
        .pipe(gulp.dest(distPath));
}

/**
 * Copy assets
 */

function copyAssets(cb) {
    if (isDisableOptimize) {
        // Copy fonts
        gulp.src(srcPath + '/assets/font/**')
            .pipe(gulp.dest(devPath + '/assets/font'));

        // Copy and optimize images
        gulp.src(srcPath + '/assets/img/**')
            .pipe(gulp.dest(devPath + '/assets/img'));

        // Copy php files
        gulp.src(srcPath + '/assets/php/**')
            .pipe(gulp.dest(devPath + '/assets/php'));

        // Copy vendor
        gulp.src(srcPath + '/assets/vendor/**')
            .pipe(gulp.dest(devPath + '/assets/vendor'));

        // Copy templates
        return gulp.src(srcPath + '/templates/**')
            .pipe(gulp.dest(devPath + '/templates'));
    } else {
        // Copy fonts
        gulp.src(srcPath + '/assets/font/**')
            .pipe(gulp.dest(distPath + '/assets/font'));

        // Copy and optimize images
        gulp.src(srcPath + '/assets/img/**')
            .pipe(gulp.dest(distPath + '/assets/img'));

        // Copy php files
        gulp.src(srcPath + '/assets/php/**')
            .pipe(gulp.dest(distPath + '/assets/php'));

        // Copy vendor
        gulp.src(srcPath + '/assets/vendor/**')
            .pipe(gulp.dest(distPath + '/assets/vendor'));

        // Copy templates
        return gulp.src(srcPath + '/templates/**')
            .pipe(gulp.dest(distPath + '/templates'));
    }
}

/**
 * Build templates
 */

function buildTemplates(cb) {
    if (isDisableOptimize) {
        return gulp.src(srcPath + '/templates/*.html')
            .pipe(fileInclude('//@@'))
            .on('error', onError)
            .pipe(gulp.dest(devPath));
    } else {
        return gulp.src(srcPath + '/templates/*.html')
            .pipe(fileInclude('//@@'))
            .pipe(htmlmin({
                collapseWhitespace: false,
                collapseInlineTagWhitespace: false,
                minifyCSS: true,
                minifyJS: true,
                minifyURLs: true,
                removeComments: true,
                removeStyleLinkTypeAttributes: true,
                removeScriptTypeAttributes: true
            }))
            .on('error', onError)
            .pipe(gulp.dest(distPath));
    }
}

/**
 * Build vendor scripts
 */

function buildScriptsVendor(cb) {
    if (isDisableOptimize) {
        return gulp.src([srcPath + '/assets/js/vendor.js'])
            .pipe(fileInclude('//@@'))
            .pipe(gulp.dest(devPath + '/assets/js'))
            .on('error', onError)
            .pipe(rename({suffix: '.min', prefix: ''}))
            .pipe(gulp.dest(devPath + '/assets/js'));
    } else {
        return gulp.src([srcPath + '/assets/js/vendor.js'])
            .pipe(fileInclude('//@@'))
            .pipe(gulp.dest(distPath + '/assets/js'))
            .pipe(uglify())
            .on('error', onError)
            .pipe(rename({suffix: '.min', prefix: ''}))
            .pipe(gulp.dest(distPath + '/assets/js'));
    }
}

/**
 * Reload browser
 */

function browserReload(cb) {
    browserSync.reload();
    cb();
}

/**
 * General watcher
 */

function watch() {
    gulp.watch([srcPath + '/**/*.scss', srcPath + '/**/*.css'], gulp.series(buildStyles));
    gulp.watch([srcPath + '/assets/js/**/*.js'], gulp.series(buildScripts, browserReload));
    gulp.watch([srcPath + '/assets/vendor/**/*.js', srcPath + '/assets/js/vendor.js'], gulp.series(buildScriptsVendor, browserReload));
    gulp.watch([srcPath + '/templates/**/*.html'], gulp.series(buildTemplates, browserReload));
}

/**
 * Create build archive
 */

function zipBuild(cb) {
    gulp.src(['./**', '!' + distPath + '/**', '!' + distPath, '!' + devPath + '/**', '!' + devPath, '!./node_modules/**', '!./node_modules', '!./package-lock.json', '!./src.zip'])
        .pipe(zip('src.zip'))
        .pipe(gulp.dest('./'));
    cb();
}

/**
 * Clean dist
 */
function cleanDist(cb) {
    del.sync([distPath]);
    cb();
}

/**
 * Clean dev
 */
function cleanDev(cb) {
    del.sync([devPath]);
    cb();
}

// Error handler

function onError(err) {
    console.log(err);
    this.emit('end');
}

/**
 * Gulp Start
 */

exports.default = gulp.series(cleanDev, buildFonts, buildStyles, buildScripts, buildScriptsVendor, buildTemplates, copyAssets, gulp.parallel(browser, watch));
exports.build = gulp.series(cleanDist, buildFonts, buildStyles, buildScripts, buildScriptsVendor, buildTemplates, copyAssets, images);
exports.zip = gulp.series(cleanDist, cleanDev, zipBuild);
