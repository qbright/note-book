import promiseAplusTests from "promises-aplus-tests";
class MyPromise {
  constructor(fn) {
    this.state = "pending";
    this.nextResolve = null;
    this.nextReeeject = null;
    fn(this._resolve.bind(this), this._reject.bind(this));
  }

  _checkCanChange() {
    return this.state === "pending";
  }

  _resolve(result) {
    if (this._checkCanChange()) {
      this.state = "fulfilled";
      this.result = result;
      this._runThen();
    }
  }

  _reject(errorReason) {
    if (this._checkCanChange()) {
      this.state = "rejected";
      this.errorReason = errorReason;
    }
  }

  _runThen() {
    if (this.successFn) {
      queueMicrotask(() => {
        const returnData = this.successFn.call(this, this.result);
        if (returnData instanceof MyPromise) {
          returnData.then((value) => {
            this.nextResolve(value);
          });
        } else {
          this.nextResolve(returnData);
        }
      });
    }
  }

  then(successFn, errorFn) {
    this.successFn = successFn;
    this.errorFn = errorFn;
    if (this.state !== "pending") {
      this._runThen();
    } else {
    }
    return new MyPromise((resolve, reject) => {
      this.nextResolve = resolve;
      this.nextReject = reject;
    });
  }

  catch(errorReason) {
    return this.then(null, errorReason);
  }

  finally() {}

  static resolve(result) {
    return new MyPromise((resolve) => {
      resolve(result);
    });
  }

  static reject(errorReason) {
    return new MyPromise((resolve, reject) => {
      reject(errorReason);
    });
  }
}

Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};

// promiseAplusTests(MyPromise, { reporter: 'list','reporter-option':['output=hello.txt'] }, (err) => {
// 	console.log(err);
// });


describe("Promises/A+ Tests", function () {
	promiseAplusTests.mocha(Promise);
    });

// const p1 = new MyPromise((resolve, reject) => {
//   console.log(123);
//   resolve("hello resolve");
// });

// const p2 = p1
//   .then((result) => {
//     console.log(`hello then ${result} `);
//     return "hello return1";
//   })
//   .then((val) => {
//     console.log(val);
//     return new MyPromise((resolve, reject) => {
//       resolve("then  then then");
//     });
//   })
//   .then((value) => {
//     return new MyPromise((resolve, reject) => {
//       resolve("then1 then1 then1");
//     });
//   })
//   .then((value) => {
//     console.log(value);
//   });

// console.log(p2);
