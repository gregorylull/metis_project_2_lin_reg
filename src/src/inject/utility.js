
class ExtUtility {
    constructor(config = {}) {
        // https://odino.org/emit-a-beeping-sound-with-javascript/
        // browsers limit the number of concurrent audio contexts

        this.CONFIG = {
            audio: {
                beeps: 3,
                duration: 500
            }
        };

        this.config = Object.assign({}, this.CONFIG, config);
    }


    merge(origObj = {}, newObj, returnNew = true) {

        const finalObj = returnNew ? Object.assign({}, origObj) : origObj;

        if (!newObj) {
            return finalObj;
        }

        for (let key in newObj) {
            const newVal = newObj[key];

            if (Array.isArray(newVal)) {

                if (!finalObj[key]) {
                    finalObj[key] = [];
                }

                finalObj[key] = finalObj[key].concat(newVal);

            } else if (typeof newVal === 'object') {
                finalObj[key] = Object.assign({}, this.merge(finalObj[key], newVal));

            } else {
                finalObj[key] = newVal;
            }
        }

        return finalObj;
    }

    trim(strings) {
        if (!Array.isArray(strings)) {
            return strings.trim().replace(/[\n\s]+/gm, ' ');
        } else {
            return strings.map(str => {
                return str.trim().replace(/[\n\s]+/gm, ' ');
            });
        }
    }

    getFloat(input) {
        if (typeof input === 'number') {
            return input
        }

        if (!input || typeof input !== 'string') {
            return null;
        }

        return parseFloat(input.replace(/[^\d.]/g, ''));
    }

    getInt(input) {

        if (typeof input === 'number') {
            return input
        }

        if (!input) {
            return null;
        }

        return parseInt(input.replace(/[^\d]/g, ''));
    }


    async delay(timeout = 0) {
        let res;
        const promise = new Promise(res_ => {
            res = res_;
        });
    
        setTimeout(res, timeout);
    
        return promise;
    }

    

    async beep(vol = 50, freq = 200, duration = 500) {

        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }

        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        oscillator.connect(gain);
        oscillator.frequency.value = freq;
        oscillator.type = "square";
        gain.connect(this.audioContext.destination);
        gain.gain.value = vol * 0.01;
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration * 0.001);

        await this.delay(duration);
    }

    async warn(waitBetweenBeeps = 300, beeps = this.config.audio.beeps, warningInterval = 5000, count = 4) {

        this.beep();

        const intervalID = setInterval(async () => {
            if (!(count--)) {
                clearInterval(intervalID);
            }

            for (let i = 0; i < beeps; i++) {
                await this.beep();

                await this.delay(waitBetweenBeeps);

            }

        }, warningInterval);
    }

    toQueryObject(queryString) {
        const dict = {};
        queryString.split('&').reduce((accum, item) => {
            const split = item.split('=');
            const key = split[0];
            const val = split[1];

            if (!dict[key]) {
                dict[key] = val;
            } else if (!Array.isArray(dict[key])) {
                dict[key] = [dict[key], val];
            } else {
                dict[key].push(val);
            }

            return dict;

        }, {});

        return dict;
    }

}
