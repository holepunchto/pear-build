import bareBuild from 'bare-build'
import path from 'bare-path'
import { arch, platform } from 'which-runtime'

const base = path.join('test', 'fixtures', 'runtime', '.pear', 'appling')
const entry = path.join(base, 'app.cjs')
const opts = {
  name: 'Runtime',
  target: [`${platform}-${arch}`],
  package: false,
  standalone: false,
  base,
  out: '.'
}
for await (const resource of bareBuild(entry, opts)) {
  console.log(resource)
}
