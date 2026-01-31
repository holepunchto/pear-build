# pear-build

> Build appling for a Pear application

```
npm install pear-build
```

## Usage

```js
import build from 'pear-build'
```

```js
function status(info) {
  console.log(info)
}
const dotPear = path.join(cwd(), '.pear')
const stream = build({ dotPear })
stream.on('data', status)
```

## License

Apache-2.0
