---
title: Passing custom class object to web workers
description: A story of 6h search for missing class method after using web workers
tags:
  - Annoyances
  - TypeScript
---

<div align="center">

| Annoy level | Time wasted[^0] | Solvable |
| :-: | :-: | :-: |
| <img src="/img/Bolt.svg" width="15" height="12"/><img src="/img/Bolt.svg" width="15" height="12"/><img src="/img/Bolt.svg" width="15" height="12"/><img src="/img/Bolt_off.svg" width="15" height="12"/><img src="/img/Bolt_off.svg" width="15" height="12"/> |       6h        |  Kinda   |

</div>

# Passing custom class object to web workers

[Web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) are powerful sorcery in the battle against performance demons. When utilizing them, everyone gains a +10🛡️ defense bonus against senior devs and a +5🐎 boost to development stamina.

However, like every sword, they have two edges. One of these edges, [hidden in the depths of MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), can become a real pain in the ass when attempting to pass something more complex than an ordinary Object[^1].

Let's take a look at the simple _planWorker.ts_ code:

```ts
onmessage = function (e: MessageEvent): void {
  const x = e.data.x as number;
  const y = e.data.y as number;

  const layer = new Layer(x, y); // layer type is Layer

  postMessage({ layer: layer });
};
```

The worker gathers the data and then creates a new `Layer` with the given arguments. After the work is done, the new layer is sent back and can be accessed as `e.data.layer`.

Now, let's examine the `process` method of the `Frame` class that created this web worker in attempt to push the returned object named `layer` into the `layers` property in its class:

```ts/9
export default class Frame {
  layers: Layer[] = [];

  public process({ x, y }: Coords): void {
    const worker = new Worker(
      new URL("../utils/planWorker.ts", import.meta.url)
    );

    worker.onmessage = (e: MessageEvent) => {
      const layer: Layer = e.data.layer; // layer type is Layer, right?

      this.layers.push(layer);
      worker.terminate();
    };

    worker.postMessage({
      x: x,
      y: y,
    });
  }
}
```

How _pleasantly_ surprising it was to discover that suddenly methods working on the `layers` array couldn't access some of the methods from the `Layer` class.

After many hours of debugging, I discovered [this GitHub question](https://stackoverflow.com/questions/7704323/passing-objects-to-a-web-worker) and realized that, unlike every other time, the fault was not on my side.

The issue lay within the web worker messaging system.

> If your custom class contains something more then just properties then _buckle your seatbelt Dorothy, 'cause they are going bye-bye!_[^2]. The structured cloning algorithm used by web worker message system will ignore all of yours:
>
> - property descriptors
> - decorators
> - setters,
> - getters,
> - methods

The solution to handle this ✨feature✨ is to either construct new object properties to maintain the current state of the original class or utilize JSON. However, the loss of methods may be unacceptable for some, thus making web workers less than ideal for handling more complex custom class objects[^3].

<br>
<br>

<div align="center">
    <img src="/img/AnnoyScript_logo.svg" height="100" width="100"/>
</div>

<br>
<br>

[^0]: I learn something for sure, but you know... I could spend that time more productive, like watching Adventure Time instead.
[^1]: Web workers can also pass `Array`, `ArrayBuffer`, `Boolean`, `DataView`, `Date`, `Map`, `Number`, Primitive types, except symbol, `RegExp`, `Set`, `String` and `TypedArray`.
[^2]: Reference to [Matrix movie](https://www.youtube.com/watch?v=0-JJuHpfN5g&pp=ygUSbWF0cml4IHNheSBieWUgYnll).
[^3]: Other constrain may be the fact that all objects are copied not shared when used by messages system. Sharing data [is possible](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#passing_data_by_transferring_ownership_transferable_objects), but not with the objects.
