/***
 * 
 * 
 * this was just a unit test, discard
 * 
 * 
 * this is scratch paper for testing functions. 
 * 
 * 
 */

    function merge(origObj, newObj, returnNew = true) {

        const finalObj = returnNew ? Object.assign({}, origObj) : origObj;

        for (key in newObj) {
            const newVal = newObj[key];
            console.log('what are key/val', key, newVal);

            if (Array.isArray(newVal)) {
                finalObj[key] = finalObj[key].concat(newVal);

            } else if (typeof newVal === 'object') {
                finalObj[key] = Object.assign({}, merge(finalObj[key], newVal));

            } else {
                finalObj[key] = newVal;
            }
        }

        return finalObj;
    }



(function test () {

    let orig = {
        a: true,
        b: 'hello',
        c: 5,
        d: null,
        e: [1],
        f: { x: 5 },
        g: { y: { z: true } }
    };

    // console.log('bool - a', JSON.stringify(merge(orig, {a: false}), null, 4));
    
    // console.log('a, b, c', JSON.stringify(merge(orig, {a: true, b: false, c: 3}), null, 4));

    // console.log('e', JSON.stringify(merge(orig, {e: [2, 3]}), null, 4));

    console.log('f', JSON.stringify(merge(orig, {f: { y: 2}}), null, 4));

    console.log('g', JSON.stringify(merge(orig, {g: {y: {z: false}, o: 4 }}), null, 4));

})()

async function beep(vol = 50, freq = 200, duration = 500) {

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

async function warn(waitBetweenBeeps = 300, beeps = this.config.audio.beeps, warningInterval = 5000, count = 4) {
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


