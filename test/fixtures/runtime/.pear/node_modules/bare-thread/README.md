# bare-thread

Thread support for Bare.

```
npm i bare-thread
```

## Usage

```js
const Thread = require('bare-thread')

const thread = new Thread(require.resolve('./entry'))

thread.join()
```

## License

Apache-2.0
