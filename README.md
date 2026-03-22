# pear-build

> Build appling for a Pear application

```
npm install -g pear-build
```

## Supported platforms

* Linux: `linux-arm64`, `linux-x64`
* macOS: `darwin-arm64`, `darwin-x64`
* Windows: `win32-arm64`, `win32-x64`
* iOS: `ios-arm64`, `ios-arm64-simulator`, `ios-x64-simulator`
* Android: `android-arm64`

## Usage

Create a build dir outside the project root.

```bash
pear-build \
    --package=./my-app/package.json \
    --darwin-arm64-app ./my-app/MyApp-darwin-arm64/MyApp.app \
    --linux-x64-app=./my-app/MyApp-linux-x64/MyApp.AppImage \
    --target=./my-build
```

## Example

```bash
node bin.js \
    --package ./test/fixtures/hello-pear-electron/package.json \
    --darwin-arm64-app ./test/fixtures/hello-pear-electron/out/HelloPear-darwin-arm64/HelloPear.app \
    --darwin-x64-app ./test/fixtures/hello-pear-electron/out/HelloPear-darwin-x64/HelloPear.app \
    --linux-arm64-app ./test/fixtures/hello-pear-electron/out/HelloPear-linux-arm64/HelloPear.AppImage \
    --linux-x64-app ./test/fixtures/hello-pear-electron/out/HelloPear-linux-x64/HelloPear.AppImage \
    --win32-x64-app ./test/fixtures/hello-pear-electron/out/HelloPear-win32-x64/HelloPear.msix \
    --win32-arm64-app ./test/fixtures/hello-pear-electron/out/HelloPear-win32-arm64/HelloPear.msix \
    --ios-arm64 ./test/fixtures/hello-pear-react-native/ota/ios/HelloPear \
    --ios-arm64-simulator ./test/fixtures/hello-pear-react-native/ota/ios/HelloPear \
    --ios-x64-simulator ./test/fixtures/hello-pear-react-native/ota/ios/HelloPear \
    --android-arm64 ./test/fixtures/hello-pear-react-native/ota/android/HelloPear \
    --target ./my-build
```

`$ tree my-build/`

```bash
my-build/
├── by-arch
│   ├── android-arm64
│   │   └── app
│   │       └── HelloPear
│   │           └── app.bundle
│   ├── darwin-arm64
│   │   └── app
│   │       └── HelloPear.app
│   ├── darwin-x64
│   │   └── app
│   │       └── HelloPear.app
│   ├── ios-arm64
│   │   └── app
│   │       └── HelloPear
│   │           └── app.bundle
│   ├── ios-arm64-simulator
│   │   └── app
│   │       └── HelloPear
│   │           └── app.bundle
│   ├── ios-x64-simulator
│   │   └── app
│   │       └── HelloPear
│   │           └── app.bundle
│   ├── linux-arm64
│   │   └── app
│   │       └── HelloPear.AppImage
│   ├── linux-x64
│   │   └── app
│   │       └── HelloPear.AppImage
│   ├── win32-arm64
│   │   └── app
│   │       └── HelloPear.msix
│   └── win32-x64
│       └── app
│           └── HelloPear.msix
└── package.json
```

## License

Apache-2.0
