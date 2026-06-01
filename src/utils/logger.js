'use strict';

function info(message) {
  console.log(new Date().toISOString() + ' [INFO] ' + message);
}

function warn(message) {
  console.warn(new Date().toISOString() + ' [WARN] ' + message);
}

function error(message) {
  console.error(new Date().toISOString() + ' [ERROR] ' + message);
}

module.exports = { info, warn, error };
