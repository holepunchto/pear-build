'use strict'
const hypercoreid = require('hypercore-id-encoding')

exports.ALIASES = {
  pear: hypercoreid.decode(
    'pzcjqmpoo6szkoc4bpkw65ib9ctnrq7b6mneeinbhbheihaq6p6o'
  ),
  keet: hypercoreid.decode(
    'oeeoz3w6fjjt7bym3ndpa6hhicm8f8naxyk11z4iypeoupn6jzpo'
  ),
  runtime: hypercoreid.decode(
    'qz5ihrqfmwtp4q36hnjaht1edur6c7w11dbb7ym9jqaex71wogso'
  ),
  doctor: hypercoreid.decode(
    'fs1xuyzx6c9mu6zu6t5ubhkcbzz913h814te9ay9zzbc9hzf15fo'
  ),
  templates: hypercoreid.decode(
    'z7n5sgqipwaejgonu6hh4baw95imy8dicj8678tej98itbs9tcgy'
  ),
  electron: hypercoreid.decode(
    'cktxzetiwt6un3ado5kgqedge6ya4nfazjckzq76zcapefwxakdy'
  ),
  pass: hypercoreid.decode(
    'tywsat7gz8m65ejx4zjn3773pbdc4j8m66tukis8dgzekraymtzo'
  )
}

exports.EOLS = {
  keet: [
    hypercoreid.decode('jc38t9nr7fasay4nqfxwfaawywfd3y14krnsitj67ymoubiezqdy')
  ],
  pear: [
    hypercoreid.decode('pqbzjhqyonxprx8hghxexnmctw75mr91ewqw5dxe1zmntfyaddqy')
  ]
}
