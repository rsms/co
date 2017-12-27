#!/usr/bin/env TSC_NONPOLLING_WATCHER=1 node
//
// usage: build.js [-w] [-O | -Oonly]
//  -w      Watch sources for changes and rebuild incrementally
//  -O      Generate optimized output in addition to "regular" output
//  -Oonly  Only generate optimized output (based on existing debug product)
//
const webpack = require("webpack")
const fs = require('fs')
const promisify = require('util').promisify

const readfile = promisify(fs.readFile)
const writefile = promisify(fs.writeFile)

const rootdir = __dirname

// see https://webpack.github.io/docs/node.js-api.html

function main() {
  if (process.argv.includes('-Oonly')) {
    return buildOptimized()
  }

  const compiler = webpack({
    devtool: 'cheap-module-source-map',
    entry: [ rootdir + '/src/main'],
    target: 'node',
    output: {
      path: rootdir + '/out',
      filename: 'xlang.debug.js',
      libraryTarget: 'umd',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          loader: 'awesome-typescript-loader'
        },
      ],
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: 'try{require("source-map-support").install();}catch(_){};\n',
        raw: true,
        entryOnly: true
      })
    ],
  })

  if (process.argv.includes('-w')) {
    compiler.watch({
      aggregateTimeout: 50, // wait so long for more changes
    }, onBuild)
  } else {
    compiler.run(onBuild)
  }
}

function onBuild(err, stats) {
  if (err) {
    console.error(err.stack || ''+err)
    process.exit(1)
  }
  console.log(stats.toString({
    chunks: false, // Makes the build much quieter
    colors: true
  }))
  if (!stats.hasErrors()) {
    const map = stats.compilation.assets['xlang.debug.js.map']
    patchSourceMap(map).then(() => {
      if (process.argv.includes('-O')) {
        buildOptimized()
      }
    })
  }
}

function patchSourceMap(map) { // :Promise<void>
  // Webpack generates a really messy source map. This cleans it up.
  let m = JSON.parse(map.source())
  m.sourceRoot = '..'
  delete m.sourcesContent
  const builtinNamePrefix = 'webpack:///webpack'
  m.sources = m.sources.map(s => {
    return s.replace('webpack:///webpack/', 'wp:').replace('webpack:///', '')
  })
  return writefile(map.existsAt, JSON.stringify(m), 'utf8')
}

function buildOptimized() { // :Promise<void>
  const infile = 'out/xlang.debug.js'
  const outjsfile = 'xlang.js'
  const outmapfile = outjsfile + '.map'

  console.log(`building optimized ${outjsfile}`)

  const UglifyJS = require('uglify-es')

  const pureFuncList = [
    // list of known global pure functions that doesn't have any side-effects,
    // provided by the environment.
    'Math.floor',
    'Math.ceil',
    'Math.round',
    'Math.random',
    // TODO: expand this list
  ]

  return Promise.all([
    readfile(infile, 'utf8'),
    readfile(infile + '.map', 'utf8'),
  ]).then(([jssource, mapsource]) => {
    var result = UglifyJS.minify({[infile]: jssource}, {
      ecma: 8,
      warnings: true,
      // toplevel: true,

      // compress: false,
      compress: {
        // arrows: false,
        // (default: `true`) -- Converts `()=>{return x}` to `()=>x`. Class
        // and object literal methods will also be converted to arrow expressions if
        // the resultant code is shorter: `m(){return x}` becomes `m:()=>x`.
        // This transform requires that the `ecma` compress option is set to `6` or greater.

        // booleans: false,
        // (default: `true`) -- various optimizations for boolean context,
        // for example `!!a ? b : c → a ? b : c`

        // collapse_vars: false,
        // (default: `true`) -- Collapse single-use non-constant variables,
        // side effects permitting.

        // comparisons: false,
        // (default: `true`) -- apply certain optimizations to binary nodes,
        // e.g. `!(a <= b) → a > b` (only when `unsafe_comps`), attempts to negate binary
        // nodes, e.g. `a = !b && !c && !d && !e → a=!(b||c||d||e)` etc.

        // computed_props: false,
        // (default: `true`) -- Transforms constant computed properties
        // into regular ones: `{["computed"]: 1}` is converted to `{computed: 1}`.

        // conditionals: false,
        // (default: `true`) -- apply optimizations for `if`-s and conditional
        // expressions

        // dead_code: false,
        // (default: `true`) -- remove unreachable code

        // drop_console: false,
        // (default: `false`) -- Pass `true` to discard calls to
        // `console.*` functions. If you wish to drop a specific function call
        // such as `console.info` and/or retain side effects from function arguments
        // after dropping the function call then use `pure_funcs` instead.

        // drop_debugger: false,
        // (default: `true`) -- remove `debugger;` statements

        // ecma: 5,
        // (default: `5`) -- Pass `6` or greater to enable `compress` options that
        // will transform ES5 code into smaller ES6+ equivalent forms.

        evaluate: false, // breaks our build
        // (default: `true`) -- attempt to evaluate constant expressions

        // expression: true,
        // (default: `false`) -- Pass `true` to preserve completion values
        // from terminal statements without `return`, e.g. in bookmarklets.

        // global_defs: {},
        // (default: `{}`) -- see [conditional compilation](#conditional-compilation)

        // hoist_funs: false,
        // (default: `false`) -- hoist function declarations

        // hoist_props: false,
        // (default: `true`) -- hoist properties from constant object and
        // array literals into regular variables subject to a set of constraints. For example:
        // `var o={p:1, q:2}; f(o.p, o.q);` is converted to `f(1, 2);`. Note: `hoist_props`
        // works best with `mangle` enabled, the `compress` option `passes` set to `2` or higher,
        // and the `compress` option `toplevel` enabled.

        hoist_vars: true,
        // (default: `false`) -- hoist `var` declarations (this is `false`
        // by default because it seems to increase the size of the output in general)

        // if_return: false,
        // (default: `true`) -- optimizations for if/return and if/continue

        // inline: false,
        // (default: `true`) -- embed simple functions

        // join_vars: false,
        // (default: `true`) -- join consecutive `var` statements

        keep_classnames: true,
        // (default: `false`) -- Pass `true` to prevent the
        // compressor from discarding class names.  See also: the `keep_classnames`
        // [mangle option](#mangle).

        // keep_fargs: true,
        // (default: `true`) -- Prevents the compressor from discarding unused
        // function arguments.  You need this for code which relies on `Function.length`.

        // keep_fnames: true,
        // (default: `false`) -- Pass `true` to prevent the
        // compressor from discarding function names.  Useful for code relying on
        // `Function.prototype.name`. See also: the `keep_fnames` [mangle option](#mangle).

        keep_infinity: true,
        // (default: `false`) -- Pass `true` to prevent `Infinity` from
        // being compressed into `1/0`, which may cause performance issues on Chrome.

        // loops: false,
        // (default: `true`) -- optimizations for `do`, `while` and `for` loops
        // when we can statically determine the condition.

        // negate_iife: false,
        // (default: `true`) -- negate "Immediately-Called Function Expressions"
        // where the return value is discarded, to avoid the parens that the
        // code generator would insert.

        passes: 2,
        // (default: `1`) -- The maximum number of times to run compress.
        // In some cases more than one pass leads to further compressed code.  Keep in
        // mind more passes will take more time.

        // properties: false,
        // (default: `true`) -- rewrite property access using the dot notation, for
        // example `foo["bar"] → foo.bar`

        pure_funcs: pureFuncList,
        // (default: `null`) -- You can pass an array of names and
        // UglifyJS will assume that those functions do not produce side
        // effects.  DANGER: will not check if the name is redefined in scope.
        // An example case here, for instance `var q = Math.floor(a/b)`.  If
        // variable `q` is not used elsewhere, UglifyJS will drop it, but will
        // still keep the `Math.floor(a/b)`, not knowing what it does.  You can
        // pass `pure_funcs: [ 'Math.floor' ]` to let it know that this
        // function won't produce any side effect, in which case the whole
        // statement would get discarded.  The current implementation adds some
        // overhead (compression will be slower).

        // pure_getters: undefined,
        // (default: `"strict"`) -- If you pass `true` for
        // this, UglifyJS will assume that object property access
        // (e.g. `foo.bar` or `foo["bar"]`) doesn't have any side effects.
        // Specify `"strict"` to treat `foo.bar` as side-effect-free only when
        // `foo` is certain to not throw, i.e. not `null` or `undefined`.

        // reduce_funcs: false,
        // (default: `true`) -- Allows single-use functions to be
        // inlined as function expressions when permissible allowing further
        // optimization.  Enabled by default.  Option depends on `reduce_vars`
        // being enabled.  Some code runs faster in the Chrome V8 engine if this
        // option is disabled.  Does not negatively impact other major browsers.

        // reduce_vars: false,
        // (default: `true`) -- Improve optimization on variables assigned with and
        // used as constant values.

        // sequences: false,
        // (default: `true`) -- join consecutive simple statements using the
        // comma operator.  May be set to a positive integer to specify the maximum number
        // of consecutive comma sequences that will be generated. If this option is set to
        // `true` then the default `sequences` limit is `200`. Set option to `false` or `0`
        // to disable. The smallest `sequences` length is `2`. A `sequences` value of `1`
        // is grandfathered to be equivalent to `true` and as such means `200`. On rare
        // occasions the default sequences limit leads to very slow compress times in which
        // case a value of `20` or less is recommended.

        // side_effects: false,
        // (default: `true`) -- Pass `false` to disable potentially dropping
        // functions marked as "pure".  A function call is marked as "pure" if a comment
        // annotation `/*@__PURE__*/` or `/*#__PURE__*/` immediately precedes the call. For
        // example: `/*@__PURE__*/foo();`

        // switches: false,
        // (default: `true`) -- de-duplicate and remove unreachable `switch` branches

        // toplevel: false,
        // (default: `false`) -- drop unreferenced functions (`"funcs"`) and/or
        // variables (`"vars"`) in the top level scope (`false` by default, `true` to drop
        // both unreferenced functions and variables)

        // top_retain: null,
        // (default: `null`) -- prevent specific toplevel functions and
        // variables from `unused` removal (can be array, comma-separated, RegExp or
        // function. Implies `toplevel`)

        // typeofs: false,
        // (default: `true`) -- Transforms `typeof foo == "undefined"` into
        // `foo === void 0`.  Note: recommend to set this value to `false` for IE10 and
        // earlier versions due to known issues.

        // unsafe: false,
        // (default: `false`) -- apply "unsafe" transformations (discussion below)

        // unsafe_arrows: true,
        // (default: `false`) -- Convert ES5 style anonymous function
        // expressions to arrow functions if the function body does not reference `this`.
        // Note: it is not always safe to perform this conversion if code relies on the
        // the function having a `prototype`, which arrow functions lack.
        // This transform requires that the `ecma` compress option is set to `6` or greater.

        // unsafe_comps: false,
        // (default: `false`) -- Reverse `<` and `<=` to `>` and `>=` to
        // allow improved compression. This might be unsafe when an at least one of two
        // operands is an object with computed values due the use of methods like `get`,
        // or `valueOf`. This could cause change in execution order after operands in the
        // comparison are switching. Compression only works if both `comparisons` and
        // `unsafe_comps` are both set to true.

        // unsafe_Func: false,
        // (default: `false`) -- compress and mangle `Function(args, code)`
        // when both `args` and `code` are string literals.

        // unsafe_math: false,
        // (default: `false`) -- optimize numerical expressions like
        // `2 * x * 3` into `6 * x`, which may give imprecise floating point results.

        // unsafe_methods: false,
        // (default: false) -- Converts `{ m: function(){} }` to
        // `{ m(){} }`. `ecma` must be set to `6` or greater to enable this transform.
        // If `unsafe_methods` is a RegExp then key/value pairs with keys matching the
        // RegExp will be converted to concise methods.
        // Note: if enabled there is a risk of getting a "`<method name>` is not a
        // constructor" TypeError should any code try to `new` the former function.

        // unsafe_proto: false,
        // (default: `false`) -- optimize expressions like
        // `Array.prototype.slice.call(a)` into `[].slice.call(a)`

        // unsafe_regexp: false,
        // (default: `false`) -- enable substitutions of variables with
        // `RegExp` values the same way as if they are constants.

        // unused: true,
        // (default: `true`) -- drop unreferenced functions and variables (simple
        // direct variable assignments do not count as references unless set to `"keep_assign"`)

        // warnings: false,
        // (default: `false`) -- display warnings when dropping unreachable
        // code or unused declarations etc.
      },

      // mangle: false,
      mangle: {
        // reserved: [],
        keep_classnames: true,
        keep_fnames: false,
        safari10: false,
      },

      output: {
        // beautify: true, indent_level: 2, // comments: true,
        ast: false,
        code: true,
        safari10: false,
      },
      sourceMap: {
        content: fs.readFileSync(infile + '.map', 'utf8'),
        url: outmapfile,
        filename: outjsfile,
      },
    })

    var outdir = 'out/'
    console.log('write', outdir + outjsfile)
    return Promise.all([
      writefile(outdir + outjsfile, result.code, 'utf8'),
      writefile(outdir + outmapfile, result.map, 'utf8'),
    ])
  })  
}


main()
