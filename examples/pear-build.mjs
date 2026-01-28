import pearBuild from '..'
import path from 'bare-path'
import { fileURLToPath } from 'bare-url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dotPear = path.resolve(__dirname, '..', 'test', 'fixtures', 'runtime', '.pear')
const stream = await pearBuild({ dotPear })
stream.on('data', (info) => console.log(info))
