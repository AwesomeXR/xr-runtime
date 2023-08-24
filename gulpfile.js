const projPkg = require('./package.json');

const { src, dest, parallel, series } = require('gulp');
const replace = require('gulp-replace');
const rename = require('gulp-rename');
const exec = require('child_process').exec;
const rm = require('gulp-rm');
const mergeStream = require('merge-stream');

const getFileEmitStream = (filename, content, destDir) => {
  return src('empty.tpl').pipe(replace('{CONTENT}', content)).pipe(rename(filename)).pipe(dest(destDir));
};

// 导出平台代码
const createCopyTask = name => {
  const tmp = {
    ['copy_' + name]() {
      const distDir = `../xr-runtime-${name}`;

      const streams = [
        // entry js
        src(`dist/${name}/**/*.js`, { base: `dist/${name}` }).pipe(dest(distDir)),

        // root pkg
        getFileEmitStream(
          'package.json',
          JSON.stringify({
            name: 'xr-runtime-' + name,
            version: projPkg.version,
            main: 'index.js',
            module: 'index.js',
          }),
          distDir
        ),

        // readme doc
        src(`src/${name}/README.md`)
          .pipe(
            replace(
              '{{HEAD}}',
              `
# xr-runtime-${name}

xr 运行时 for ${name}
`
            )
          )
          .pipe(dest(`dist`))
          .pipe(rename('README.md'))
          .pipe(dest(distDir)),

        // npm rc
        getFileEmitStream('.npmrc', 'registry=https://registry.npmjs.org/', distDir),
      ];

      return mergeStream(...streams);
    },
  };

  return tmp['copy_' + name];
};

function clean() {
  return src('dist/**/*', { read: false }).pipe(rm());
}

function run_webpack(cb) {
  exec('webpack build', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function run_tscEmitType(cb) {
  exec('tsc -p tsconfig.build.json --outDir dist --emitDeclarationOnly', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

const emitDist = parallel(createCopyTask('h5'));
const build = series(clean, run_webpack, run_tscEmitType, emitDist);

function deploy(cb) {
  exec(
    `ah-web-cli deploy --publicDir=dist --pathPrefix=/gw/xr-runtime/${projPkg.version}/ --stableAssetExts=js`,
    function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);
    }
  );
}

exports.emitDist = emitDist;
exports.build = build;
exports.deploy = deploy;
