class PageBase {

    constructor(
        utils
    ) {
        this.utils = utils;

    }

    async scroll(distance = 0.80,  minScrollDelay = 250, scrollingTime = 500) {
        const randomScrollDelay = minScrollDelay + Math.round(Math.random() * minScrollDelay);
        const innerHeight = window.innerHeight;
        const remainingHeight = 1 - distance;

        let res, rej;
        const promise = new Promise((res_, rej_) => {
            res = res_;
            rej = rej_;
        });
        setTimeout(() => {
            const randomDist = window.scrollY + (distance * innerHeight);

            // this could be negative, if so do not add it.
            const remainingDistance = Math.round(Math.random() * (remainingHeight * innerHeight)) 

            window.scrollBy({
                top: randomDist + (remainingDistance > 0 ? remainingDistance : 0),
                behavior: 'smooth',
            });

            setTimeout(() => {
                res();
            }, scrollingTime); // wait for scrolling

        }, randomScrollDelay)

        return promise;
    }

    async scrollToEnd(scrollDistance = 0.80, marginError = 100, waitForContent = 500) {
        const innerHeight = window.innerHeight;
        let diff;

        do {
            await this.scroll(scrollDistance);
            await this.utils.delay(waitForContent); // wait for some content to load maybe
            const scrollHeight = document.body.scrollHeight;
            const currentY = window.scrollY + innerHeight;
            diff = scrollHeight - currentY;
        } while (diff >= marginError);


        return true;

    }

    async waitFor(condition, timeout=10000, pollInterval=100) {

        if (!timeout) {
            return false;
        } else if (await condition()) {
            return true;
        } else {
            let res, rej;
            const promise = new Promise((res_, rej_) => {
                res = res_;
                rej = rej_;
            });

            setTimeout(async () => {
                const result = await this.waitFor(condition, timeout - pollInterval, pollInterval);
                res(result);
            }, pollInterval);

            return promise;
        }
    }

    async findElements(selector, context, timeout = 5000, returnAsArray = true) {
        await this.waitFor(() => {
            return !!(context || document).querySelectorAll(selector).length;
        }, timeout);

        const el = (context || document).querySelectorAll(selector);

        return returnAsArray ? Array.prototype.slice.call(el) : el;
    }

    async findElement(selector, context, timeout = 5000) {
        await this.waitFor(() => {
            return !!(context || document).querySelector(selector);
        }, timeout);

        const el = (context || document).querySelector(selector);

        return el || null;
    }
}

