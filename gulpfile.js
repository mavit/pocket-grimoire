const gulp          = require("gulp");
const notify        = require("gulp-notify");
const sourcemaps    = require("gulp-sourcemaps");
const rollup        = require("gulp-better-rollup");
const babel         = require("rollup-plugin-babel");
const resolve       = require("rollup-plugin-node-resolve");
const commonjs      = require("rollup-plugin-commonjs");
const uglify        = require("gulp-uglify");
const jsonminify    = require("gulp-jsonminify");
const noop          = require("gulp-noop");
const sass          = require("gulp-sass")(require("sass"));
const autoprefixer  = require("gulp-autoprefixer");
const cleanCSS      = require("gulp-clean-css");
const twig          = require("gulp-twig");
const htmlmin       = require("gulp-htmlmin");

const ENTRY_POINTS = {
    js: [
        "./assets/js/main.js",
        // "./assets/js/list.js"
    ],
    data: [
        "./assets/data/**/*.json"
    ],
    scss: [
        "./assets/scss/main.scss"
    ],
    twig: [
        "./templates/pages/**/*.twig"
    ]
};

const GLOBS = {
    js: [
        "./assets/js/**/*.js"
    ],
    data: [
        "./assets/data/**/*.json"
    ],
    scss: [
        "./assets/scss/**/*.scss"
    ],
    twig: [
        "./templates/**/*.twig"
    ],
    images: [
        "./assets/img/**/*"
    ],
    fonts: [
        "./assets/fonts/**/*"
    ]
};

const OUTPUTS = {
    html: "./dist/",
    js: "./dist/assets/js/",
    data: "./dist/assets/data/",
    css: "./dist/assets/css/",
    img: "./dist/assets/img/",
    fonts: "./dist/assets/fonts/",
};

gulp.task("scripts", () => Promise.all(

    ENTRY_POINTS.js.map((entryPoints) => new Promise((resolve) => {

        const isProduction = (process.env.NODE_ENV === "production");

        gulp.src(entryPoints)
            .pipe(
                isProduction
                ? noop()
                : sourcemaps.init()
            )
            .pipe(rollup({
                    plugins: [
                        babel({
                            presets: ["@babel/preset-env"],
                            plugins: ["@babel/plugin-proposal-class-properties"]
                        }),
                        resolve(),
                        commonjs()
                    ]
                }, "iife")
                .on(
                    "error",
                    notify.onError((err) => "JavaScript Error: " + err.message)
                )
            )
            .pipe(
                isProduction
                ? noop()
                : sourcemaps.write()
            )
            .pipe(
                isProduction
                ? uglify()
                : noop()
            )
            .pipe(gulp.dest(OUTPUTS.js))
            .on("end", resolve);

    }))

));

gulp.task("scripts:watch", () => {

    return gulp.watch([
        "./gulpfile.js",
        ...GLOBS.js
    ], gulp.series("scripts"));

});

gulp.task("data", () => Promise.all(

    ENTRY_POINTS.data.map((entryPoints) => new Promise((resolve) => {

        const isProduction = (process.env.NODE_ENV === "production");

        gulp.src(entryPoints)
            .pipe(
                isProduction
                ? jsonminify()
                : noop()
            )
            .pipe(gulp.dest(OUTPUTS.data))
            .on("end", resolve);

    }))

));

gulp.task("data:watch", () => {

    return gulp.watch([
        "./gulpfile.js",
        ...GLOBS.data
    ], gulp.series("data"));

});

gulp.task("styles", () => Promise.all(

    ENTRY_POINTS.scss.map((entryPoints) => new Promise((resolve) => {

        const isProduction = (process.env.NODE_ENV === "production");

        gulp.src(entryPoints)
            .pipe(
                isProduction
                ? noop()
                : sourcemaps.init()
            )
            .pipe(sass()
                .on(
                    "error",
                    notify.onError((err) => "SCSS Error: " + err.message)
                )
            )
            .pipe(autoprefixer({
                overrideBrowserslist: [
                    "defaults"
                ]
            }))
            .pipe(
                isProduction
                ? noop()
                : sourcemaps.write()
            )
            .pipe(
                isProduction
                ? cleanCSS()
                : noop()
            )
            .pipe(gulp.dest(OUTPUTS.css))
            .on("end", resolve);

    }))

));

gulp.task("styles:watch", () => {

    return gulp.watch([
        "./gulpfile.js",
        ...GLOBS.scss
    ], gulp.series("styles"));

});

gulp.task("pages", () => {

    const isProduction = process.env.NODE_ENV === "production";

    return gulp.src(ENTRY_POINTS.twig)
        .pipe(twig({
            data: {
                app: {
                    environment: (
                        isProduction
                        ? "prod"
                        : "dev"
                    )
                }
            }
        }))
        .pipe(
            isProduction
            ? htmlmin({
                collapseWhitespace: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: true,
                removeComments: true
            })
            : noop()
        )
        .pipe(gulp.dest(OUTPUTS.html));

});

gulp.task("pages:watch", () => {

    return gulp.watch([
        ...GLOBS.twig
    ], gulp.series("pages"));

});

gulp.task("images", () => {

    return gulp.src(GLOBS.images)
        .pipe(gulp.dest(OUTPUTS.img));

});

gulp.task("images:watch", () => {

    return gulp.watch([
        ...GLOBS.images
    ], gulp.series("images"));

});

gulp.task("fonts", () => {

    return gulp.src(GLOBS.fonts)
        .pipe(gulp.dest(OUTPUTS.fonts));

});

gulp.task("fonts:watch", () => {

    return gulp.watch([
        ...GLOBS.fonts
    ], gulp.series("fonts"));

});

gulp.task("env:dev", (callback) => {

    process.env.NODE_ENV = "development";
    callback();

});

gulp.task("env:prod", (callback) => {

    process.env.NODE_ENV = "production";
    callback();

});

gulp.task(
    "dev",
    gulp.series(
        "env:dev",
        gulp.parallel(
            gulp.series("scripts", "scripts:watch"),
            gulp.series("styles", "styles:watch"),
            gulp.series("images", "images:watch"),
            gulp.series("fonts", "fonts:watch"),
            gulp.series("pages", "pages:watch"),
            gulp.series("data", "data:watch")
        )
    )
);

gulp.task(
    "prod",
    gulp.series(
        "env:prod",
        gulp.parallel(
            "scripts",
            "styles",
            "images",
            "fonts",
            "pages",
            "data"
        )
    )
);