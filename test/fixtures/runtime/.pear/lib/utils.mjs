import prettyBytes from 'prettier-bytes'

export function encode(msg) {
  return JSON.stringify(msg)
}

export function decode(msg) {
  return JSON.parse(msg.toString())
}

export function format(u) {
  return {
    speed: prettyBytes(u.downloadSpeed()) + '/s',
    peers: u.drive.core.peers.length,
    progress: u.downloadProgress
  }
}
