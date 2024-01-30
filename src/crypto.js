export { v4 as uuid } from 'uuid'
import hash from 'md5'

export const checksum = (data) => hash(JSON.stringify(data))

export { hash }

