# Promise/async、await

## 异步与单线程

大家都听说过『javascript 是单线程的』这个说法, 那么为什么是单线程的, 这个就得从这门语言被设计出来的背景说起了，javascript 当初主要就是被设计出来用于网页 dom文档 操作，如果是多线程，那么相当于一个文件被多个句柄打开并操作, 这样子很容易出现文档的不同步，导致问题的出现,web 视图出现混乱，因此这门语言被设计成单线程的

需要注意的是，这个的单线程是指浏览器单个 webview 的javascript 执行是单线程的，而不是浏览器是单线程的。浏览器主要包括`GPU 进程`,`渲染进程`,`Browser 控制进程`等等，而 javascript 执行线程在`渲染进程` 中， 渲染进程包括:

* javascript 执行线程: 就是我们经常javascript 引擎, 主要用于 javascript 代码解释，运行
* GUI 渲染线程: 用于用户界面的渲染工作
* 事件触发线程: 用于控制浏览器事件循环,在符合条件的事件触发后将任务放入任务队列队尾，等待 js 执行线程执行
* 定时器触发线程: 用于控制类似 `setTimeout`、`setInterval` 的执行，当触发之后将任务放入任务队列队尾，等待 js 执行线程执行
* 异步 http 请求线程: 用于控制`XmlHttprequest`或者`fetch`的执行，当触发事件之后将任务放入任务队列队尾，等待 js 执行线程执行

可以看到简单来说分为三个部分

* 渲染任务由 GUI 渲染线程执行
* javascript 执行线程 负责执行 javascript
* 事件、定时器、http 线程用于控制对应的任务，当任务在特定条件下被触发之后，将任务的回调放入js 的任务队列，等待执行

>需要注意的是，GUI 渲染线程和 javascript 执行线程是运行互斥的，即同一时间只会运行其中的一个，因此如果后面的三种操作`事件`,`延时`,`http请求`如果是同步的，那么 js 会被阻塞住，从而也导致了 GUI 线程不执行，导致了页面的交互卡顿

从上面可以看出，在浏览器上面 javascript 执行的单线程情况，`事件`、`延时`、`http请求`等会阻塞js执行的操作，都是通过函数回调来实现, 而这个设计在 nodejs 环境下也是相识的，类似文件读取等会导致 js 执行阻塞的操作，也都提供了异步版本

## 处理异步调用

前面讨论了浏览器 js 运行机制带来了`函数异步回调`, 因此这边编程方式在 js 编程中非常常见，比如

``` javascript
//dom函数事件回调

document.querySelector('#id').addEventListener('click',()=>{
 console.log('do something when dom click');
});

//函数延时回调

setTimeout(()=>{
 console.log('do something after 1 second')
},1000);

```

从上面的例子可以知道异步操作就是采用回调函数方式执行特定状态后的任务，当场景较为简单的时候，问题不大，当如果场景复杂起来，比如回调函数又是一个异步操作，就会导致一个经典的问题 『回调地狱』

``` javascript

setTimeout(()=>{
 console.log('do someting')
   setTimeout(()=>{
 //.....
    console.log('do another something');
   },2000);
},1000);

```

这种层层嵌套的回调操作，对于代码的可读性和维护性破坏是非常大的，因此在各个阶段都有工具在需求一些解决方案，比如 [asyncjs](https://caolan.github.io/async/v3/), [jquery Deferred](https://api.jquery.com/category/deferred-object/), 随着 js 标准的发展，`Promise`、`async/await` 作为标准被引入

## Promise

Promise 对象用于表示一个异步操作的最终完成（或失败）及其结果值, 一个 Promise 被创建之后必定处于以下几种状态之一:

* pending: 初始状态，既没有被兑现，也没有被拒绝
* 已兑现（fulfilled）：意味着操作成功完成。
* 已拒绝（rejected）：意味着操作失败。

当一个 promise 被兑现或者是拒绝时，这个对象的状态就被固定(settled)下来了，不能再改变

当状态被固定下来之后，当状态是`fulfilled` 时调用对象绑定的`then`方法，当状态是`rejected` 时调用绑定的`catch` 方法或者 `then`方法的`onRejected` 回调被定义，就会被回调, 由于 `Promise.prototype.then`、`Promise.prototype.catch` 都会返回 promise 对象，因此可以进行链式调用

当 `then`、`catch` 方法中的返回值问题

* 如果没有显式返回值，将返回一个 `resolve Value` 为 undefined 的promise

``` javascript
let a = Promise.resolve('a');
let b = a.then((value)=>{console.log(value)}); //print a ;  no return ;
console.log(b); //  print  Promise {<fulfilled>: undefined}
```

* 返回值是一个 Promise 对象，那么原有的 promise 会被替换

``` javascript

let a1 = Promise.resolve('a1');
let b1 = a1.then((value)=>{
  console.log(value); 
  return Promise.resolve('b1');
}); // print a1 ; return promise b1;

```

* 如果返回值是一个 非 Promise对象，那么将会返回一个状态为 fulfilled, 值为这个返回值的 promise 对象

``` javascript
let a2 = Promise.resolve('a2');
let b2 = a2.then((value)=>{
  return 'b2'
}); // return  promise b2;

```

由于返回的都是 Promise 对象，因此可以进行`then`、`catch`的链式调用,后一个`then` 的输入取决与前一个`then`的返回值

> 这里需要注意的是，`then`,`catch` 的绑定时机和触发时机和 Promise对象状态改变是没有关系的，也就是说在 Promise 对象在任何状态下绑定 `then` ,`catch` 方法，都会 Promise 状态是`fulfilled` 或者是`rejected` 时调用相应的方法

>> 这里还有个细节, `then`,`catch`返回的Promise 对象，不是先前的那个 Promise 对象，而是重新构造出来的Promise 对象，是原来对象的复制； 另外 catch 其实内部就是调用的 then方法去实现的，具体可以参考 [ECMA资料](https://262.ecma-international.org/9.0/#sec-properties-of-the-promise-prototype-object)

### Promise的构造方法/静态方法

下面简单说明 Promise 的构造和静态方法，具体可以参阅文档[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)

* Promise 构造方法: Promise接收一个用于执行函数，函数中两个参数`resolve`,`reject` 用于函数执行完成的回调;

  ``` javascript
  let a = new Promise((resolve,reject)=>{
    setTimeout(()=>{
      resolve('timeout resolve') // fulfilled
      // or reject('timeout reject'); // rejected
    },1000);
  });
  ```

  Promise实例被 new 出来之后回调函数会执行, 此时 Promise 的状态就是 `pending` , 当 `resolve` 或者 `reject` 被调用之后,状态就会变成`fulfilled` 或者 `reject`

* Promise.resolve/Promise.reject: 直接构造一个状态为`fulfilled`或者是 `reject` 状态的 Promise

* Promise.all: 接收一个数组参数, 当数组参数的 Promise全部为 `fulfilled` 时，构造的 Promise 为 `fulfilled`,返回值是数组所有 Promise 的返回值数组, 当数组参数的 Promise有至少一个是`rejected` 时，构造的 Promise为`rejected`, 返回值为第一个`rejected` 状态的 Promise 的返回值

* Promise.race: 接收一个数组参数，当数组参数的 Promise 中第一个变成`fulfilled`或者`rejected` 时，构造的 Promise 状态会变成对应的状态

* Promise.allSettled: 接收一个数组参数, 当数组参数的 Promise 是`settled`状态，即已经确定是`fullfilled` 或者是`rejected` 时，构造的 Promise状态变成`fullfilled`，返回数组参数 Promise 的状态及返回值

* Promise.any: 接收一个数组参数,当数组参数的 Promise 中任一个返回`fulfilled` 状态，则构造的 Promise 返回`fulfilled`,当所有的 Promise 都是`rejected` 的状态，则返回`reject`

> 这里要注意的是，以上涉及到 数组参数的静态方法， 如果传入的不是 Promise 对象，那么有点像`then`、`catch` 返回值一样，会构造成状态是`fulfilled`的 Promise 对象。

### promise 的 错误处理

前面说到了，当 promise 状态是 rejected时, 可以使用`catch` 或者`then` 传入第二个回调函数进行错误处理

当运行过程中出现错误，比如`throw new Error()`时，promise 会构造一个`rejected`状态的 promise 返回

当需要全局对没有处理的 promise 进行处理时，可以监听 `unhandledrejection` 方法，对全局的未处理的 promise 进行处理
