# dependency-stream

Analyse and list all dependencies of an entrypoint as a stream

```
npm install dependency-stream
```

## Usage

``` js
const DependencyStream = require('dependency-stream')

const d = new DependencyStream(drive, {
  entrypoint: '.', // thats the entrypoint to resolve
  preload: true, // preload as much as possible
  source: false, // include source in results
  strict: false, // if true, fail if something cannot be resolved
  conditions: [], // what conditions to apply to export maps
  builtins: setOrArray // set to the builtin modules of your runtime
})

for await (const data of d) {
  console.log(data) // the resolved dep
}
```

## License

Apache-2.0
