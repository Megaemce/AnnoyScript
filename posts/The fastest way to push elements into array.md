---
title: The fastest way to work with arrays
description: How to make 500 JavaScript push-ups without making CPU wet
tags:
  - Ninja tricks
  - JavaScript
---

Although my grandma liked to spend time feeding me with sweets and telling lies about the fact that _all methods in V8 are equal_ in terms of performance, I knew that she was secretly hiding the truth of real JavaScript ninja techniques<sup>🥷🏻</sup>.

Even though the cake was delicious, it's important to know that _a true Saiyan always sprinkles when he tinkles_[^1], and the real ninja JavaScript always assumes that V8's mysterious engine was written by [triple agents](https://en.wikipedia.org/wiki/Double_agent#Triple_agent) who made their stuff so confusing just as a test of our intellectual superiority and endurance before we can truly enter the Ninja realm.

## Seting up the task

Imagine the situation where we want to have a workout array that contains all of our daily push-ups. And we do a lot of them. Like milions of them, and every push-up it's actually a pretty heavy-lifting for a memory.

The go-to approach by laydev would be something like this:

```js
const workout = [];

for (let i; i < 500; i++) {
  workout[i].push("push-up");
}
```

Looks okish, but it's actually a big slowpoke<sub>🐌</sub>! Let's find a better, totally ninja-style, blazingly fast secret technique!

But first, we need to reveal the first truth about JavaScript's arrays.

## Empty array vs already filled array

Should we start our workout with an empty mind or filled with memories of the times we failed as a developer? Or, to stay on track with this topic, should we just create an empty workout array, or is it better to have it filled with empty slots ready to get sweaty💦?

```js
const workout_empty = [];
const workout_slot_ready = ["slot",...,"slot"] // 500 slots

for (let i = 0; i < 500; i++) {
  workout_empty[i] = "push-up";
}

for (let i = 0; i < 500; i++) {
  workout_slot_ready[i] = "push-up";
}
```
The rule of thumb is that pushing that many elements to a completely empty array will be very slow. JavaScript generally prefers when the array is already populated, but let's actually test it.

The results exceed expectations. Pushing into the `workout_slot_ready` array is more than **3x faster**!
 <div align="center">

 | Slot_ready | Empty |
 | :-: | :-: |
 | 🏆 2.4M ops/s | 754K ops/s |
 </div>

## Quickest way to create filled array

So now we know that it's better to work with filled arrays, but how to create them quick? To find out let's set up the octagon for a fight between four opponents:

- old-style and cheerful Grandpa - `Array[i]`,
- well-known and widely respected - [`push()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push) method,
- new kid on the block but with a cool hairstyle - [`new Array().fill()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill),
- the guy who wears underpants on the outside - [`Array.from()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from).

Let's ask them to do 500 push-ups and see who will win in terms of performance.

```js
// creating an empty array and filling it ol' style!
const workout = [];
for (let i = 0; i < 500; i++) {
  workout[i] = "slot";
}

// creating an empty array and filling it up using a push
workout = [];
for (let i = 0; i < 500; i++) {
  workout.push("slot");
}

// using Array's fill method to fill the array
workout = new Array(500).fill("slot", 0, 500);

// using Array's static from method with an object literal
workout = Array.from({ length: 500 }, () => "slot");
```

The results: `new Array().fill` is **1.2x faster** than `push` and then **19.5x faster** than `Array.from()` creep!

 <div align="center">

 | new Array().fill |   push()   | Array\[i\] | Array.from() |
 | :-----------------: | :--------: | :--------: | :----------: |
 | 🏆 546K ops/s | 454K ops/s | 374K ops/s |  28k ops/s   |
 </div>

## Quickest way to insert element into array

So let's assume that our `workout` array is already blazingly-fast-ninja-style-filled<sup>🥷🏻⚡</sup>.

Now let's push some push-ups into the workout! By doing so, we need to approach a well-know JavaScript battleground of fight between `forEach` and `for` ⚔️.

```js
// imperative approach
for (let i = 0; i < 500; i++) {
  workout[i] = "push-up";
}

// declarative approach
workout.forEach((_, i) => (workout[i] = "push-up"));
```

 This might cause some declarative devs to cry a little in the corner, but face the truth! Your fighting techniques are lame-o. Imperative 4 life with performance **2.2x faster** than declarative.
 <div align="center">

 | for | forEach|
 | :-: | :-:|
 | 🏆 2.2M ops/s | 1M ops/s |
 </div>

## Final battle

Let's lay the groundwork for one final performance battle: the laydev technique from the beginning of our training and a ninja-style crafted method, versus a whole bunch of push-ups 💪🏻!

```js
// 👴🏻 laydev style
const workout = [];

for (let i = 0; i < 10000000; i++) {
  workout.push("push-up");
}

// 🥷🏻 ninja style
workout = new Array(10000000).fill("slot", 0, 10000000);

for (let i = 0; i < 10000000; i++) {
  workout[i] = "push-up";
}
```

 The results are just **awesome**! We are almost **5.5x faster**!

 <div align="center">

 | Ninja styla | Lay style |
 | :-: | :-: |
 | 🏆 19 ops/s | 3.5 ops/s |
 </div>


> So next time when we set yourself up for a good ninja push-up training, remember the warm-up our workout with some `fill` method and use good ol' `for` loop.



<br>
<br>

<div align="center">
    <img src="/img/AnnoyScript_logo.svg"  alt="AnnoyScript logo" height="100" width="100"/>
</div>

<br>
<br>

[^1]: RIP in peace [Akira Toriyama](https://www.youtube.com/watch?v=7pSmhZFbCy0).
