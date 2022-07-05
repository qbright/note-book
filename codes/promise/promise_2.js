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
    if (this._checkStateCanChange()) {
      this.state = Promise_State.FULFILLED;
      this.result = result;
      console.log(this.result);
      this._tryRunThen();
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
              thenResult.then(
                (result) => {
                  thenFn[2][1](result);
                },
                (errorReason) => {
                  thenFn[2][2](errorReason);
                }
              );
            }
          } else {
            if (
              typeOf(thenResult) === "Object" ||
              typeOf(thenResult) === "Function"
            ) {
              const thenFunction = thenResult.then;
              if (typeOf(thenFunction) === "Function") {
                thenFunction.call(
                  thenResult,
                  (val) => {
                    if (
                      typeOf(val) === "Object" ||
                      typeOf(val) === "Function"
                    ) {
                      const valThen = val.then;
                      if (typeOf(valThen) === "Function") {
                        valThen(thenFn[2][1]);
                        return;
                      }
                    }
                    thenFn[2][1](val);
                  },
                  (val) => {
                    if (
                      typeOf(val) === "Object" ||
                      typeOf(val) === "Function"
                    ) {
                      const valThen = val.then;
                      if (typeOf(valThen) === "Function") {
                        valThen(thenFn[2][2]);
                        return;
                      }
                    }

                    thenFn[2][2](val);
                  }
                );
                return;
              }
            }
            thenFn[2][1](thenResult);
          }
        } catch (e) {
          thenFn[2][2](e);
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
              thenResult.then(
                (result) => {
                  thenFn[2][1](result);
                },
                (errorReason) => {
                  thenFn[2][2](errorReason);
                }
              );
            }
          } else {
            if (
              typeOf(thenResult) === "Object" ||
              typeOf(thenResult) === "Function"
            ) {
              const thenFunction = thenResult.then;
              if (typeOf(thenFunction) === "Function") {
                thenFunction.call(
                  thenResult,
                  (val) => {
                    if (
                      typeOf(val) === "Object" ||
                      typeOf(val) === "Function"
                    ) {
                      const valThen = val.then;
                      if (typeOf(valThen) === "Function") {
                        valThen(thenFn[2][1]);
                        return;
                      }
                    }
                    thenFn[2][1](val);
                  },
                  (val) => {
                    if (
                      typeOf(val) === "Object" ||
                      typeOf(val) === "Function"
                    ) {
                      const valThen = val.then;
                      if (typeOf(valThen) === "Function") {
                        valThen(thenFn[2][2]);
                        return;
                      }
                    }
                    thenFn[2][2](val);
                  }
                );
                return;
              }
            }
            thenFn[2][1](thenResult);
          }
        } catch (e) {
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

describe("Promises/A+ Tests", function () {
  promiseAplusTests.mocha(MyPromise);
});
