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

MyPromise.all = function (promiseSet) {
  let dfResolve;
  let dfReject;
  let finishCount = 0;
  let resultSet = [];
  let p = new MyPromise((resolve, reject) => {
    dfResolve = resolve;
    dfReject = reject;
  });

  for (let i = 0; i < promiseSet.length; i++) {
    let promise = promiseSet[i];
    if (promise instanceof MyPromise) {
      promise.then(
        (val) => {
          ++finishCount;
          resultSet[i] = val;
          if (finishCount === promiseSet.length) {
            dfResolve(resultSet);
          }
        },
        (errorReason) => {
          dfReject(errorReason);
        }
      );
    } else {
      ++finishCount;
      resultSet[i] = promise;
      if (finishCount === promiseSet.length) {
        dfResolve(resultSet);
      }
    }
  }

  return p;
};
MyPromise.race = function (promiseSet) {
  let dfResolve;
  let dfReject;
  let p = new MyPromise((resolve, reject) => {
    dfResolve = resolve;
    dfReject = reject;
  });

  for (let i = 0; i < promiseSet.length; i++) {
    let promise = promiseSet[i];
    if (promise instanceof MyPromise) {
      promise.then(dfResolve, dfReject);
    } else {
      dfResolve(promise);
    }
  }

  return p;
};
MyPromise.any = function (promiseSet) {
  let dfResolve;
  let dfReject;

  let rejectCount = 0;
  let rejectSet = [];

  let p = new MyPromise((resolve, reject) => {
    dfResolve = resolve;
    dfReject = reject;
  });

  for (let i = 0; i < promiseSet.length; i++) {
    let promise = promiseSet[i];
    if (promise instanceof MyPromise) {
      promise.then(
        (val) => {
          dfResolve(val);
        },
        (errorReason) => {
          ++rejectCount;
          rejectSet.push(errorReason);
          if (rejectCount === promiseSet.length) {
            dfReject(rejectSet);
          }
        }
      );
    } else {
      dfResolve(promise);
    }
  }

  return p;
};
MyPromise.allSettled = function (promiseSet) {
  let dfResolve;
  let dfReject;
  let finishCount = 0;
  let resultSet = [];
  let p = new MyPromise((resolve, reject) => {
    dfResolve = resolve;
    dfReject = reject;
  });

  for (let i = 0; i < promiseSet.length; i++) {
    let promise = promiseSet[i];
    if (promise instanceof MyPromise) {
      promise.then(
        (val) => {
          ++finishCount;
          resultSet[i] = { status: "fulfilled", value: val };
          if (finishCount === promiseSet.length) {
            dfResolve(resultSet);
          }
        },
        (errorReason) => {
          ++finishCount;
          resultSet[i] = { status: "rejected", reason: errorReason };
          if (finishCount === promiseSet.length) {
            dfReject(errorReason);
          }
        }
      );
    } else {
      ++finishCount;
      resultSet[i] = { status: "fulfilled", value: promise };
      if (finishCount === promiseSet.length) {
        dfResolve(resultSet);
      }
    }
  }

  return p;
};
MyPromise.resolve = function (result) {
  return new MyPromise((resolve) => resolve(result));
};
MyPromise.reject = function (errorReason) {
  return new MyPromise((_, reject) => reject(errorReason));
};
