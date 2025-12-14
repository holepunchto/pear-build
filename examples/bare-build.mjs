import build from 'bare-build'
import path from 'bare-path'
import { arch, platform } from 'which-runtime'

const entry = path.join('test', 'fixtures', 'runtime', '.pear', 'appling', 'app.cjs')
const opts = {
  target: [`${platform}-${arch}`],
  package: true,
  out: '.'
}
for await (const resource of build(entry, opts)) {
  console.log(resource)
}
