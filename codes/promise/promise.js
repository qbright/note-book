import promiseAplusTests from "promises-aplus-tests";
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

  _resolveFn(result) {
    const [resolve, reject] = this._runBothOneTimeFunction(
      this._resolveFn.bind(this),
      this._rejectedFn.bind(this)
    );
    try {
      if (result instanceof MyPromise) {
        result.then(resolve, reject);
        return;
      }

      if (typeOf(result) === "Object" || typeOf(result) === "Function") {
        const thenFn = result.then;
        if (typeOf(thenFn) === "Function") {
          thenFn(resolve, reject);
          return;
        }
      }
    } catch (e) {
      reject(e);
      return;
    }
    if (this._checkStateCanChange()) {
      this.state = Promise_State.FULFILLED;
      this.result = result;
      this._tryRunThen();
    }
  }

  _runBothOneTimeFunction(resolveFn, rejectFn) {
    let isRun = false;

    function getMutuallyExclusiveFn(fn) {
      return function (val) {
        if (!isRun) {
          isRun = true;
          fn(val);
        }
      };
    }
    return [
      getMutuallyExclusiveFn(resolveFn),
      getMutuallyExclusiveFn(rejectFn),
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

  _runThenWrap(onFn, fnVal, prevPromise, resolve, reject) {
    this._runMicroTask(() => {
      try {
        const thenResult = onFn(fnVal);
        if (thenResult instanceof MyPromise) {
          if (prevPromise === thenResult) {
            reject(new TypeError());
          } else {
            thenResult.then(resolve, reject);
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
                  (result) => {
                    try {
                      if (result instanceof MyPromise) {
                        result.then(resolve, reject);
                        return;
                      }

                      if (
                        typeOf(result) === "Object" ||
                        typeOf(result) === "Function"
                      ) {
                        const thenFn = result.then;
                        if (typeOf(thenFn) === "Function") {
                          thenFn(resolve, reject);
                          return;
                        }
                      }
                    } catch (e) {
                      reject(e);
                      return;
                    }
                    resolve(result);
                  },
                  (errorReason) => {
                    reject(errorReason);
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
          resolve(thenResult);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  _runThenRejected(thenFn) {
    const onRejectedFn = thenFn[1];
    const [resolve, reject] = this._runBothOneTimeFunction(
      thenFn[2][1],
      thenFn[2][2]
    );
    if (!onRejectedFn || typeOf(onRejectedFn) !== "Function") {
      reject(this.rejectedReason);
    } else {
      this._runThenWrap(
        onRejectedFn,
        this.rejectedReason,
        thenFn[2][0],
        resolve,
        reject
      );
    }
  }

  _runThenFulfilled(thenFn) {
    const onFulfilledFn = thenFn[0];
    const [resolve, reject] = this._runBothOneTimeFunction(
      thenFn[2][1],
      thenFn[2][2]
    );
    if (!onFulfilledFn || typeOf(onFulfilledFn) !== "Function") {
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

  _runMicroTask(fn) {
    queueMicrotask(fn);
  }

  _checkStateCanChange() {
    return this.state === Promise_State.PENDING;
  }

  then(onFulfilled, onRejected) {
    const nextThen = [];
    const nextPromise = new MyPromise((resolve, reject) => {
      nextThen[1] = resolve;
      nextThen[2] = reject;
    });
    nextThen[0] = nextPromise;
    this.thenSet.push([onFulfilled, onRejected, nextThen]);
    this._runMicroTask(() => this._tryRunThen());
    return nextThen[0];
  }
}

function typeOf(check) {
  const type = Object.prototype.toString.call(check);
  return type.match(/\[object\ (.*)\]/)[1];
}

///// end

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
