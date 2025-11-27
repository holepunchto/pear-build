# drive-bundler

Extract bundles from drives

```
npm install drive-bundler
```

## Usage

``` js
const DriveBundler = require('drive-bundler')

const b = new DriveBundler(drive)

const { entrypoint, resolutions, sources } = await b.bundle('/my-entrypoint.js')
```

## License

Apache-2.0
