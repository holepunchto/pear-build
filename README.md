# pear-build

> Build appling for a Pear application

```
npm install -g pear-build
```

## Usage

Create a build dir outside the project root.

```
pear-build --package=./my-app/package.json --darwin-arm64-app ./my-app/dist/macos/Keet.app --linux-x64-app=./my-linux-build/Keet.AppImage --target=./my-build
```

## License

Apache-2.0
