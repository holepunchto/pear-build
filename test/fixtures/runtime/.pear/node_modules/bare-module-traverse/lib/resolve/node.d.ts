import { type Import } from 'bare-module-lexer'
import { type ResolveOptions, type Resolver } from 'bare-addon-resolve'

interface NodeResolveOptions extends ResolveOptions {
  platform?: string
  arch?: string
  simulator?: boolean
  host?: string
  hosts?: string[]
}

declare function resolve(entry: Import, parentURL: URL, opts?: NodeResolveOptions): Resolver

declare namespace resolve {
  export { type NodeResolveOptions }
}

export = resolve
