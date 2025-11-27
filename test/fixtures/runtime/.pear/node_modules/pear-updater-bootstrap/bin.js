#!/usr/bin/env node

const bootstrap = require('./')

console.log('Bootstrapping, please wait...')
bootstrap(process.argv[2], process.argv[3]).then(() => {
  console.log('Done!')
})
