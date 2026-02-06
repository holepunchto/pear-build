const Hyperdrive = require('hyperdrive')
const Hyperswarm = require('hyperswarm')
const HypercoreID = require('hypercore-id-encoding')
const Corestore = require('corestore')
const DeviceFile = require('device-file')
const Updater = require('pear-updater')
const path = require('path')
const fs = require('fs/promises')

module.exports = async function bootstrap(
  key,
  directory = 'pear',
  {
    lock = true,
    bootstrap,
    onupdater = null,
    onapply = null,
    length = 0,
    fork = 0,
    force = false,
    host
  } = {}
) {
  if (!key) throw new Error('key is required')

  const corestore = new Corestore(path.join(directory, 'corestores/platform'))
  const checkout = { key: HypercoreID.normalize(key), length, fork }

  const current = path.join(directory, 'current')

  const u = new Updater(new Hyperdrive(corestore, checkout.key), {
    directory,
    checkout,
    lock: lock ? path.join(directory, 'lock') : null,
    force,
    swap: force ? await fs.realpath(current) : undefined,
    host,
    onapply
  })

  const swarm = new Hyperswarm({ bootstrap })

  await u.ready()

  const topic = swarm.join(u.drive.discoveryKey, { server: false, client: true })
  swarm.on('connection', (c) => corestore.replicate(c))

  let serving = false

  // TODO: add an option for this in swarm
  swarm.dht.on('nat-update', function () {
    if (!swarm.dht.randomized && !serving) {
      serving = true
      swarm
        .join(u.drive.discoveryKey, { server: true, client: false })
        .flushed()
        .then(() => topic.destroy())
    }
  })

  if (onupdater !== null) onupdater(u)

  await u.wait({ ...checkout, length: 1 })

  await swarm.destroy()
  await corestore.close()

  return await u.applyUpdate()
}

module.exports.validate = function (directory) {
  return DeviceFile.validate(path.join(directory, 'corestores/platform/CORESTORE'))
}
