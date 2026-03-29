import _ from "lodash";

export const throttledLog = _.throttle((message) => {
  console.log(message);
}, 500);

export const throttledWarn = _.throttle((message) => {
  console.warn(message);
}, 500);
