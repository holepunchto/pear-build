# url-file-url

Small module that converts from URLs to filenames to URLs

```
npm install url-file-url
```

Useful for embedded runtimes with no `url` module.

## Usage

``` js
const { fileURLToPath, pathToFileURL } = require('url-file-url')

pathToFileURL('/foo/bar') // file:///foo/bar
fileURLToPath('file:///foo/bar') // /foo/bar
```

## License

Apache-2.0
