# pear-build

> Build appling for a Pear application

```
npm install -g pear-build
```

## Usage

Create a build dir outside the project root.

```bash
pear-build \
    --package=./my-app/package.json \
    --darwin-arm64-app ./my-app/MyApp-darwin-arm64/MyApp.app \
    --linux-x64-app=./my-app/MyApp-linux-x64/MyApp.AppImage \
    --target=./my-build
```

## License

Apache-2.0
