var gulp    = require('gulp');
var tslint  = require('gulp-tslint');
var exec    = require('child_process').exec;
var gulp    = require('gulp-help')(gulp);

gulp.task('tslint', 'Lints all TypeScript source files', function(){
  return gulp.src('src/**/*.ts')
  .pipe(tslint())
  .pipe(tslint.report('verbose'));
});

gulp.task('build', 'Compiles all TypeScript source files', function (cb) {
  exec('tsc', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});