# TODO OUTDATED README, UPDATE

# ECS.JS

ECS.JS is a lightweight, flexible implementation of the Entity-Component-System (ECS) architecture pattern,
designed for game development and simulations.

This architectural pattern decouples logic and state, facilitating easier game updates, maintenance, and scalability.

[More about ECS](https://prdeving.wordpress.com/2023/12/14/deep-diving-into-entity-component-system-ecs-architecture-and-data-oriented-programming/)

## General Overview

### In the ECS architecture:

Entities are general-purpose objects identified by unique IDs.
They act as containers for components but do not contain behavior or state themselves.

Components are plain data structures that contain state but no logic.
They can represent anything from the position of an entity in space to its health or relationships.

Systems contain logic and operate on entities that have a specific set of components, thus implementing behavior.


### Functional Description

ECS.JS provides a framework to efficiently manage entities, components, and systems, allowing for
dynamic composition and operation on game objects.

ECS.JS is designed as an Indexed Spare set ECS solution, meaning iteration is pretty cheap but modification tends to be more costly.
This library implements an Archetype-based mask segregation and defferred deletes/index updates so entities can be efficiently treated without compromising performance.

 - Entities

Entities are essentially IDs that aggregate components.
They serve as the subjects for systems to operate on.

An entity can have multiple components but no duplicate component types.

- Components

Components are data containers. For example, a Position component might store x and y coordinates,
while a Health component might store hit points.

- Systems
Systems implement behavior by operating on entities with specific component configurations.
For instance, a movement system might update the positions of all entities with Position and Velocity components.

ECS.JS is designed so any interaction with a component data has be made through systems.

- Archetypes

Archetypes are a set of component types. Entities are grouped into archetypes based on their component makeup,
optimizing system operations on similar entities.

Archetypes are used under the hood to speed everything up.


## API Documentation

### Component

Components are a fundamental piece in ECS.JS, it'll be used to set and access entities components

**ComponentInstance constructor**

#### Component(componentName(optional) : String, temlate(optional) : Object<String, Primitive>) -> ComponentInstance

Returns a Component closure, the template provided is used to fill default values.
If no template is provided, the component will be considered a Tag

The componentName parameter will be used to generate the component id so it can be consistent enough to be used through network.

    ```
    import { Component } from 'ecs.js'

    const TagComponent = Component()

    const TestComponent = Component({
        foo: 1,
    })

    const TestNamedComponent = Component('test-component', {
        foo: 1,
    })
    ```

**ComponentInstance Values**

##### ComponentInstance.id : String

The ComponentInstance ID

    ```
    import { Component } from 'ecs.js'

    const TestComponent = Component({
        foo: 1,
    })

    console.log(TestComponent.id)
    ```

##### ComponentInstance.keys : Object<String, Number>

The keys to access the components data. ECS.JS stores components data as arrays, to access the data, the key index is needed.

    ```
    import { Component } from 'ecs.js'

    const TestComponent = Component({
        foo: 1,
    })

    console.log(TestComponent.keys.foo) // the index for the 'foo' value inside the component data
    ```

**ComponentInstance Methods**

##### ComponentInstance(data(optional) : Object<String, Any>) -> ComponentDefinition

The componentInstance is the piece that's used with the ECS.JS instance. data parameter will be used to fill the template provided in the Component definition.

Only template keys are set, any other key/value in the data param will be ignored.


    ```
    import { Component } from 'ecs.js'

    const TestComponent = Component({
        foo: 1,
    })
    const FOO_IDX = TestComponent.keys.foo

    const test = TestComponent({
        foo: 1337
    })

    console.log(test.data[FOO_IDX])
    ```


### ECS

ECS is the core of ECS.JS, it'll generate a new world instance

**ComponentInstance constructor**

#### ECS(...components : ComponentInstance) : ECSInstance

Initializes the ECS instance and registers any components passed as arguments.

```
import ECS from 'ecs.js'

const ecs = ECS(TestComponent, TestTagComponent, TestNamedComponent)
```

**ECSInstance Values**

##### ECSInstance.entities : Array<Number>

An array with the components mask for each of the entities, it can be used to iterate them. Not recomended tho

```
import ECS from 'ecs.js'

const ecs = ECS(TestComponent, TestTagComponent, TestNamedComponent)

...

ecs.entities.forEach((mask, index) => console.log(`Entity ${index} with mask ${mask}`))
```

##### ECSInstance.components : Array< Array< Array<Any> OR undefined > >

The handle for the ecs components for each entity, it returns an array containing an array for every registered component.

Each of the component array contains an array with every registered entity wich contains the component's data for said entity.

```
import ECS from 'ecs.js'

const ecs = ECS(TestComponent, TestTagComponent, TestNamedComponent)

...

const components = ecs.components
const component0 = components[0]

component0.forEach((data, entity) => console.log(`Component0 for entity ${entity} is ${data}`))
```


##### ECSInstance.archetypes : Map<Number, Array<Number>>

Archetypes are indices that, given a components mask, points to every entity implementing said mask.

**ECSInstance Methods**

##### ECSInstance.spawn(data : Array<ComponentDefinition>) : void

Registers a new entity in the ECSInstance context.

```
import ECS from 'ecs.js'

const ecs = ECS(TestComponent, TestTagComponent, TestNamedComponent)

ecs.spawn([
    TestTagComponent(),
    TestComponent({ foo: 1234 })
])

console.log(ecs.entities.length) // 1
```

##### ECSInstance.entity(entityId : Number) : EntityHandle

returns a handle to an entity, it's used to read or modify the entity in a simple manner

##### EntityHandle.get(component : ComponentInstance) : Array<Any>

returns the components data for the handled entity. This is a valid way of getting data from entities, but it's not the most performant one, check out ecs.component(ComponentInstance) bellow

Data is returned as an array for performance reasons, you can access it using ComponentInstance.keys indexes

```
ecs.entities.forEach((_, entity) => {
    const foo = ecs.entity(entity).get(TestComponent)[FOO_IDX]
    console.log(foo)
})
```

##### EntityHandle.has(component : ComponentInstance) : Boolean

returns true if the entity has the component

```
ecs.entities.forEach((_, entity) => {
    const hasTag = ecs.entity(entity).has(TestTagComponent)
    console.log(hasTag)
})
```

##### EntityHandle.add(component : ComponentDefinition)

Adds a component to the entity.

```
ecs.entity(e).add(TestComponent({
    foo: 4
}))
```

##### EntityHandle.remove(component : ComponentInstance)

Removes a component from the entity.

```
ecs.entity(e).remove(TestComponent)
```

##### ECSInstance.entity(entityID).kill()

Marks the entity for deletion in the next tick.

```
ecs.entity(e).kill()
```

##### ECSInstance.component(component : ComponentInstance) : Array< Array<Any> >

Returns an array with the component data for every single entity.

This is the recommended way of interacting with entities data.

```
const testComponent = ecs.component(testComponent)

testComponent.forEach(data => data[FOO_IDX]++)
```

##### ECSInstance.componentId(idx : Number) : String

Returns a component Id for a component index, this is used moslty in entity serialization for net transfer or persistance.

```
const toExport = {}

ecs.components((data, componentIndex) => {
    toExport[ecs.componentId(componentIndex)] = JSON.stringify(data)
})
```

##### ECSInstance.System(query : Array<ComponentInstance>, function : Function(ecs: ref ECSInstance, entities : Array<Number>, params : Object<Any>)) : Function(params : Any)

Registers a function as system for the ECS instance that operates on entities with a specific set of components (query).

The function will receive a reference to the ecs instance as first parameter and a reference to the queried entities id as second parameter.

The params parameter is carried from the invocation

```
const TestSystem = ecs.System([TestComponent], (ecs, entities, data) => {
    const testComponent = ecs.component(TestComponent)

    entities.forEach(e => {
        const foo = testComponent[e][FOO_IDX]
        console.log(foo++, data)
    })
})

TestSystem('Helloo')
```

if no query is provided, entities will be an empty array

##### ECSInstance.tick() : void

Processes system updates, handles entity deletions and archetype recalculations as needed.

The easiest way to handle it is by executing ecs.tick() in every frame. It's only needed if entities composition has changed tho,
adding/removing components or entities will require a .tick call to reprocess the archetypes.

```
function gameLoop() {
  ecs.tick()
  requestAnimationFrame(gameLoop)
}
```
