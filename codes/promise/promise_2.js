import promiseAplusTests from "promises-aplus-tests";
//  mocha ./promise/promise_2.js --reporter doc | cat promise/head.html - promise/tail.html >  promise/result.html
const Promise_State = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class MyPromise1 {
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
      } catch (e) {
        reject(e);
        //
      }
      return;
    }
    if (typeOf(result) === "Object" || typeOf(result) === "Function") {
      try {
        const thenFn = result.then;
        if (typeOf(thenFn) === "Function") {
          const resolve = this._runOneTimeFunction(this._resolveFn.bind(this));
          const reject = this._runOneTimeFunction(this._rejectedFn.bind(this));

          thenFn(resolve, reject);
          return;
        }
      } catch (e) {
        //

        this._rejectedFn.call(this, e);
        ///
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

  _runBothOneTimeFunction(resolveFn, rejectFn) {
    let isRun = false;
    return [
      function (val) {
        if (!isRun) {
          isRun = true;
          resolveFn(val);
        }
      },

      function (val) {
        if (!isRun) {
          isRun = true;
          rejectFn(val);
        }
      },
    ];
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
              } catch (e) {
                //
                reject(e);
              }
            }
          } else {
            if (
              typeOf(thenResult) === "Object" ||
              typeOf(thenResult) === "Function"
            ) {
              const thenFunction = thenResult.then;
              if (typeOf(thenFunction) === "Function") {
                const [resolvePromise, rejectPromise] =
                  this._runBothOneTimeFunction(
                    (val) => {
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
                            //
                            reject(e);
                          }
                          return;
                        }
                        const [resolve, reject] = this._runBothOneTimeFunction(
                          thenFn[2][1],
                          thenFn[2][2]
                        );

                        try {
                          const valThen = val.then;
                          if (typeOf(valThen) === "Function") {
                            valThen(resolve, reject);
                            return;
                          }
                        } catch (e) {
                          reject(e);
                          return;
                        }
                      }
                      thenFn[2][1](val);
                    },
                    (val) => {
                      thenFn[2][2](val);
                    }
                  );

                try {
                  thenFunction.call(thenResult, resolvePromise, rejectPromise);
                } catch (e) {
                  //
                  rejectPromise(e);
                  // thenFn[2][2](e);
                }

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
              const resolve = this._runOneTimeFunction((result) => {
                thenFn[2][1](result);
              });
              const reject = this._runOneTimeFunction((errorReason) => {
                thenFn[2][2](errorReason);
              });
              try {
                thenResult.then(resolve, reject);
              } catch (e) {
                //
                reject(e);
              }
            }
          } else {
            if (
              typeOf(thenResult) === "Object" ||
              typeOf(thenResult) === "Function"
            ) {
              const thenFunction = thenResult.then;
              if (typeOf(thenFunction) === "Function") {
                const [resolvePromise, rejectPromise] =
                  this._runBothOneTimeFunction(
                    (val) => {
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
                            //
                            reject(e);
                          }
                          return;
                        }
                        const [resolve, reject] = this._runBothOneTimeFunction(
                          thenFn[2][1],
                          thenFn[2][2]
                        );
                        try {
                          const valThen = val.then;

                          if (typeOf(valThen) === "Function") {
                            valThen(resolve, reject);

                            return;
                          }
                        } catch (e) {
                          reject(e);
                          return;
                        }
                      }
                      thenFn[2][1](val);
                    },
                    (val) => {
                      thenFn[2][2](val);
                    }
                  );
                try {
                  thenFunction.call(thenResult, resolvePromise, rejectPromise);
                } catch (e) {
                  rejectPromise(e);
                }
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
const MyPromise = MyPromise1;
// const MyPromise = Promise;
MyPromise.defer = MyPromise.deferred = function () {
  let dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};

const promise = new MyPromise((resolve) => resolve({ dummy: "dummy" }));
const promise1 = promise.then(() => {
  return (function () {
    const d = MyPromise.deferred();
    setTimeout(() => {
      d.resolve({ sentinel: "sentinel" });
    }, 50);

    return {
      then: function (resolvePromise) {
        resolvePromise(d.promise);
        throw other;
      },
    };
  })();
});
console.log(promise1);
promise1.then((value) => {
  console.log("end", value);
});

describe("Promises/A+ Tests", function () {
  promiseAplusTests.mocha(MyPromise);
});
