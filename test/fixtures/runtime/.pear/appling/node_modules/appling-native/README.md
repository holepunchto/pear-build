# appling-native

<https://github.com/holepunchto/libappling> bindings for Bare.

## API

### `App`

#### `const app = new appling.App(id[, path])`

Construct an application descriptor for the application identified by `id` and an entry point of `path`. If not specified the current executable path is used.

```js
const app = new appling.App('keet')
```

#### `app.path`

The full path to the application.

#### `app.id`

The identifier of the application.

#### `app.open([argument])`

Open the app and pass it an optional argument, such as a `pear://` invite link.

```js
app.open('pear://keet/<invite>')
```

### `Lock`

#### `const lock = await appling.lock([directory])`

Grab a lock on the Pear platform installation at `directory`.

```js
using lock = await appling.lock()

console.log(lock.dir)
```

#### `lock.dir`

The full path to the locked platform directory.

#### `lock.unlock()`

Release and close the lock.

#### `lock[Symbol.dispose]()`

Calls `lock.unlock()`.

### `Link`

#### `const link = appling.parse(input[, encoding])`

Parse `input` as a link. If `input` is a `Buffer` `encoding` may be passed.

#### `link.id`

The ID of the link.

#### `link.data`

The optional data of the link.

### `Platform`

#### `const platform = await appling.resolve([directory])`

Resolve the Pear platform installation at `directory`. If not specified the default location is used. An exception will be thrown if no viable platform installation is found.

```js
try {
  const platform = await appling.resolve()

  console.log(platform.path)
} catch {
  // No platform found
}
```

#### `platform.path`

The full path to the platform installation.

#### `const result = platform.ready(link)`

Check if the application identified by `link` is ready to launch. `link` may be a string, in which case it will be parsed first. If `false` is returned preflight should be run.

```js
if (platform.ready('pear://keet')) {
  // Launch Keet
} else {
  // Run preflight for Keet
}
```

#### `platform.preflight(link[, callback])`

Run preflight for the application identified by `link`. `link` may be a string, in which case it will be parsed first.

```js
platform.preflight('pear://keet')
```

#### `platform.launch(app[, link])`

Launch `app` with `link`. `link` may be a string, in which case it will be parsed first. If not specified `pear://${app.id}` is used. This call will not return on success.

```js
const app = new appling.App('keet')

platform.launch(app, 'pear://keet/<invite>')
```

## License

Apache-2.0
