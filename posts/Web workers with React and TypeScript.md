---
title: Web workers with React and TypeScript
description: The Good, the Bad, and the Ugly - conquering the parallelism and overheads of web workers
date: 2024-05-22
tags:
  - Annoyances
  - TypeScript
---
<div align="center">

| Annoy level | Time wasted | Solvable |
| :-: | :-: | :-: |
| <img src="/img/Bolt.svg" alt="Annoying bolt level 1 on" width="15" height="12"/><img src="/img/Bolt.svg" alt="Annoying bolt level 2 on" width="15" height="12"/><img src="/img/Bolt.svg" class="off" alt="Annoying bolt level 3 off" width="15" height="12"/><img src="/img/Bolt.svg" class="off" alt="Annoying bolt level 4 off" width="15" height="12"/><img src="/img/Bolt.svg" class="off" alt="Annoying bolt level 5 off" width="15" height="12"/> | 16h | Hell yeah! |

</div>

One thing that particularly bothers me when working with shiny out-of-the-box products like React and TypeScript is their hidden overheads. Everything generally functions smoothly, but when you delve into less common use cases, you're likely to encounter some nasty bugs<sup>🐛</sup>. 

While the reasons behind these bugs are often clear, finding a solution within the framework's constraints can be quite challenging. That's what happend to me while I was working again with [Web Workers](docs/Web/API/Web_Workers_API/Using_web_workers).

## The good 🦸‍♂️

While working on my [Shan Shui](https://github.com/Megaemce/shan_shui) project, I set out to create millions of SVG paths and swiftly integrate them into the DOM. Each frame I rendered included numerous layers, ranging from 4 to around 45. Many of these layers contained thousands of SVG elements, sometimes even more. Rendering all layers simultaneously would boost rendering process significantly compared to the standard synchronous JavaScript approach.

When thinking about speed and parallel computation in JavaScript, there is only one star: **Web Workers**<sup>⭐</sup>. Their ability to work independently from the main thread and their true multi-threading capabilities caught my attention immediately.

My first draft code simply followed the MDN tutorial.

````ts
this.someArray.forEach((element) => { 
			const worker = new Worker("worker.ts"); // worker.ts is within same folder, da!
      // ...
````

However, this does not work in a React project because the bundler does not understand that this specific string should be replaced during compilation with the new path to the bundled JavaScript file.

After some digging, I found a [clever solution](https://blog.logrocket.com/web-workers-react-typescript/#:~:text=Inside%20the%20component%2C%20we%E2%80%99ll%20initialize%20a%20new%20web%20worker%20with%20the%20count.ts%20worker%20file%20we%20already%20created%3A) that works with React's bundler.[^0]
````ts
const worker = new Worker(new URL("worker.ts", import.meta.url)); 
````
Now, with the help of promises, I can render the entire scene just as I showcased in my  [GitHub Gist](https://gist.github.com/Megaemce/92f768c0686fc63666935d0a82f646d9).


## The bad 🦹‍♂️
Let's split the previous one-liner so I can explain what's happening here.
````ts
const url = "worker.ts"
const base = import.meta.url;
const path = new URL(url,base);
const worker = new Worker(path); // this is just the same code, yeah? Well...not in React
````

- `base` represents the URL from which the script was obtained. More on  [import.meta.url](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta#url).
- `path` creates a new [URL object](https://developer.mozilla.org/en-US/docs/Web/API/URL) after [resolving relative references](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references) between `url` and `base`.
- `worker` creates a new Worker object using a string from `path`'s URL object.

Everything seems straightforward, but there's a <sub>💥</sub>ZONK<sup>💥</sup> - it's not working!
````javascript
Failed to construct 'Worker': 
Script at 'file:///.../worker.js' cannot be accessed from origin 'http://localhost:3000'.
````
This issue is caused by the [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), which tries to restrict how a document or script loaded by one origin can interact with a resource from another origin. In this case, JavaScript thinks that the `worker.js` file lies in a different place than `localhost`[^1].

> It's still a mystery to me why it works with a one-liner but not when the arguments are split into separate constants. My only assumption is that React's bundler (WebPack) attempts to catch all instances of Worker's constructors during compilation and patch their URLs on the fly.

We could just skip this way of passing the URL object and do it directly. However, if you ever consider (just like I did) creating a custom worker class, you might have a bad day ahead of you.

````ts/8
class CustomWorker extends Worker {
    currentTask: {
        message: any;
        resolve: (value: string) => void;
        reject: (reason?: any) => void;
    } | null = null;

    constructor(scriptURL: string | URL, options?: WorkerOptions) {
        super(scriptURL, options); // React intensifies breathing
    }
}
````
The `new CustomWorker(someURL)` constructor will fail with the same issue as before.

The simplest solution is to use the one-liner for your project, and if you really need to pass the URL as a variable, you can use a trick that I learned while trying to fix another Worker's issue.

## The ugly 🥸
While happy about my nitro-speed worker approach, I published the project on Vercel. Then, the nightmare of every engineer occurred — it works locally (almost) perfectly, but stutters in production. A quick comparison between the two versions shows a major flaw: the workers are now working sequentially! Somehow, the parallelism disappears[^2]. What took 243ms on localhost now takes 1.32s in production[^3].

<div align="center"><img src="/img/shan_shui_worker_performance_before.png" alt="Performance difference between local version (left) and production (right). Very bad sequential processing visible in production" class="subtextImg"/></div>

It was not long after I thought, _"maybe the network requests are the issue here"_, and I was right. Unfortunately, network requests made by Workers are not cost-free.

<div align="center"><img src="/img/shan_shui_worker_performance_network.png" alt="Sequential network requests" class="subtextImg"/></div>

After a few more readings, I found [this solution](https://dev.to/martinsolumide8/how-to-use-web-worker-in-react-with-typescript-4o79) which relies on the [Blob constructor](https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob). It consumes the stringified version of the main worker's function and then passes the [Blob object](https://developer.mozilla.org/en-US/docs/Web/API/Blob) into URL's [createObjectURL static method](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static).

````ts
// worker.ts file //
const workerFunction = function () {
    onmessage = function (e: MessageEvent): void {
	    const element = e.data.element;
	    const result = element + "!" // just as an example

	  postMessage({ result: result });
  };
}
// Stringify the whole function
const code = workerFunction.toString() 
// Get everything between {} brackets
const mainCode = code.substring(code.indexOf("{") + 1,code.lastIndexOf("}")); 
// Create a Blob containing onmessage function
const blob = new Blob([mainCode], { type: "text/javascript" }); 
// Create URL to Blob object
const workerBlobURL = URL.createObjectURL(blob); 

export default workerBlobURL;

// main file //
import workerBlobURL from "worker.ts";

this.someArray.forEach((element) => { 
			const worker = new Worker(workerBlobURL);
      // ...
````
I gave it a try, and it works astonishingly well. All the network overheads have vanished, and now the rendering of all the layers takes just 163ms!

<div align="center"><img src="/img/shan_shui_worker_performance_after.png" alt="Ultra blobing fast increase in pace of the workers" class="subtextImg"/></div>

> If you want to create your worker script on the fly without worrying about network request overhead, simply use Blob. The same applies to custom workers created in React - pass the Blob-build URL object as the argument instead of regular path.

## Further optimalization
Workers work best when you use them in line with the number of logical processors available to run threads on the user's computer. This number can be obtained by accessing the [Navigator](https://developer.mozilla.org/en-US/docs/Web/API/Navigator)'s [hardwareConcurrency](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency) property.
````js
const concurrency = navigator.hardwareConcurrency
````

This way, we can partition the data (for example, my array of layers) into pieces of length equal to the `concurrency`, and then create [pool of workers](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency#examples) that will process each piece in the fastest possible way. 

{% include "likeButton.njk" %}

[^0]: Making it work in TypeScript and the WebPack bundler (without React) is [another level of flexing](https://www.jameslmilner.com/posts/workers-with-webpack-and-ts/)
[^1]: Maybe this would work in production, but I didn't test it, as I like when stuff works **everywhere**
[^2]: Only when publishing this post did I notice that the local version was suffering from the same issue, but to a lesser extent, as there is much less network overhead on localhost
[^3]: I tested all the performance benchmarks on the same picture
