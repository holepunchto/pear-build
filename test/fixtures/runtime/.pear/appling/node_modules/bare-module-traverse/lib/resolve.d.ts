import { module } from 'bare-module-resolve'
import { addon } from 'bare-addon-resolve'

import defaultResolve from './resolve/default'
import bare from './resolve/bare'
import node from './resolve/node'

export { module, addon, defaultResolve as default, bare, node }
