const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {

    const launchConfig = {
        headless: false
    };

    const browser = await puppeteer.launch(launchConfig);
    const page = await browser.newPage();

    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36';
    await page.setUserAgent(userAgent)

    let url;
    
    await page.setViewport({
        width: 1200,
        height: 800
    });

    // WILL NOT WORK
    url = 'https://streeteasy.com/1-bedroom-apartments-for-rent/nyc/price:-1750%7Carea:100,300';

    // WILL SOMEWHAT WORK
    // url = 'https://www.autotrader.com/cars-for-sale/vehicledetails.xhtml?listingId=520507707&zip=98122&referrer=%2Fcars-for-sale%2Fsearchresults.xhtml%3Fzip%3D98122%26sortBy%3Drelevance%26incremental%3Dall%26firstRecord%3D0%26marketExtension%3Don%26makeCodeList%3DACURA%26searchRadius%3D50&numRecords=25&firstRecord=0&makeCodeList=ACURA&searchRadius=50&clickType=alpha';

    
    await page.goto(url);
    // await page.waitFor('[data-cmp="pricing"]');

    const HTML = await page.content()

    fs.writeFileSync('street.html', HTML)

    await page.screenshot({path: 'street.png'});

    await browser.close();

})();
