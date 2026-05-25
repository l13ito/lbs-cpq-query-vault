const ext = typeof browser !== "undefined" ? browser : chrome;

(function attachCompatibilityHelpers() {
  const isPromiseApi = typeof browser !== "undefined";

  function promisifyChrome(call) {
    return new Promise((resolve, reject) => {
      call((result) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(result);
      });
    });
  }

  window.ext = ext;
  window.extCompat = {
    async storageGet(keys) {
      if (isPromiseApi) {
        return ext.storage.local.get(keys);
      }

      return promisifyChrome((done) => ext.storage.local.get(keys, done));
    },

    async storageSet(values) {
      if (isPromiseApi) {
        return ext.storage.local.set(values);
      }

      return promisifyChrome((done) => ext.storage.local.set(values, done));
    },

    async queryTabs(queryInfo) {
      if (isPromiseApi) {
        return ext.tabs.query(queryInfo);
      }

      return promisifyChrome((done) => ext.tabs.query(queryInfo, done));
    },

    async createTab(createProperties) {
      if (isPromiseApi) {
        return ext.tabs.create(createProperties);
      }

      return promisifyChrome((done) => ext.tabs.create(createProperties, done));
    }
  };
})();