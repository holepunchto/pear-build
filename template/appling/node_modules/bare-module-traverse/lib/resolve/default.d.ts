import { type Import } from 'bare-module-lexer'
import { type ResolveOptions, type Resolver } from 'bare-addon-resolve'

declare function resolve(entry: Import, parentURL: URL, opts?: ResolveOptions): Resolver

export = resolve
