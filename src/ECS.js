import { Component as ComponentSchema } from './component.js'
import { PRIMITIVE_TYPE as TYPE } from './types.js'

const AliveComponent = ComponentSchema('AliveComponent')

export const ECS = (...c) => {
    const entities = []
    const components = []
    const componentIdToIdx = {}
    const idxToComponentId = []
    const archetypes = {}

    let tickDeletes = []
    const toDelete = []
    let processArchetypes = false

    const registerComponent = (...schemas) => schemas.forEach(schema => {
        const idx = components.push([]) - 1
        componentIdToIdx[schema.id] = idx
        idxToComponentId[idx] = schema.id
    })

    registerComponent(AliveComponent, ...c)
    const aliveComponentIdx = componentIdToIdx[AliveComponent.id]

    const spawn = (...ass) => ass.forEach(cs => {
        const id = toDelete.length ? toDelete.shift() : (entities.push(0) - 1)

        components[aliveComponentIdx][id] = true
        entities[id] = cs.reduce((l, component) => {
            const idx = componentIdToIdx[component.id]
            components[idx][id] = component.data
            l |= 1 << idx
            return l
        }, 0)
        processArchetypes = true
    })

    const Archetype = (mask) => {
        if (!archetypes[mask]) archetypes[mask] = []
        archetypes[mask].length = 0
        entities.forEach((m, idx) => ((mask & m) == mask) && archetypes[mask].push(idx))
        return { mask }
    }

    const maskFromComponents = (cs) => cs.reduce((mask, c) => {
        mask |= 1 << componentIdToIdx[c.id]
        return mask
    }, 0)

    function System (cs, fn) {
        const mask = maskFromComponents(cs)
        const archetype = Archetype(mask)
        return (args) => fn(this, archetypes[archetype.mask], args)
    }

    return {
        entities,
        components,
        archetypes,

        spawn,
        entity: e => ({
            has: c => {
                const idx = componentIdToIdx[c.id]
                return !!components[idx][e]
            },
            get: c => {
                const idx = componentIdToIdx[c.id]
                return components[idx][e]
            },
            add: c => {
                const idx = componentIdToIdx[c.id]
                components[idx][e] = c.data
                entities[e] |= 1 << idx
                processArchetypes = true
            },
            remove: c => {
                const idx = componentIdToIdx[c.id]
                components[idx][e] = false
                entities[e] &= ~(1 << idx)
                processArchetypes = true
            },
            kill: () => {
                components[aliveComponentIdx][e] = false
                tickDeletes.push(e)
            }
        }),

        System,
        componentId: idx => idxToComponentId[idx],
        component: c => components[componentIdToIdx[c.id]],
        tick: () => {
            tickDeletes.forEach(idx => {
                components.forEach(c => delete c[idx])
                entities[idx] = 0
            })
            toDelete.push(...tickDeletes)
            if (tickDeletes.length || processArchetypes) Object.keys(archetypes).forEach(Archetype)
            tickDeletes = []
        }
    }
}
