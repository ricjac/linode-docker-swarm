var gulp = require("gulp");
var ts = require("gulp-typescript");
var sourcemaps = require('gulp-sourcemaps');
var merge = require('merge2');

var tsProject = ts.createProject("tsconfig.json");

gulp.task('build', function () {
    var tsResult = tsProject
        .src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())

    return merge([
        tsResult.js
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(tsProject.options.outDir)),
        tsResult.dts.pipe(gulp.dest(tsProject.options.declarationDir)),
    ]);
});
