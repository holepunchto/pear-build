import appling from 'appling-native'

export async function preflight(id) {
  const lock = await appling.lock()

  let platform
  try {
    platform = await appling.resolve()
  } catch {
    return lock
  }

  if (platform.ready(`pear://${id}`) === false) return lock

  await lock.unlock()

  platform.launch(id)

  Bare.exit()
}
