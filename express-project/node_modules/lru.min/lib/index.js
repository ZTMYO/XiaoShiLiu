"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLRU = void 0;
const createLRU = (options) => {
    let { max } = options;
    if (!(Number.isInteger(max) && max > 0))
        throw new TypeError('`max` must be a positive integer');
    let size = 0;
    let head = 0;
    let tail = 0;
    let free = [];
    const { onEviction } = options;
    const keyMap = new Map();
    const keyList = new Array(max).fill(undefined);
    const valList = new Array(max).fill(undefined);
    const next = new Array(max).fill(0);
    const prev = new Array(max).fill(0);
    const setTail = (index, type) => {
        if (index === tail)
            return;
        const nextIndex = next[index];
        const prevIndex = prev[index];
        if (index === head)
            head = nextIndex;
        else if (type === 'get' || prevIndex !== 0)
            next[prevIndex] = nextIndex;
        if (nextIndex !== 0)
            prev[nextIndex] = prevIndex;
        next[tail] = index;
        prev[index] = tail;
        next[index] = 0;
        tail = index;
    };
    const _evict = () => {
        const evictHead = head;
        const key = keyList[evictHead];
        onEviction === null || onEviction === void 0 ? void 0 : onEviction(key, valList[evictHead]);
        keyMap.delete(key);
        keyList[evictHead] = undefined;
        valList[evictHead] = undefined;
        head = next[evictHead];
        if (head !== 0)
            prev[head] = 0;
        size--;
        if (size === 0)
            head = tail = 0;
        free.push(evictHead);
        return evictHead;
    };
    return {
        /** Adds a key-value pair to the cache. Updates the value if the key already exists. */
        set(key, value) {
            if (key === undefined)
                return;
            let index = keyMap.get(key);
            if (index === undefined) {
                index = size === max ? _evict() : free.length > 0 ? free.pop() : size;
                keyMap.set(key, index);
                keyList[index] = key;
                size++;
            }
            else
                onEviction === null || onEviction === void 0 ? void 0 : onEviction(key, valList[index]);
            valList[index] = value;
            if (size === 1)
                head = tail = index;
            else
                setTail(index, 'set');
        },
        /** Retrieves the value for a given key and moves the key to the most recent position. */
        get(key) {
            const index = keyMap.get(key);
            if (index === undefined)
                return;
            if (index !== tail)
                setTail(index, 'get');
            return valList[index];
        },
        /** Retrieves the value for a given key without changing its position. */
        peek: (key) => {
            const index = keyMap.get(key);
            return index !== undefined ? valList[index] : undefined;
        },
        /** Checks if a key exists in the cache. */
        has: (key) => keyMap.has(key),
        /** Iterates over all keys in the cache, from most recent to least recent. */
        *keys() {
            let current = tail;
            for (let i = 0; i < size; i++) {
                yield keyList[current];
                current = prev[current];
            }
        },
        /** Iterates over all values in the cache, from most recent to least recent. */
        *values() {
            let current = tail;
            for (let i = 0; i < size; i++) {
                yield valList[current];
                current = prev[current];
            }
        },
        /** Iterates over `[key, value]` pairs in the cache, from most recent to least recent. */
        *entries() {
            let current = tail;
            for (let i = 0; i < size; i++) {
                yield [keyList[current], valList[current]];
                current = prev[current];
            }
        },
        /** Iterates over each value-key pair in the cache, from most recent to least recent. */
        forEach: (callback) => {
            let current = tail;
            for (let i = 0; i < size; i++) {
                const key = keyList[current];
                const value = valList[current];
                callback(value, key);
                current = prev[current];
            }
        },
        /** Deletes a key-value pair from the cache. */
        delete(key) {
            const index = keyMap.get(key);
            if (index === undefined)
                return false;
            onEviction === null || onEviction === void 0 ? void 0 : onEviction(key, valList[index]);
            keyMap.delete(key);
            free.push(index);
            keyList[index] = undefined;
            valList[index] = undefined;
            const prevIndex = prev[index];
            const nextIndex = next[index];
            if (prevIndex !== 0)
                next[prevIndex] = nextIndex;
            if (nextIndex !== 0)
                prev[nextIndex] = prevIndex;
            if (index === head)
                head = nextIndex;
            if (index === tail)
                tail = prevIndex;
            size--;
            return true;
        },
        /** Evicts the oldest item or the specified number of the oldest items from the cache. */
        evict: (number) => {
            let toPrune = Math.min(number, size);
            while (toPrune > 0) {
                _evict();
                toPrune--;
            }
        },
        /** Clears all key-value pairs from the cache. */
        clear() {
            if (typeof onEviction === 'function') {
                const iterator = keyMap.values();
                for (let result = iterator.next(); !result.done; result = iterator.next())
                    onEviction(keyList[result.value], valList[result.value]);
            }
            keyMap.clear();
            keyList.fill(undefined);
            valList.fill(undefined);
            free = [];
            size = 0;
            head = tail = 0;
        },
        /** Resizes the cache to a new maximum size, evicting items if necessary. */
        resize: (newMax) => {
            if (!(Number.isInteger(newMax) && newMax > 0))
                throw new TypeError('`max` must be a positive integer');
            if (newMax === max)
                return;
            if (newMax < max) {
                let current = tail;
                const preserve = Math.min(size, newMax);
                const remove = size - preserve;
                const newKeyList = new Array(newMax);
                const newValList = new Array(newMax);
                const newNext = new Array(newMax);
                const newPrev = new Array(newMax);
                for (let i = 1; i <= remove; i++)
                    onEviction === null || onEviction === void 0 ? void 0 : onEviction(keyList[i], valList[i]);
                for (let i = preserve - 1; i >= 0; i--) {
                    newKeyList[i] = keyList[current];
                    newValList[i] = valList[current];
                    newNext[i] = i + 1;
                    newPrev[i] = i - 1;
                    keyMap.set(newKeyList[i], i);
                    current = prev[current];
                }
                head = 0;
                tail = preserve - 1;
                size = preserve;
                keyList.length = newMax;
                valList.length = newMax;
                next.length = newMax;
                prev.length = newMax;
                for (let i = 0; i < preserve; i++) {
                    keyList[i] = newKeyList[i];
                    valList[i] = newValList[i];
                    next[i] = newNext[i];
                    prev[i] = newPrev[i];
                }
                free = [];
                for (let i = preserve; i < newMax; i++)
                    free.push(i);
            }
            else {
                const fill = newMax - max;
                keyList.push(...new Array(fill).fill(undefined));
                valList.push(...new Array(fill).fill(undefined));
                next.push(...new Array(fill).fill(0));
                prev.push(...new Array(fill).fill(0));
            }
            max = newMax;
        },
        /** Returns the maximum number of items that can be stored in the cache. */
        get max() {
            return max;
        },
        /** Returns the number of items currently stored in the cache. */
        get size() {
            return size;
        },
        /** Returns the number of currently available slots in the cache before reaching the maximum size. */
        get available() {
            return max - size;
        },
    };
};
exports.createLRU = createLRU;
