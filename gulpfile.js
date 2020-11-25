const gulp=require('gulp') //gulp基础库
const uglify=require('gulp-uglify') //js压缩


gulp.task(
    'minjs', 
    () => gulp.src("./dist/*.js") 
        .pipe(uglify())  
        .pipe(gulp.dest("./bin"))
)

