# pear-build

> Build appling for a Pear application

## Usage

```js
import build from 'pear-build'
```

```js
function status(info) {
  console.log(info)
}
const link = 'pear://....'
const stream = build({ link, dir: os.cwd() })
stream.on('data', status)
```

## License

Apache-2.0