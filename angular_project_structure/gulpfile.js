var gulp = require("gulp");
var browerSync  = require("browser-sync").create();
var sass = require("gulp-sass");

/* Static server + watching scss/html files */
gulp.task('serve' ,function(){
    browerSync.init({
        port : 5000 ,
        server : "./src"
    });

    //gulp.watch(["node_modules/bootstrap/scss/bootstrap.scss" , "src/scss/*.scss"] , ["sass task"]);
   //c gulp.watch([/* "src/views/*.html" , */ "src/*.html"]).on('change' , browerSync.reload);
});

gulp.task('default' , ['js task' ,'serve']);