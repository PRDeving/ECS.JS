import { uuid } from './crypto.js'

export const Component = (template = {}) => {
    const id = uuid()
    const keys = Object.keys(template).sort()

    const fn = data => ({ id, data: keys.map(k => data ? data[k] : false) })
    fn.id = id
    fn.keys = keys.reduce((l, k, idx) => {
        l[k] = idx
        return l
    }, {})
    return fn
}
