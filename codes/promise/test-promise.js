const promise = new Promise((resolve, reject) => {
  resolve();
});

promise
  .then(() => {
    return {
      then: (onFulfilled, onReject) => {
        // throw 12;
        onFulfilled(123);
        onFulfilled(234);
      },
    };
  })
  .then(() => {});

Promise.all([
  1,
  new Promise((resolve) => {
    resolve();
  }),
  4,
]);
