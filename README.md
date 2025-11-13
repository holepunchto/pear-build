# pear-build

> Build appling for a Pear application

## Usage

```js
import build from 'pear-build'
```

```js
function status (info) { console.log(info) }
const dir = os.cwd()
const stream = build({ dir })
stream.on('data', status)
```

## License

Apache-2.0