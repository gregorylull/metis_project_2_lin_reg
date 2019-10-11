/**
 * (glull)
 * 
 * 
 * TODO
 * 1. how to use storage API
 * - grab the title and save it
 *   - 
 * - how to access it
 * 	 - DONE localstorage API
 * - how to print it out and retrieve it?
 *   - for now document.write
 * - try with an arbitrary long JSON, 1000 items, with 100 array values
 *   - meh, it should be fine
 * - be careful with try/catch
 * 
 * 2. figure out which features i want to present
 * 
 * 
 * 3. prioritize features, find selectors and get functions to get each of the items
 * - e.g.: getPrice(), getTransportation
 * 
 * Notes:
 * Streeteasy unit: refresh cache-disabled: 7s
 * Streeteasy unit: refresh cache-enabled: 2s
 * 
 * // units
 * 2000 rows * (refresh + scroll + retrieve) === 2000 * (5 + 5 + 5) / 3600 == 10 hrs?
 * 1000 rows * (refresh + scroll + retrieve) === 1000 * (5 + 2 + 2) / 3600 == 2 hrs?
 * 
 * // pagination
 * 1000 units / 13 per page * (refresh + scroll + retrieve) === 100 * (5 + 2 + 2) / 3600 == 0.4 hours 
 * 
 * my local storage:
 * 
 * {
 *     ghl-pages: {
 *     ghl-single_bedroom: {
 *         url: {},
 *         pagination: {},
 *         missing: []
 *         searchUrl: 
 *         searchParams: {}
 *     },
 *     },
 * 
 *     ghl-units: {
 *         single: {}
 *     }
 * }
 * 
 * Amenities
 * - Hardwood floors
 * - Elevator
 * - Dishwasher
 * 
 * Continuous variables:
 * StreetEasy
 * - distance to first transportation
 * - average distance to all nearby transportation
 * 
 * YELP
 * - YELP: total recommended restaurants within 4 blocks
 * - YELP: average stars up to 50 restaurants
 * - YELP: average number of reviews up to 50 restaurants
 * 
 * - YELP: total grocery within 4 blocks
 * 
 * GOOGLE
 * - average travel time to closest major transportation hubs (grand central, penn station, w4, time-sqare)
 * - average travel time to major 
 * 
 * - google maps API for restaurants?
 * 
 *
 * 
 */

(function () {

const DEBUGGING = true;
const MAX_SCRAPES = 5;
const WAIT_BETWEEN_PAGES = 2000;


const utils = new ExtUtility();
const storage = new ExtStorage(utils, CONFIG.storage);
const page = new PageBase(utils);
const streetEasy = new StreetEasy(utils, page);

async function pageSetup(delay=250, scroll=1.25) {

    // start from top
    await utils.delay(delay);
    window.scrollTo(0,0);

    // scroll to bottom
    await utils.delay(delay);
    await page.scrollToEnd(scroll);
}


// individual page scraping
async function mainPage(waitBetweenPages = WAIT_BETWEEN_PAGES) {

    console.log('url use: ', location.href);

    if (/\/undefined/i.test(location.href)) {
        console.log('skipped url', location.href);
        const storageItem = await storage.getStorageItems(['unitUrls']);

        const nextUrl = storageItem.unitUrls.pop();
        await storage.setStorageItems(storageItem, false);
        return nextUrl;
    }

    if (!/\/(building|rental)\//i.test(location.href)) {
        return;
    }

    const pageInfo = await streetEasy.getPageInfo(location.href);

    // SET NEXT PAGE IN local storage
    await storage.setStorageItems(pageInfo);

    // if next page go
    const localItems = await storage.getStorageItems(['unitUrls']);
    const nextUrl = localItems.unitUrls.pop();

    console.log('urls left', localItems.unitUrls.length);


    await storage.setStorageItems(localItems, false);

    if (!nextUrl) {
        await utils.warn();
        return;
    }

    console.log('next url', nextUrl);
    return nextUrl;

}

// pagination scraping
async function mainPagination(waitBetweenPages = WAIT_BETWEEN_PAGES) {
    if (!/for-rent\/manhattan/i.test(location.href)) {
        return;
    }

    const paginationInfo = await streetEasy.getPaginationInfo({
        borough: 'manhattan',
        city: 'ny',
        bedMin: 1,
        bedMax: 1
    });

    // SET NEXT PAGE IN local storage
    await storage.setStorageItems(paginationInfo);

    // wait some time
    await utils.delay(waitBetweenPages);

    // if next page go
    const hasNext = await streetEasy.nextPage();
    const reachedLimit = false;

    if (!hasNext || reachedLimit) {
        await utils.warn();
    }

}

const now = new Date();
const readyStateCheckInterval = setInterval(async () => {
    if (document.readyState === "interactive" || document.readyState === 'complete') {
        console.log('\n\nPage is fully loaded, executing main()\n\n');

        clearInterval(readyStateCheckInterval);


        // CLEAR LOCAL STORAGE SIZE
        // const clearedSize = await storage.clearStorage();
        // console.log(`\ncleared local clearedSize: ${clearedSize}\n`)


        // GET LOCAL STORAGE SIZE
        const startingSize = await storage.getStorageSize();
        console.log(`\nlocal startingSize: ${startingSize}\n`)

        // SCRAPING INDIVIDUAL UNITS
        // const urlsStorage = await storage.getStorageItems(['unitUrls']);
        // await storage.setStorageItems({unitUrls: urlsBed1Manhattan}, false);


        // COMMENT OUT TO STOP
        // const nextUrl = await mainPage();
        // console.log('next url:', nextUrl);
        // if (nextUrl) {
        //     location.href = nextUrl;
        // }


        // PRINT DATA PAGE
        // const info = await storage.getStorageItems();
        // const pagination = new StreetPagination(info);
        // document.write(JSON.stringify(pagination.getStatOutputPage(), null, 4));



        // SCRAPING PAGINATION
        // await pageSetup();
        // await mainPagination();



        // PRINT DATA PAGINATION
        // const info = await storage.getStorageItems();
        // const pagination = new StreetPagination(info);
        // document.write(JSON.stringify(pagination.getStatOutput(), null, 4));


        // TIME
        const extractionTime = (Date.now() - now)/1000;
        console.log(`\nTime Executed: ${extractionTime} seconds\n`);
    } 
}, 250);


})();
