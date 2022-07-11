import MyPromise from "./promise.js";

MyPromise.prototype.catch = function (catchFn) {
  return this.then(null, catchFn);
};

MyPromise.prototype.finally = function (finallyFn) {
  function getFn() {
    return function () {
      finallyFn && finallyFn();
    };
  }
  return this.then(getFn(), getFn());
};

MyPromise.all = function (promiseSet) {};
MyPromise.race = function (promiseSet) {};
MyPromise.any = function (promiseSet) {};
MyPromise.allSettled = function (promiseSet) {};
MyPromise.resolve = function (result) {
  return new MyPromise((resolve) => resolve(result));
};
MyPromise.reject = function (errorReason) {
  return new MyPromise((_, reject) => reject(errorReason));
};

const resolvePromise = MyPromise.resolve("hello resolve");
resolvePromise.then((result) => console.log(result));

const rejectPromise = MyPromise.reject("hello reject");
rejectPromise.then(null, (errorReason) => console.log(errorReason));
