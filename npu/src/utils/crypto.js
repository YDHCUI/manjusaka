

import { sha256 as sha256Hex } from 'js-sha256'

export function sha256(text) {
  return sha256Hex(text || '')
}
