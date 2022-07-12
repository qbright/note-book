---
title: "你写的Promise, 是完美的吗?" —— 规范篇
tags: 
  - js-implement
  - promise
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

上面就是如何实现一个"完美"的 Promise 的规范了,总的来说比较复杂的是在`The Promise Resolution Procedure` 和对于错误和调用边界的情况，下一篇我们将开始动手,实现一个"完美"的Promise
