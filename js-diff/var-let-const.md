---
title: var let const 的作用域之争
tags: [jsDiff]
date: 2022-05-24 10:47:00
---


# var / let / const

## 什么是作用域

在讨论 var 、let 、const 的不同之前，我们首先要了解下什么是作用域, 作用域用来指定变量/函数可供访问的范围,即变量/函数被定义和访问的范围及关系

## 什么是变量提升

变量提升是 JavaScript 的一种机制, 简单来说就是在执行代码之前，变量和函数声明会移至其作用域的顶部

var/let/const的区别主要还是在其关键字对应声明的变量的作用域区别，还有变量提升带来的访问区别
<!--truncate-->

## var

### var的作用域

var可以在全局范围声明或函数/局部范围内声明。

* 当在最外层函数的外部声明var变量时，作用域是全局的。这意味着在最外层函数的外部用var声明的任何变量都可以在windows中使用。

* 当在函数中声明var时，作用域是局部的。这意味着它只能在函数内访问。

### var可以被重复定义

var 声明的变量可以被重复定义

``` javascript
var a = 'hello';

if(1>0){
 var a = 'world';
}

console.log(a); // print 'world'
```

上面这两个特性在以往多js 文件项目就带来了很多不可预知的 bug，不同的 js 文件的最上层中使用 var 定义了相同的变量,后面加载的文件的变量覆盖了前面的，导致了 bug 的出现,后来各种模块化的概念限定了变量的作用域，才减少了此类问题的出现

### var没有块级作用域

块级作用域指的是`{ }` 花括号中的代码块, 上面说到 var 有全局作用域和函数作用域，如果在块级作用域定义的变量，会被变量提升到上层的函数或者全局作用域中,比如

``` javascript

function foo() {
   for(var i = 0 ; i < 10; i ++){
   }
   console.log(i) // print 10
}

```

可以看到 i 在 for 循环完成之后还可以被访问到,这是因为通过变量提升，var 定义的 i 被提升到了函数作用域 foo 的顶部，看起来类似下面

``` javascript
function foo() {
    var i = undefined;
    for(i = 0; i< 10; i ++>) {

    }
    console.log(i);
}

```

还有一个经典的问题,如下

``` javascript

function foo() {
  for(var i = 0 ; i < 3; i ++) {
   setTimeout(function() {
    console.log(i); // print 3,3,3
   },1000);

  }
}

```

此函数的运行结果由于 setTimeout回调中共享了 i 变量，因此在1s 后打印出来会变成 for 循环的最后一个值 3

后面又有另外一个经典问题是如何把上面的函数改写称为输出是0 、1 、2 , 如下:

``` javascript
function foo() {
   for(var i = 0 ; i < 3; i++){
    function(i) {
     setTimeout(function() {
        console.log(i); // print 0,1,2
     },1000);
    }(i);
   }
}

```

通过 IIFE( 立即执行函数)，形成闭包去保存传入当前的 i 值, 从而打印对应的值

还有另外一个和变量提升相关的问题，如下

``` javascript
var a = 1;
function foo(){
   console.log(a);
   var a = 2;
}

foo(); // print undefined
```

上面的运行结果是`undefined`,而不是直觉的`1`,就是由于变量提升到对应作用域顶端带来的问题,提升之后代码如下

``` javascript
var a = 1;
function foo() {
   var a = undefined;
   console.log(a);
   a = 2;
}
foo();
```

 如果我们把`var a = 2` 删除，就会打印`1`

## let

我们通过和 var 做对比来了解 let

### let 不可以被重复定义

使用 let 定义的变量不可以被再次定义,但是可以被重新赋值

``` javascript

let a = 0;
let a = 1; // error: Uncaught SyntaxError: Identifier 'a' has already been declared

let b = 0;
b = 1; // no error

```

### let 中的变量提升

let 定义的变量也会进行变量提升，但是和 var 的区别是，提升之后不会使用 undefined 进行初始化，因此如果在定义之前被使用，会抛错

``` javascript
let a = 1;
function foo() {
  console.log(a) ;
  let a = 2;
}
foo(); // error: Uncaught ReferenceError: Cannot access 'a' before initialization

```

### let 存在块级作用域

使用 let 定义的变量存在块级作用域

``` javascript

let a = 1;
function foo() {
   let a = 2;
}

console.log(a); // print 1

```

let 在 `for` 、`for in`、`for of` 的循环在每次迭代时都为x创建新的绑定,也就是说不会出现如 var 那种预期之外的结果

## const

const 的大部分特点和 let 是一样的，区别在于通过 const 定义的是一个常量，不可被修改

``` javascript
const a = 1;
a = 2; // error  Uncaught SyntaxError: Identifier 'a' has already been declared
```

对于定义引用类型，对于自身内部的修改，是没有问题的

``` javascript

const a = {b:1}

a.b = 2; // no error

```

## 总结

let 和 const 解决了用 var 定义参数带来的没有块级作用域的问题以及在定义作用域定义同名参数覆盖等问题，因此尽量使用 let 和 const, 避免使用 var
