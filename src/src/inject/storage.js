
 /**
  * https://developer.chrome.com/extensions/storage
  * 
  * added some error checking, methods need to be wrapped in try/catch
  * 
  */


class ExtStorage {
	constructor (
		utils,
		config = {}
	) {
		this.config = Object.assign({}, CONFIG.storage, config);
		this.storage = chrome.storage[this.config.use];

		this.utils = utils;
	}

	// getNamespaceKey(key, namespace=this.namespace) {
	// 	return `${namespace ? namespace + '-' : ''}${key}`;
	// }

	async removeStorageItems(keys = []) {

		let res, rej;
		const promise = new Promise((res_, rej_) => {
			res = res_;
			rej = rej_;
		}); 

		// Test retrieving keys that do not exist
		this.storage.remove(keys = [], async () => {
			if (chrome.runtime.lastError) {
				rej({
					keys,
					error: `Error ext: removeStorageItems - ${chrome.runtime.lastError}`
				});
			} else {
				const size = await this.getStorageSize();
				res(size);
			}
		});

		return promise;
	}

	async clearStorage() {

		let res, rej;
		const promise = new Promise((res_, rej_) => {
			res = res_;
			rej = rej_;
		}); 

		// Test retrieving keys that do not exist
		this.storage.clear(async () => {
			if (chrome.runtime.lastError) {
				rej({
					keys,
					error: `Error ext: clearStorage - ${chrome.runtime.lastError}`
				});
			} else {
				const size = await this.getStorageSize();
				res(size);
			}
		});

		return promise;
	}

	async getStorageSize(keys = null, getRemainingSpace = false) {

		let res, rej;
		const promise = new Promise((res_, rej_) => {
			res = res_;
			rej = rej_;
		}); 

		// Test retrieving keys that do not exist
		this.storage.getBytesInUse(keys, async (bytesInUse) => {
			if (chrome.runtime.lastError) {
				rej({
					keys,
					error: `Error ext: getStorageSize - ${chrome.runtime.lastError}`
				});
			} else {
				const space = getRemainingSpace ? this.config.limit - bytesInUse : bytesInUse
				res(space);
			}
		});

		return promise;
	}

	/**
	 * 
	 * @param {*} keys - string or string[] or null. items not found will not be returned
	 */
	async getStorageItems(keys = null) {
		let res, rej;
		const promise = new Promise((res_, rej_) => {
			res = res_;
			rej = rej_;
		}); 

		// Test retrieving keys that do not exist
		this.storage.get(keys, async (result) => {
			if (chrome.runtime.lastError) {
				rej({
					keys,
					error: `Error ext: getStorageItems - ${chrome.runtime.lastError}`
				});
			} else {
				res(result);
			}
		});

		return promise;
	}

	async setStorageItems(keyValueObject = {}, merge=true) {
		let res, rej;
		const promise = new Promise((res_, rej_) => {
			res = res_;
			rej = rej_;
		}); 

		if (merge) {
			const currentValues = await this.getStorageItems(Object.keys(keyValueObject));
			const merged = this.utils.merge(currentValues, keyValueObject);

			this.storage.set(merged, async () => {
				if (chrome.runtime.lastError) {
					rej({
						keys,
						error: `Error ext: setStorageItems - ${chrome.runtime.lastError}`
					});
				} else {
					const size = await this.getStorageSize();
					res(size);
				}
			});


		} else {
			this.storage.set(keyValueObject, async () => {
				if (chrome.runtime.lastError) {
					rej({
						keys,
						error: `Error ext: setStorageItems - ${chrome.runtime.lastError}`
					});
				} else {
					const size = await this.getStorageSize();
					res(size);
				}
			});
		}

		return promise;
	}

	async subscribeToStorage(callback) {
		let res, rej;
		const promise = new Promise((res_, rej_) => {
			res = res_;
			rej = rej_;
		}); 

		chrome.storage.onChanged.addListener(async (changes, namespace) => {

			if (chrome.runtime.lastError) {
				rej({
					keys,
					error: `Error ext: setStorageItems - ${chrome.runtime.lastError}`
				});
			} else {
				const callbackResults = await callback(changes, namespace);
				res(callbackResults);
			}

			for (let key in changes) {
				const storageChange = changes[key];

				console.log(key, namespace, storageChange.oldValue, storageChange.newValue);
			}
		});

		return promise;
	}

}


