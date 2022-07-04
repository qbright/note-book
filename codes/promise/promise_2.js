import promiseAplusTests from "promises-aplus-tests";
//  mocha ./promise/promise_2.js --reporter doc | cat promise/head.html - promise/tail.html >  promise/result.html
const Promise_State = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class MyPromise {
  constructor(executerFn) {
    this.id = Math.random();

    this.state = Promise_State.PENDING;
    this.thenSet = [];

    executerFn(this._resolveFn.bind(this), this._rejectedFn.bind(this));
  }

  _resolveFn(result) {
    // console.log(0, result, this.state, this.id);
    if (this._checkStateCanChange()) {
      this.state = Promise_State.FULFILLED;
      this.result = result;
      this._tryRunThen();
      // if (!this._onFulfilled || Object.prototype.toString.call(this._onFulfilled) !== "[object Function]") { // undefined, null,false
      //   // return new MyPromise((resolve, rejected) => rejected(` onFulfilled`));
      //   this._rejectedFn(`onFulfilled is ${this._onFulfilled}`);
      // } else {
      //   this.state = Promise_State.FULFILLED;
      //   this.result = result;

      //   queueMicrotask(() => {
      //     this._onFulfilled(result); //处理返回值
      //   });

      // }
    }
  }

  _rejectedFn(rejectedReason) {
    if (this._checkStateCanChange()) {
      this.state = Promise_State.REJECTED;
      this.rejectedReason = rejectedReason;
      this._tryRunThen();
    }
  }

  _tryRunThen() {
    if (this.state !== Promise_State.PENDING) {
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
  _runThenRejected(thenFn) {
    const onRejectedFn = thenFn[1];

    if (
      !onRejectedFn ||
      Object.prototype.toString.call(onRejectedFn) !== "[object Function]"
    ) {
      thenFn[2][2](this.rejectedReason);
    } else {
      queueMicrotask(() => {
        try {
          const thenResult = onRejectedFn(this.rejectedReason);
          if (thenResult instanceof MyPromise) {
            thenResult.then(
              (result) => {
                thenFn[2][1](result);
              },
              (errorReason) => {
                thenFn[2][2](errorReason);
              }
            );
          } else {
            thenFn[2][2](thenResult);
          }
        } catch (e) {}
      });
    }
  }

  _runThenFulfilled(thenFn) {
    const onFulfilledFn = thenFn[0];

    if (
      !onFulfilledFn ||
      Object.prototype.toString.call(onFulfilledFn) !== "[object Function]"
    ) {
      thenFn[2][1](this.result);
      // const onRejectedFn = thenFn[1];
      // console.log(123);
      // if (
      //   onRejectedFn &&
      //   Object.prototype.toString.call(onRejectedFn) === "[object Function]"
      // ) {
      //   onRejectedFn(`onFulfilled is $onFulfilledFn`);
      // }
    } else {
      queueMicrotask(() => {
        try {
          const thenResult = onFulfilledFn(this.result);
          if (thenResult instanceof MyPromise) {
            thenResult.then(
              (result) => {
                thenFn[2][1](result);
              },
              (errorReason) => {
                thenFn[2][2](errorReason);
              }
            );
          } else {
            thenFn[2][1](thenResult);
          }
        } catch (e) {}
      });
    }
  }

  _checkStateCanChange() {
    return this.state === Promise_State.PENDING;
  }

  then(onFulfilled, onRejected) {
    // this._tryRunThen();
    const nextThen = [];
    const nextPromise = new MyPromise((resolve, reject) => {
      nextThen[1] = resolve;
      nextThen[2] = reject;
    });

    nextThen[0] = nextPromise;

    this.thenSet.push([onFulfilled, onRejected, nextThen]);

    queueMicrotask(() => this._tryRunThen());
    return nextThen[0];

    // 判断 pending
  }
}

MyPromise.defer = MyPromise.deferred = function () {
  let dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};

// const p1 = new MyPromise((resolve, reject) => {
//   resolve("promise1 reject");
// });

// p1.then().then((val) => {
//   console.log(val);
// });

// p1.then(
//   (val) => {
//     console.log(val);
//   },
//   (errorReason) => {
//     console.log("errorReason : " + errorReason);
//   }
// );

// const p3 = p1
//   .then((val) => {
//     console.log(val + " " + 1);
//     return 123;
//   })
//   .then((val) => {
//     console.log("next val " + val);
//     return new MyPromise((resolve, reject) => {
//       resolve("other promise resolve");
//     });
//   })

//   .then((val) => {
//     console.log("next next val " + val);
//     return "funk";
//   });

// p1.then((val) => {
//   console.log(val + 2);
//   return 345;
//   // return new MyPromise(() => {});
// });

// p3.then((val) => {
//   console.log("p3 : " + val);
// });

// p1.then((val) => {
//   console.log(val + 3);
// });

describe("Promises/A+ Tests", function () {
  promiseAplusTests.mocha(MyPromise);
});
