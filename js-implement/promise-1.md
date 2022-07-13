---
title: 『你写的Promise, 是完美的吗?』
tags: [js-implement,promise]
date: 2022-07-11 16:46:13
---

《手写 Promise》是一个经典的问题，基本上大家上手都可以按照自己的理解，写出来一个 promise, 有一天个朋友问我，"手写 Promise 要写到什么程度才是合格的 ?", 这也引起了我的兴趣和思考, "怎么样的 Promise ，才是完美的呢 ? "

<!--truncate-->

## 完美的 Promise

第一个问题就是怎么样才算是一个完美的 Promise 呢, 其实这个问题也不难，实现一个和原生 Promise "相同"的 Promsie，不就是完美的了, 那么第二个问题也就来了，原生的 Promise 是按照什么标准来实现的呢, 查阅了资料之后知道是按照 [Promises/A+] (<https://promisesaplus.com/>)标准来实现的， 具体的实现在 [ECMA - sec-promise-objects](https://tc39.es/ecma262/#sec-promise-objects) 上有记载, 现在标准有了，我们就可以来实现一个"完美的 Promise"了

## Promises/A+

接下来我们来看看`Promises/A+`标准说了啥, 主要是两部分，一个是名词定义，一个是标准描述，其中标准描述由三个部分组成, 接下来我们简单介绍下:

### Terminology

这部分是名词定义，主要是描述了各个名词在标准中的定义

* `promise`: 是具有`then`行为符合规范的方法的`object`或`function`, 这里需要注意的是不是`function`是`then`,是`function`中有`then` 方法
* `thenable`: 是定义`then`方法的`object`或`函数`，这个和上面`promise`的区别在于`then`是一个函数，不一定需要符合规范行为
* `value`: 是任何合法的 javascript 值，包括`undefined`、`thenable`、`promise` ,这里的`value`包含了`thenable`和`promise`,结合下面的规范,会发现是一个可嵌套的关系
* `exception`: 是一个通过`throw` 关键词抛出来的值
* `reason`: 表示一个`promise`状态是`rejected` 的原因

### Requirements

这部分是标准的定义,分为以下三个部分

#### Promise States

一个`promise`必须是以下三种状态之一

* `pending`
  * 可以转变成 `fulfilled` 或者 `rejected` 状态
* `fulfilled`
  * 需要存在一个`value`
* `rejected`
  * 需要存在一个`reason`

当状态是`fulfilled` 或者 `rejected`时，状态不可以再变化成其他状态，而`value` 和`reason` 也不可以再变化

#### The `then` Method

这部分定义了 `promise` 中 `then` 方法的行为，`then` 方法是用来访问`promise`状态变成`fulfilled` 或者 `rejected` 的`value` 或者`reason` 的， `then`  有两个参数，如下:
> promise.then(onFulfilled,onRejected)

* `onFulfilled` / `onRejected`
  * 都是可选参数，如果这两个参数不是函数类型，那么忽略
  * 在`promise`状态变成`fulfilled`/`rejected` 之后被调用，会带上`value`/`reason` 作为函数的参数
  * 只会被调用一次
  * 需要在`宏任务`或者`微任务` 事件循环中完成。   注: 这里对于执行时机的描述比较有趣，可以看看文档 [2.2.4](https://promisesaplus.com/#point-34)
  * 两个函数需要被绑定在`global this`上运行
* 同一个 Promise可以被多次 `then` 调用, `then` 中的 `onFulfilled` 和`onRejected` 必须按照`then`的调用顺序调用
* `then` 函数调用之后需要返回一个`promise` , 这也是`promise`可以链式调用`then`的基础

  > promise2 = promise1.then(onFulfilled,onRejected)

  * 如果`onFulfilled`或者`onRejected`函数返回了值`x`, 则运行 [Promise Resolution Procedure](https://promisesaplus.com/#the-promise-resolution-procedure)
  * 如果`onFulfilled`或者`onRejected` 抛出错误`e`， 则 `promise2` 的状态是`rejected`,并且`reason` 是 `e`
  * 如果`onFulfilled`或者`onRejected`不是一个函数,而且`promise1`的状态已经确定`fulfilled/rejected`, 则 `promise2`

#### The Promise Resolution Procedure

其实大体的标准部分在`Promise States` 和 `The then Method`已经描述完了,这部分主要规定了一个抽象的操作`promise resolution procedure`, 用来描述当`then` 的 `onFulfilled`或者`onRejected` 返回值`x`时,需要怎么样去进行操作,把表达式记为`[[Resolve]](promise,x)`, 这部分也是整个 Promise 实现最复杂的部分，我们一起看看他规定了什么
> \[[Resolve]](promise,x)

* 当 `promise` 和 `x` 是同一个对象时，`promise`为 `rejected`,`reason`是`TypeError`

  ``` javascript
  const promise = Promise.resolve().then(()=>promise); // TypeError

  ```

* 如果 `x` 是一个Promise时，则`promise`的状态要与`x` 同步
* 如果`x`是一个`object`或者一个`function` , 这部分是最复杂的
  * 首先要把`x.then`存储在一个中间变量`then`, 为什么要这么做可以看文档 [3.5](https://promisesaplus.com/#point-75),然后根据不同条件进行处理
  * 如果获取`x.then` 的时候就抛出错误`e`，则`promise` 状态变成`rejected`,`reason`是`e`
  * 如果`then`是一个函数，那么这就是我们定义里面的`thenable`, 这时候绑定 `x`为 this并调用`then`，传入 `promise` 的 `resolvePromise` 和`rejectPromise`作为两个参数
    > then.call(x, resolvePromise, rejectPromise)

    接下来判断调用的结果

    * 如果`resolvePromise` 被调用，`value`是`y`, 则调用`[[Resolve]](promise,y)`
    * 如果`rejectPromise` 被调用, `reason` 是`e`, 则 `promise` 状态变成`rejected`, `reason`是`e`
    * 如果`resolvePromise`和`rejectPromise`都被调用，则以第一个调用会准，后续的调用都被忽略

    * 如果调用过程中抛出了错误`e`
      * 如果抛出之前`resolvePromise` 或者`rejectPromise`已经被调用了，那么就忽略错误
      * 后者的话，则`promise`状态变成`rejected`,`reason`是`e`
  * 如果`then` 不是一个函数，那么`promise`状态变成`fulfilled`,`value`是`x`
* 如果 `x` 不是一个`object` 或者`function`, 则`promise`状态变成`fulfilled`,`value`是`x`

这里面最复杂的就是在 `resolvePromise` 被调用，`value`是`y` 这部分,实现的是`thenable` 的递归函数

上面就是如何实现一个"完美"的 Promise 的规范了,总的来说比较复杂的是在`The Promise Resolution Procedure` 和对于错误和调用边界的情况，下面我们将开始动手,实现一个"完美"的Promise

## 如何测试你的 Promise

前面介绍了 `Promise/A+`规范, 那么如何测试你的实现是完全实现了规范的呢, 这里`Promise/A+` 提供了 [promises-tests
](https://github.com/promises-aplus/promises-tests), 里面目前包含872个测试用例,用于测试 Promise 是否标准

## 正文开始

首先说明下这边是按照已完成的代码对实现 promise 进行介绍代码在[这里](https://github.com/qbright/note-book/blob/15a8f5d8d2da033cb23549435a13ffe46dbf1e5e/codes/promise/promise.js), 这里使用的是最终版本，里面注释大致标明了实现的规则编号，其实整体来说经过了很多修改，如果要看整个便携过程，可以[commit history](https://github.com/qbright/note-book/commits/main/codes/promise), 关注`promise_2.js` 和`promise.js` 两个文件

### 编写的关键点

整体的实现思路主要就是上面的规范了，当然我们也不是说逐条进行实现，而是对规范进行分类，统一去实现:

* [`promise`的状态定义及转变规则和基础运行](#promise的状态定义及转变规则和基础运行)
* [`then`的实现](#then的实现)
* [`onFulfilled/onRejected`的执行及执行时机](#onFulfilled和onRejected的执行及执行时机)
* [`thenable`的处理](#thenable的处理)
* `promise/then/thenable`  中对于错误的处理
* `resolvePromise/rejectPromise`的执行次数

#### promise的状态定义及转变规则和基础运行

``` javascript
const Promise_State = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class MyPromise {
  constructor(executerFn) {
    this.state = Promise_State.PENDING;
    this.thenSet = [];
    try {
      executerFn(this._resolveFn.bind(this), this._rejectedFn.bind(this));
    } catch (e) {
      this._rejectedFn.call(this, e);
    }
  }
}

```

在构造函数中初始化状态为`pending`,并且运行传入构造函数的`executerFn`,传入`resovlePromise`、`rejectePromise`两个参数

然后我们接下去就要实现 `resolvePromise`,`rejectPromise` 这两个函数

``` javascript
  _resolveFn(result) {
    // 2.1.2
    if (this._checkStateCanChange()) {
      this.state = Promise_State.FULFILLED;
      this.result = result;
      this._tryRunThen();
    }
  }

  _rejectedFn(rejectedReason) {
    //2.1.3
    if (this._checkStateCanChange()) {
      this.state = Promise_State.REJECTED;
      this.rejectedReason = rejectedReason;
      this._tryRunThen();
    }
  }

  _checkStateCanChange() {
    //2.1.1
    return this.state === Promise_State.PENDING;
  }
```

这里主要是通过`_checkStateCanChange` 判断是否可执行的状态，然后进行状态变更,`value`、`reason`的赋值,然后尝试运行`then`方法注册的函数

这时候我们的promise 已经可以这么调用了

``` javascript
const p = new MyPromise((resolve,reject)=>{
   resolve('do resolve');
   // reject('do reject');
});

```

#### then的实现

接下来我们实现`then` 函数，首先有个简单的问题: 『then方法是什么时候执行的?』,有人会回答，是在 promise 状态变成`resolve`或者`rejected` 的之后执行的，这个乍一看好像没毛病，但是其实是有毛病的，正确的说法应该是

>『then方法是立即执行的,then方法传入的`onFulfilled`、`onRejected` 参数会在 promise 状态变成`resolve` 或者`rejected`后执行

我们先上代码

``` javascript

  then(onFulfilled, onRejected) {
    const nextThen = [];
    const nextPromise = new MyPromise((resolve, reject) => {
      nextThen[1] = resolve;
      nextThen[2] = reject;
    });
    nextThen[0] = nextPromise;

    //2.2.6
    this.thenSet.push([onFulfilled, onRejected, nextThen]);
    this._runMicroTask(() => this._tryRunThen());
    return nextThen[0];
  }

```

代码看起来也挺简单的,主要逻辑就是构造一个新的 promise,然后把 `onFulfilled`、`onRejected`还有新构造的 promise 的`resolve`、`reject` 存储到`thenSet`集合中,然后返回这个新构建的promise, 这时候我们的代码已经可以这样子调用

``` javascript

const p = new MyPromise((resolve,reject)=>{
   resolve('do resolve');
   // reject('do reject');
});

p.then((value)=>{
  console.log(`resolve p1 ${value}`);
},(reason)=>{
  console.log(`reject p1 ${reason}`);
}).then((value)=>console.log(`resolve pp1 ${value}`));

p.then((value)=>{
  console.log(`resolve p2 ${value}`);
},(reason)=>{
  console.log(`reject p2 ${reason}`);
});

```

#### onFulfilled和onRejected的执行及执行时机

`onFulFilled` 和`onRejected` 会在 promise 状态变成`fulfilled`或者`rejected`之后被调用，结合`then`方法被调用的时机,判断时候状态可以调用需要在两个地方做

* 在`resolvePromise`、`resolvePromise` 被调用的时候(判断是否有调用了then注册了`onFulfilled` 和`onRejected`)

* 在`then` 函数被调用的时候(判断是否 promise状态已经变成了`fulfilled`或`rejected`)
  
 这两个时机会调用以下函数

 ``` javascript

  _tryRunThen() {
    if (this.state !== Promise_State.PENDING) {
      //2.2.6
      while (this.thenSet.length) {
        const thenFn = this.thenSet.shift();
        if (this.state === Promise_State.FULFILLED) {
          this._runThenFulfilled(thenFn);
        } else if (this.state === Promise_State.REJECTED) {
          this._runThenRejected(thenFn);
        }
      }
    }
  }

 ```

 这里会判断时候需要调用`then`注册的函数，然后根据 promise 的状态将 `thenSet` 中的函数进行对应的调用

``` javascript

  _runThenFulfilled(thenFn) {
    const onFulfilledFn = thenFn[0];
    const [resolve, reject] = this._runBothOneTimeFunction(
      thenFn[2][1],
      thenFn[2][2]
    );
    if (!onFulfilledFn || typeOf(onFulfilledFn) !== "Function") {
      // 2.2.73
      resolve(this.result);
    } else {
      this._runThenWrap(
        onFulfilledFn,
        this.result,
        thenFn[2][0],
        resolve,
        reject
      );
    }
  }

```

`_runThenFulfilled`和`_runThenRejected` 相似，这里就通过一个进行讲解,
首先我们判断`onFulfilled`或者`onRejected` 的合法性

* 如果不合法则不执行，直接将promise 的`value`或`reason`透传给之前返回给`then` 的那个 promise，这个时候相当于`then`的 promise 的状态和原来的 promise 的状态相同
* 如果合法，则执行`onFulfilled` 或者 `onRejected`

``` javascript
  _runThenWrap(onFn, fnVal, prevPromise, resolve, reject) {
     this._runMicroTask(() => {
        try {
          const thenResult = onFn(fnVal);
          if (thenResult instanceof MyPromise) {
            if (prevPromise === thenResult) {
              //2.3.1
              reject(new TypeError());
            } else {
              //2.3.2
              thenResult.then(resolve, reject);
            }
          } else {
            // ... thenable handler code
            // 2.3.3.4
            // 2.3.4
            resolve(thenResult);
          }
        } catch (e) {
          reject(e);
        }
     });
  }
```

这里先截取一小段`_runThenWrap`,主要是说明`onFulfilled`或`onRejected`的运行，这部分在规范中有这样子的一个描述
> onFulfilled or onRejected must not be called until the execution context stack contains only platform code.

简单来说就是`onFulfilled` 和`onRejected`要在执行上下文里面没有除了`platform code` 之后才能执行，这段听起来有点拗口，其实说人话就是我们经常说的要在`微任务`、`宏任务`
所以我们这里包装了`_runMicroTask`方法，用于封装这部分执行的逻辑

``` javascript
   _runMicroTask(fn) {
    // 2.2.4
    queueMicrotask(fn);
  }

```

这里使用`queueMicrotask`作为微任务的实现, 当然这个有兼容性问题，具体可以看[caniuse](https://caniuse.com/?search=queueMicrotask)

实现的方法还有很多，比如`setTimeout`、`setImmediate`、 `MutationObserver`、`process.nextTick`

然后将`value`或`reason`作为参数执行`onFulfilled`或`onRejected`,然后获取返回值`thenResult`，接下来就会有几个判断的分支

* 如果`thenResult`是一个 promise
  * 判断是否和`then`返回的 promise 是相同的，如果是抛出`TypeError`

  * 传递`then`返回的 promise 的`resolve`和`reject`,作为`thenResult.then`的`onFulFilled`和`onRejected`函数
* 如果`thenResult`不是一个 promise
  * 判断是否是`thenable`,这部分我们在下面进行讲解
  * 如果以上判断都不是，那么将`thenResult` 作为参数，调用`resolvePromise`

#### thenable的处理

`thenable`应该说是实现里面最复杂的一个部分了，首先，我们要根据定义判断上部分的`thenResult`是否是`thenable`

``` javascript

   if (
      typeOf(thenResult) === "Object" ||
      typeOf(thenResult) === "Function"
    ) {
      //2.3.3.1
      const thenFunction = thenResult.then;
      if (typeOf(thenFunction) === "Function") {
        // is thenable
      }
    }

```

可以看到 需要判断是否是一个`Object`或者`Function`,然后再判断`thenResult.then` 是不是个 `Function`
