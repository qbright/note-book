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
    try {
      executerFn(this._resolveFn.bind(this), this._rejectedFn.bind(this));
    } catch (e) {
      this._rejectedFn.call(this, e);
    }
  }

  _resolveFn(result) {
    if (result instanceof MyPromise) {
      const resolve = this._runOneTimeFunction(this._resolveFn.bind(this));
      const reject = this._runOneTimeFunction(this._rejectedFn.bind(this));

      try {
        result.then(resolve, reject);
      } catch (e) {}
      return;
    }
    if (typeOf(result) === "Object" || typeOf(result) === "Function") {
      const thenFn = result.then;
      if (typeOf(thenFn) === "Function") {
        const resolve = this._runOneTimeFunction(this._resolveFn.bind(this));
        const reject = this._runOneTimeFunction(this._rejectedFn.bind(this));

        try {
          thenFn(resolve, reject);
        } catch (e) {}
        return;
      }
    }

    if (this._checkStateCanChange()) {
      this.state = Promise_State.FULFILLED;
      this.result = result;
      this._tryRunThen();
    }
  }

  _runOneTimeFunction(fn) {
    let isRun = false;
    return function (val) {
      if (!isRun) {
        isRun = true;
        fn(val);
      }
    };
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

    if (!onRejectedFn || typeOf(onRejectedFn) !== "Function") {
      thenFn[2][2](this.rejectedReason);
    } else {
      queueMicrotask(() => {
        try {
          const thenResult = onRejectedFn(this.rejectedReason);
          if (thenResult instanceof MyPromise) {
            if (thenFn[2][0] === thenResult) {
              thenFn[2][2](new TypeError());
            } else {
              const resolve = this._runOneTimeFunction((result) => {
                thenFn[2][1](result);
              });
              const reject = this._runOneTimeFunction((errorReason) => {
                thenFn[2][2](errorReason);
              });
              try {
                thenResult.then(resolve, reject);
              } catch (e) {}
            }
          } else {
            if (
              typeOf(thenResult) === "Object" ||
              typeOf(thenResult) === "Function"
            ) {
              const thenFunction = thenResult.then;
              if (typeOf(thenFunction) === "Function") {
                try {
                  thenFunction.call(
                    thenResult,
                    this._runOneTimeFunction((val) => {
                      if (
                        typeOf(val) === "Object" ||
                        typeOf(val) === "Function"
                      ) {
                        if (val instanceof MyPromise) {
                          const resolve = this._runOneTimeFunction(
                            thenFn[2][1]
                          );
                          const reject = this._runOneTimeFunction(thenFn[2][2]);
                          try {
                            val.then(resolve, reject);
                          } catch (e) {}
                          return;
                        }

                        const valThen = val.then;
                        if (typeOf(valThen) === "Function") {
                          const resolve = this._runOneTimeFunction(
                            thenFn[2][1]
                          );
                          const reject = this._runOneTimeFunction(thenFn[2][2]);
                          try {
                            valThen(resolve, reject);
                          } catch (e) {}
                          return;
                        }
                      }
                      thenFn[2][1](val);
                    }),
                    this._runOneTimeFunction((val) => {
                      if (
                        typeOf(val) === "Object" ||
                        typeOf(val) === "Function"
                      ) {
                        const valThen = val.then;
                        if (typeOf(valThen) === "Function") {
                          const resolve = this._runOneTimeFunction(
                            thenFn[2][1]
                          );
                          const reject = this._runOneTimeFunction(thenFn[2][2]);
                          try {
                            valThen(resolve, reject);
                          } catch (e) {}
                          return;
                        }
                      }

                      thenFn[2][2](val);
                    })
                  );
                } catch (e) {}

                return;
              }
            }
            thenFn[2][1](thenResult);
          }
        } catch (e) { 
          thenFn[2][2](e)
        }

      });
    }
  }

  _runThenFulfilled(thenFn) {
    const onFulfilledFn = thenFn[0];

    if (!onFulfilledFn || typeOf(onFulfilledFn) !== "Function") {
      thenFn[2][1](this.result);
    } else {
      queueMicrotask(() => {
        try {
          const thenResult = onFulfilledFn(this.result);
          if (thenResult instanceof MyPromise) {
            if (thenFn[2][0] === thenResult) {
              thenFn[2][2](new TypeError());
            } else {
              const resolve = this._runOneTimeFunction((result) => {
                thenFn[2][1](result);
              });
              const reject = this._runOneTimeFunction((errorReason) => {
                thenFn[2][2](errorReason);
              });
              try {
                thenResult.then(resolve, reject);
              } catch (e) {
                console.log("453453fdfd453");
              }
            }
          } else {
            if (
              typeOf(thenResult) === "Object" ||
              typeOf(thenResult) === "Function"
            ) {
              const thenFunction = thenResult.then;
              if (typeOf(thenFunction) === "Function") {
                try {
                  thenFunction.call(
                    thenResult,
                    this._runOneTimeFunction((val) => {
                      if (
                        typeOf(val) === "Object" ||
                        typeOf(val) === "Function"
                      ) {
                        if (val instanceof MyPromise) {
                          const resolve = this._runOneTimeFunction(
                            thenFn[2][1]
                          );
                          const reject = this._runOneTimeFunction(thenFn[2][2]);
                          try {
                            val.then(resolve, reject);
                          } catch (e) {
                            console.log("4534sdfsd53453");
                            reject(e);
                          }
                          return;
                        }
                        const valThen = val.then;

                        if (typeOf(valThen) === "Function") {
                          const resolve = this._runOneTimeFunction(
                            thenFn[2][1]
                          );
                          const reject = this._runOneTimeFunction(thenFn[2][2]);
                          try {
                            valThen(resolve, reject);
                          } catch (e) {
                            console.log("45adfg3453453");
                          }
                          return;
                        }
                      }
                      thenFn[2][1](val);
                    }),
                    this._runOneTimeFunction((val) => {
                      if (
                        typeOf(val) === "Object" ||
                        typeOf(val) === "Function"
                      ) {
                        const valThen = val.then;
                        if (typeOf(valThen) === "Function") {
                          const resolve = this._runOneTimeFunction(
                            thenFn[2][1]
                          );
                          const reject = this._runOneTimeFunction(thenFn[2][2]);
                          try {
                            valThen(resolve, reject);
                          } catch (e) {
                            console.log("dgdg453453453");
                          }
                          return;
                        }
                      }
                      thenFn[2][2](val);
                    })
                  );
                } catch (e) {
                  console.log("da453453453");
                }
                return;
              }
            }
            thenFn[2][1](thenResult);
          }
        } catch (e) {
          console.log("345345435435");
          thenFn[2][2](e);
        }
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

function typeOf(check) {
  const type = Object.prototype.toString.call(check);
  return type.match(/\[object\ (.*)\]/)[1];
}

MyPromise.defer = MyPromise.deferred = function () {
  let dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};

// const p = new MyPromise((resolve) => resolve("hello"));
// let c = 0;
// function a(value) {
//   ++c;
//   return {
//     c: c,
//     then: function (onFulfilled) {
//       setTimeout(() => {
//         console.log(111, value, onFulfilled.toString());
//         onFulfilled(value);
//         console.log(4444444);
//         onFulfilled(345);
//       });

//       // setTimeout(() => {
//       //   console.log(222, value);
//       //   onFulfilled(345);
//       // });
//     },
//   };
// }

// function b() {
//   return a(a(a(a(44))));
// }

// const p2 = p.then((val) => {
//   return b();
// });

// p2.then((val) => {
//   console.log("fff", val);
// });

describe("Promises/A+ Tests", function () {
  promiseAplusTests.mocha(MyPromise);
});
