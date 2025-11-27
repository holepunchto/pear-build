# fx-native

<https://github.com/holepunchto/libfx> bindings for JavaScript.

```sh
npm install fx-native
```

## Usage

See [`example/`](example).

## API

### Application

#### `const app = App.shared()`

#### `app.isMain`

#### `app.isWorker`

#### `app.isRunning`

#### `app.isSuspended`

#### `app.run()`

> :warning: Only has an effect on the main thread.

#### `app.broadcast(buffer)`

#### `app.destroy()`

#### `app.on('launch')`

#### `app.on('terminate')`

#### `app.on('message', buffer)`

### Screen

> :warning: Only available on the main thread.

#### `const screen = Screen.main()`

#### `screen.getBounds()`

### Window

> :warning: Only available on the main thread.

#### `const window = new Window(x, y, width, height[, options])`

Options include:

```js
options = {
  frame: true
}
```

#### `window.isVisible`

#### `window.isClosed`

#### `window.appendChild(child)`

#### `window.removeChild(child)`

#### `window.getBounds()`

#### `window.show()`

#### `window.hide()`

#### `window.activate()`

#### `window.destroy()`

#### `window.on('resize', width, height)`

#### `window.on('move', x, y)`

#### `window.on('minimize')`

#### `window.on('deminimize')`

#### `window.on('close')`

#### `window.on('show')`

#### `window.on('hide')`

### Node

#### `node.isAttached`

#### `node.isDestroyed`

#### `node.appendChild(child)`

#### `node.removeChild(child)`

#### `node.destroy()`

#### `node.on('attach')`

#### `node.on('detach')`

#### `node.on('destroy')`

### View

Extends [`Node`](#node).

> :warning: Only available on the main thread.

#### `const view = new View(x, y, width, height)`

#### `view.getBounds()`

#### `view.setBounds(x, y, width, height)`

### Text

Extends [`Node`](#node).

> :warning: Only available on the main thread.

#### `const text = new Text(x, y, width, height)`

#### `text.getBounds()`

#### `text.getBoundsUsed()`

#### `text.setBounds(x, y, width, height)`

### Image

Extends [`Node`](#node).

> :warning: Only available on the main thread.

#### `const image = new Image(x, y, width, height)`

#### `image.getBounds()`

#### `image.setBounds(x, y, width, height)`

#### `image.loadFile(path)`

#### `image.loadPixels(pixels, width, height[, stride])`

### Web View

Extends [`Node`](#node).

> :warning: Only available on the main thread.

#### `const webView = new WebView(x, y, width, height)`

#### `webView.getBounds()`

#### `webView.setBounds(x, y, width, height)`

#### `webView.postMessage(json)`

#### `webView.loadURL(url)`

#### `webView.loadHTML(html)`

#### `webView.on('message', json)`

## License

Apache-2.0
