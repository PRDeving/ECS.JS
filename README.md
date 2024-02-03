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

#### constructor Component(componentName(optional) : String, temlate(optional) : Object<String, Primitive>) -> ComponentInstance

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

##### ComponentInstance Values

**id**

The ComponentInstance ID

    ```
    import { Component } from 'ecs.js'

    const TestComponent = Component({
        foo: 1,
    })

    console.log(TestComponent.id)
    ```

**keys**

The keys to access the components data. ECS.JS stores components data as arrays, to access the data, the key index is needed.

    ```
    import { Component } from 'ecs.js'

    const TestComponent = Component({
        foo: 1,
    })

    console.log(TestComponent.keys.foo) // the index for the 'foo' value inside the component data
    ```

##### ComponentInstance Methods

**ComponentInstance(data(optional) : Object<String, Primitive>) -> ComponentDefinition**

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




### ECS(...components) -> returns ECSInstance

Initializes the ECS framework and registers any components passed as arguments.


- ECSInstance.System(query, function)

Defines a system that operates on entities with a specific set of components (query).

function will receive a reference to the ecs instance as first parameter and a reference to the queried entities id as second parameter.

The rest of the parameters are carried from the invocation

```
const TestSystem = ecs.System([TestComponent], (ecs, entities, arg1, arg2) => {
    entities.forEach(e => {
        const [foo] = ecs.entity(e).get(TestComponent)
        console.log(foo, arg1, arg2)
    })
})
```

if no query is provided, entities will be a empty array

- ECS(instance).spawn(...componentSets)

Creates new entities with the specified components.

Example:

```
import ECS, { Component } from 'ecs.js'

const TestComponent = Component({
    foo: 1
})

const TestTagComponent = Component()

const ecs = ECS(TestComponent, TestTagComponent)

const entityID = ECS.spawn([
    TestComponent({ foo: 'bar' }),
    TestTagComponent(),
]);
```

- ECSInstance.entity(entityID)

Accesses a specific entity, allowing for component manipulation and entity management.

- ECSInstance.entity(entityID).has(component)

    Checks if the entity has a specific component.

    ```
    const hasTag = ecs.entity(e).has(TestTagComponent)
    ```

- ECSInstance.entity(entityID).get(component)

    Retrieves a specific component's data from the entity.

    ```
    const [foo] = ecs.entity(e).get(TestComponent)
    ```

- ECSInstance.entity(entityID).add(component)

    Adds a component to the entity.

    ```
    ecs.entity(e).add(TestComponent({
        foo: 4
    }))
    ```

- ECSInstance.entity(entityID).remove(component)

    Removes a component from the entity.

    ```
    ecs.entity(e).remove(TestComponent)
    ```

- ECSInstance.entity(entityID).kill()

    Marks the entity for deletion in the next tick.

    ```
    ecs.entity(e).kill()
    ```

- ECSInstance.tick()

Processes system updates, handling entity deletions and archetype recalculations as needed.

The easiest way to handle it is by executing ecs.tick() in every frame. It's only needed if entities composition has changed tho,
adding/removing components or entities will require a .tick call to reprocess the archetypes.

```
function gameLoop() {
  ecs.tick()
  requestAnimationFrame(gameLoop)
}
```

