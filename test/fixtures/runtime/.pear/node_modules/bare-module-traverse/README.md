# bare-module-traverse

Low-level module graph traversal for Bare. The algorithm is implemented as a generator function that yields either modules to be read, prefixes to be listed, child dependencies to be traversed, or resolved dependencies of the module graph. As a convenience, the main export is a synchronous and asynchronous iterable that relies on modules being read and prefixes being listed by callbacks. For asynchronous iteration, the callbacks may return promises which will be awaited before being passed to the generator.

```
npm i bare-module-traverse
```

## Usage

For synchronous traversal:

```js
const traverse = require('bare-module-traverse')

function readModule(url) {
  // Read `url` if it exists, otherwise `null`
}

function* listPrefix(url) {
  // Yield URLs that have `url` as a prefix. The list may be empty.
}

for (const dependency of traverse(new URL('file:///directory/file.js'), readModule, listPrefix)) {
  console.log(dependency)
}
```

For asynchronous traversal:

```js
const traverse = require('bare-module-traverse')

async function readModule(url) {
  // Read `url` if it exists, otherwise `null`
}

async function* listPrefix(url) {
  // Yield URLs that have `url` as a prefix. The list may be empty.
}

for await (const dependency of traverse(
  new URL('file:///directory/file.js'),
  readModule,
  listPrefix
)) {
  console.log(dependency)
}
```

## API

#### `const dependencies = traverse(url[, options], readModule[, listPrefix])`

Traverse the module graph rooted at `url`, which must be a WHATWG `URL` instance. `readModule` is called with a `URL` instance for every module to be read and must either return the module source, if it exists, or `null`. `listPrefix` is called with a `URL` instance of every prefix to be listed and must yield `URL` instances that have the specified `URL` as a prefix. If not provided, prefixes won't be traversed. If `readModule` returns a promise or `listPrefix` returns a promise generator, synchronous iteration is not supported.

Options include:

```js
options = {
  defaultType: constants.SCRIPT,
  resolve: resolve.default
}
```

Options supported by <https://github.com/holepunchto/bare-module-resolve> and <https://github.com/holepunchto/bare-addon-resolve> may also be specified.

#### `for (const dependency of dependencies)`

Synchronously iterate the module graph. Each yielded dependency has the following shape:

```js
dependency = {
  url: URL,
  source: 'string' | Buffer, // Source as returned by `readModule()`
  imports: {
    // See https://github.com/holepunchto/bare-module#imports
  },
  lexer: {
    imports: [
      // See https://github.com/holepunchto/bare-module-lexer#api
    ]
  }
}
```

#### `for await (const dependency of dependencies)`

Asynchronously iterate the module graph. If `readModule` returns a promise or `listPrefix` returns a promise generator, these will be awaited. The same comments as `for (const dependency of dependencies)` apply.

### Resolution

Module and addon resolution is configurable by providing a resolver function. A resolver function is a generator function that yields values matching the shapes defined by <https://github.com/holepunchto/bare-module-resolve#algorithm>. Several resolvers are provided out of the box to support the most common use cases.

#### `resolve.module`

Convenience export from <https://github.com/holepunchto/bare-module-resolve>.

#### `resolve.addon`

Convenience export from <https://github.com/holepunchto/bare-addon-resolve>.

#### `resolve.default`

The default resolver, which simply forwards to <https://github.com/holepunchto/bare-module-resolve> and <https://github.com/holepunchto/bare-addon-resolve> with the literal options passed by the caller.

#### `resolve.bare`

The Bare resolver, which matches the options used by the Bare module system. The resolver accepts the following additional options:

```js
options = {
  platform: Bare.platform,
  arch: Bare.arch,
  simulator: false,
  host: `${platform}-${arch}${simulator ? '-simulator' : ''}`,
  hosts: [host]
}
```

For single target traversal it is sufficient to pass `platform`, `arch`, `simulator`, and/or `host`. For multi target traversal pass a list of `hosts` identifiers instead.

#### `resolve.node`

The Node.js resolver, which matches the options used by the Node.js module system. The resolver accepts the following additional options:

```js
options = {
  platform: process.platform,
  arch: process.arch,
  simulator: false,
  host: `${platform}-${arch}${simulator ? '-simulator' : ''}`,
  hosts: [host]
}
```

For single target traversal it is sufficient to pass `platform`, `arch`, `simulator`, and/or `host`. For multi target traversal pass a list of `hosts` identifiers instead.

### Algorithm

The following generator functions implement the traversal algorithm. The yielded values have the following shape:

**Source module**

```js
next.value = {
  module: URL
}
```

**File prefix**

```js
next.value = {
  prefix: URL
}
```

**Dependency subgraph**

```js
next.value = {
  children: Generator
}
```

**Dependency node**

```js
next.value = {
  dependency: {
    url: URL,
    source: 'string' | Buffer,
    imports: {
      // See https://github.com/holepunchto/bare-module#imports
    },
    lexer: {
      imports: [
        // See https://github.com/holepunchto/bare-module-lexer#api
      ]
    }
  }
}
```

To drive the generator functions, a loop like the following can be used:

```js
const queue = [traverse.module(url, source, artifacts, visited)]

while (queue.length > 0) {
  const generator = queue.pop()

  let next = generator.next()

  while (next.done !== true) {
    const value = next.value

    if (value.module) {
      // Read `value.module` if it exists, otherwise `null`
      let source

      next = generator.next(source)
    } else if (value.prefix) {
      // List the modules that have `value.prefix` as a prefix
      let modules

      next = generator.next(modules)
    } else {
      if (value.children) {
        queue.push(value.children)
      } else {
        const dependency = value.dependency
      }

      next = generator.next()
    }
  }
}
```

Options are the same as `traverse()` for all functions.

> [!WARNING]
> These functions are currently subject to change between minor releases. If using them directly, make sure to specify a tilde range (`~1.2.3`) when declaring the module dependency.

#### `const generator = traverse.module(url, source, attributes, artifacts, visited[, options])`

#### `const generator = traverse.package(url, source, artifacts, visited[, options])`

#### `const generator = traverse.preresolved(url, source, resolutions, artifacts, visited[, options])`

#### `const generator = traverse.imports(parentURL, source, imports, artifacts, visited[, options])`

#### `const generator = traverse.addons(parentURL, artifacts, visited[, options])`

#### `const generator = traverse.assets(patterns, parentURL, artifacts, visited[, options])`

## License

Apache-2.0
