import bareBuild from 'bare-build'
import path from 'bare-path'
import { arch, platform } from 'which-runtime'
import { spawnSync } from 'bare-subprocess'

const dotPear = path.join('test', 'fixtures', 'runtime', '.pear')
const entry = path.join(dotPear, 'appling', 'app.cjs')
const iconFile = platform === 'darwin' ? 'icon.icns' : 'icon.png'
const iconPath = path.join(dotPear, 'brand', 'icons', platform, iconFile)
const opts = {
  name: 'Runtime',
  hosts: [`${platform}-${arch}`],
  icon: iconPath,
  package: false,
  standalone: false,
  base: dotPear,
  out: '.'
}
const npm = platform === 'win32' ? 'npm.cmd' : 'npm'
spawnSync(npm, ['install'], { cwd: dotPear, stdio: 'inherit' })
for await (const resource of bareBuild(entry, opts)) {
  console.log(resource)
}
