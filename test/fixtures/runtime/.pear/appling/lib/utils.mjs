import prettyBytes from 'prettier-bytes'

export function encode(msg) {
  return JSON.stringify(msg)
}

export function decode(msg) {
  return JSON.parse(msg.toString())
}

export function format(u) {
  if (u.drive?.core) {
    return {
      speed: prettyBytes(u.downloadSpeed()) + '/s',
      progress: u.downloadProgress,
      peers: u.drive.core.peers.length,
      bytes: u.downloadedBytes
    }
  }

  return {
    speed: u.downloadSpeed === 0 ? undefined : prettyBytes(u.downloadSpeed) + '/s',
    progress: u.downloadProgress === 0 ? undefined : u.downloadProgress,
    peers: u.peers === 0 ? undefined : u.peers,
    bytes: u.downloadedBytes
  }
}
