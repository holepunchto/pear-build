const path = require('path')
const { isWindows } = require('which-runtime')

exports.fileURLToPath = function fileURLToPath (url) {
  if (typeof url === 'string') {
    url = new URL(url)
  }

  if (url.protocol !== 'file:') {
    throw new Error('The URL must use the file: protocol')
  }

  if (isWindows) {
    if (/%2f|%5c/i.test(url.pathname)) {
      throw new Error('The file: URL path must not include encoded \\ or / characters')
    }
  } else {
    if (url.hostname) {
      throw new Error('The file: URL host must be \'localhost\' or empty')
    }

    if (/%2f/i.test(url.pathname)) {
      throw new Error('The file: URL path must not include encoded / characters')
    }
  }

  const pathname = path.normalize(decodeURIComponent(url.pathname))

  if (isWindows) {
    if (url.hostname) return '\\\\' + url.hostname + pathname

    const letter = pathname.charCodeAt(1) | 0x20

    if (letter < 0x61 /* a */ || letter > 0x7a /* z */ || pathname.charCodeAt(2) !== 0x3a /* : */) {
      throw new Error('The file: URL path must be absolute')
    }

    return pathname.slice(1)
  }

  return pathname
}

exports.pathToFileURL = function pathToFileURL (pathname) {
  let resolved = path.resolve(pathname)

  if (pathname[pathname.length - 1] === '/') {
    resolved += '/'
  } else if (isWindows && pathname[pathname.length - 1] === '\\') {
    resolved += '\\'
  }

  resolved = resolved
    .replaceAll('%', '%25') // Must be first
    .replaceAll('#', '%23')
    .replaceAll('?', '%3f')
    .replaceAll('\n', '%0a')
    .replaceAll('\r', '%0d')
    .replaceAll('\t', '%09')

  if (!isWindows) {
    resolved = resolved.replaceAll('\\', '%5c')
  }

  return new URL('file:' + resolved)
}
