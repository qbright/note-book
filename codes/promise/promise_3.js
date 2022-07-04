import promiseAplusTests from "promises-aplus-tests";
function myPromise(executor) {
  this.status = "pending";
  this.value = null;
  this.errorReason = null;
  this.onFulFilledArray = [];
  this.onRejectedArray = [];

  const resolved = (value) => {
    setTimeout(() => {
      if (this.status === "pending") {
        this.value = value;
        this.status = "fullfilled";
        this.onFulFilledArray.forEach((fuc) => fuc(value));
      }
    });
  };
  const rejected = (errorReason) => {
    setTimeout(() => {
      if (this.status === "pending") {
        this.errorReason = errorReason;
        this.status = "rejected";
        this.onRejectedArray.forEach((fuc) => fuc(errorReason));
      }
    });
  };
  try {
    executor(resolved, rejected);
  } catch (error) {
    rejected(error);
  }
}

myPromise.prototype.then = function (onfulfilled, onrejected) {
  let newMyPromise;
  if (this.status === "fullfilled") {
    return (newMyPromise = new myPromise((resolve, reject) => {
      // 异步暂时用 settimeout 来实现
      setTimeout(() => {
        try {
          let results = onfulfilled(this.value);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
    }));
  }
  if (this.status === "rejected") {
    // 异步暂时用 settimeout 来实现
    return (newMyPromise = new myPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          let results = onrejected(this.value);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
    }));
  }
  if (this.status === "pending") {
    // 异步实现的完善，如果没有pending 这一层的话，在 new promise 里 settimeout 里执行 resolve 会失效。
    // 因为settimeout 是异步的，而onfulfilled 的执行是同步的。
    // 这时候状态仍然是pending，所以我们需要手动再在pending的时候去触发一次调用
    return (newMyPromise = new myPromise((resolve, reject) => {
      this.onFulFilledArray.push(() => {
        try {
          let results = onfulfilled(this.value);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
      this.onRejectedArray.push(() => {
        try {
          let results = onrejected(this.value);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
    }));
  }
};

myPromise.defer = myPromise.deferred = function () {
	let dfd = {};
	dfd.promise = new myPromise((resolve, reject) => {
	  dfd.resolve = resolve;
	  dfd.reject = reject;
	});
	return dfd;
};
      


describe("Promises/A+ Tests", function () {
	promiseAplusTests.mocha(myPromise);
    });
