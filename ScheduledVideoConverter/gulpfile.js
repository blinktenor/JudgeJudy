var gulp = require('gulp');

gulp.task('serve', [] , function () {
    var options = {
        script: './bin/www',
        watch: ['./routes/**/*', './views/**/*','routes/*.js'],
        delayTime: 1,
        env: {
            'PORT': 3000,
            'NODE_ENV': 'dev'
        }
    };
});