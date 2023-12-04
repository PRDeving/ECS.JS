export const LOG_LEVEL = { ERROR: 1 }

export const log = (type, ...msg) => {
    console.log(...msg)
    return false
}
