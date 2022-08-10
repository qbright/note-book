Function.prototype.bind = function (thisContext, ...oargs) {
  const fn = this;

  return function (...args) {
    fn.apply(thisContext, [].concat(oargs, args));
  };
};

Function.prototype.apply = function (thisContext, args) {
  thisContext = Object(thisContext);
  thisContext.fn = this;
  const result = thisContext.fn(...args);
  delete thisContext.fn;
  return result;
};

