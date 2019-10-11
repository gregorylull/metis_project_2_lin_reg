

class StreetEasy {

    constructor(
        utility,
        page
    ) {
        this.utility = utility;
        this.page = page;

        this.css = {
            featured: '.featured-tag',
            noFeeBanner: '.banner.no_fee',
            nextPage: 'nav.pagination .next a[rel="next"]',
            units: 'article.item',
            header: '.result-header h1',
            totalUnits: '.result-header .result-count',
            unitUrl: '.details-titleLink',
            unitTitle: '.details-titleLink',
            unitPrice: '.price-info .price',
            unitDetails: '.details_info',

            // page
            unitBuilding: '.BuildingInfo',
            unitAmenities: '.AmenitiesBlock',
            unitTransportation: '.Nearby-transportationList'

        }

        this.amenities = [];

    }

    async isFeatured(selector=this.css.featured, contextEl=document) {
        const isFeatured = await this.page.findElement(selector, contextEl, 100);
        return !!isFeatured;
    }

    async getTotalUnits(selector=this.css.totalUnits, contextEl=document) {
        const totalUnitCountStr = await this.page.findElement(selector, contextEl);
        const count = this.utility.getFloat(totalUnitCountStr);
        return count;
    }

    async getPageHeader(selector=this.css.header, contextEl=document) {
        const header = await this.page.findElement(selector, contextEl);
        return this.utility.trim(header);
    }

    async getPageMeta() {
        const query = this.utility.toQueryObject(location.search.substring(1));
        return {
            href: location.href,
            page: this.utility.getInt(query.page),
            query
        };
    }

    async getUnitPrice(selector=this.css.unitPrice, contextEl=document) {
        const priceEl = await this.page.findElement(selector, contextEl);
        const priceStr = this.utility.trim(priceEl.textContent);

        return this.utility.getInt(priceStr);
    }

    async getUnitStreet(selector=this.css.unitTitle, contextEl=document) {
        const streetEl = await this.page.findElement(selector, contextEl);

        if (streetEl) {
            const text = this.utility.trim(streetEl.textContent);
            return text;
        }

        return null;

    }

    async getUnitUrl(selector=this.css.unitUrl, contextEl=document, removeQueryParams = false) {
        const anchor = await this.page.findElement(selector, contextEl);
        const href =  anchor ? anchor.href : null;

        if (removeQueryParams && href) {
            const index = href.indexOf('?');
            return index > - 1 ? href.substring(0, index) : href; 
        }

        return href;
    }

    async getCardDetails(selector=this.css.unitDetails, contextEl=document) {
        const details = await this.page.findElements(selector, contextEl);
        const results = {};

        details.forEach(async (detail) => {
            const beds = await this.getCardDetailsBeds(detail);
            const baths = await this.getCardDetailsBaths(detail);
            const furnished = await this.isCardDetailsFurnished(detail);
            const neighborhood = await this.getCardDetailsNeighborhood(detail);
            const sqft = await this.getCardDetailsSqft(detail);

            if (beds) {
                results[SEK.beds] = beds;
            }

            if (baths) {
                results[SEK.baths] = baths;
            }

            if (furnished) {
                results[SEK.furnished] = furnished;
            }

            if (neighborhood) {
                results[SEK.neighborhood] = neighborhood;
            }

            if (sqft) {
                results[SEK.sqft] = sqft;
            }
        });

        return results;
    }

    async getCardDetailsBeds(element) {
        const innerText = (element && element.innerText) || '';
        let beds = 0;

        innerText
            .split('\n')
            .forEach(text => {
                const hasBed = /bed/gi.test(text);
                if (hasBed) {
                    beds = text;
                }
            });

        return beds ? this.utility.getFloat(beds) : beds;
    }

    async getCardDetailsBaths(element) {
        const innerText = (element && element.innerText) || '';
        let baths = 0;

        innerText
            .split('\n')
            .forEach(text => {
                const hasBath = /bath/gi.test(text);
                if (hasBath) {
                    baths = text;
                }
            });

        return baths ? this.utility.getFloat(baths) : baths;
    }

    async isCardDetailsFurnished(element) {
        const innerText = (element && element.innerText) || '';
        let furnished = false;

        innerText
            .split('\n')
            .forEach(text => {
                const isFurnished = /furnish/gi.test(text);
                if (isFurnished) {
                    furnished = true;
                }
            });

        return furnished;

    }

    async getCardDetailsNeighborhood (element) {
        const innerText = (element && element.innerText) || '';
        let neighborhood = '';

        innerText
            .split('\n')
            .forEach(text => {
                // neighborhood pattern is:
                // Condo in Lenox Hill
                // Rental Unit in Turtle Bay
                const match = ' in ';
                const index = text.indexOf(match);
                if (index > -1) {
                    neighborhood = text.substring(index + match.length);
                }
            });

        return neighborhood ? this.utility.trim(neighborhood) : neighborhood;
    }

    async getCardDetailsSqft(element) {
        const innerText = (element && element.innerText) || '';
        let sqft = -1;

        innerText
            .split('\n')
            .forEach(text => {
                const hasSqft = /\sft/gi.test(text) && !/per ft/gi.test(text);
                if (hasSqft) {
                    sqft = text;
                }
            });

        return sqft ? this.utility.getInt(sqft) : sqft;
    }

    async getBuildingAmenities(selector = this.css.unitAmenities, contextEl=document, timeout=500) {

        // Absence of amenities does not mean the building/unit definitely does not provide it,
        // it might just mean it isn't listed.
        const AMENITIES = [
            'dishwasher',
            'doorman',
            'elevator',
            'gym',
            'laundry in building',
            'live-in super',
            'parking',
            'washer/dryer in-unit',
        ];

        const AMENITIES_PETS = [
            'pets allowed',
            'cats and dogs allowed',
        ]

        const AMENITIES_OUTDOORS = [
            // unit
            'balcony',
            'deck',
            'patio',

            // building
            // 'roof deck',
            // 'terrace'
        ];

        const results = {
            'dishwasher': false,
            'doorman': false,
            'elevator': false,
            'gym': false,
            'laundry in building': false,
            'live-in super': false,
            'parking': false,
            'washer/dryer in-unit': false,
            [SEK.petsAllowed]: false,
            [SEK.outdoorSpace]: false
        };

        const buildingAmenitiesEl = await this.page.findElement(selector, contextEl, timeout);

        if (buildingAmenitiesEl) {

            const buildingAmenities = buildingAmenitiesEl.innerText.toLowerCase();

            AMENITIES.forEach(amenity => {
                if (buildingAmenities.includes(amenity)) {
                    results[amenity] = true;
                } else {
                    results[amenity] = false;
                }
            });

            AMENITIES_PETS.forEach(amenity => {

                // once true always true for this unit
                if (results[SEK.petsAllowed] === true) {
                    return;
                }

                if (buildingAmenities.includes(amenity)) {
                    results[SEK.petsAllowed] = true;
                } else {
                    results[SEK.petsAllowed] = false;
                }

            });

            AMENITIES_OUTDOORS.forEach(amenity => {
                // once true always true for this unit
                if (results[SEK.outdoorSpace] === true) {
                    return;
                }

                if (buildingAmenities.includes(amenity)) {
                    results[SEK.outdoorSpace] = true;
                } else {
                    results[SEK.outdoorSpace] = false;
                }

            });
        }

        return results;
        
    }

    // get total units, stories, and year built
    async getUnitBuildingDetails(selector=this.css.unitBuilding, contextEl=document, timeout=500) {
        const element = await this.page.findElement(selector, contextEl, timeout);

        const innerText = (element && element.innerText) || '';
        let units = -1;
        let stories = -1;
        let built = -1;
        let builtType = -1;

        if (element) {

            innerText
                .split('\n')
                .forEach(text => {
                    const unitRE = /\d+\sunits/i;
                    const storiesRE = /\d+\sstories/i;
                    const builtRE = /\d+\sbuilt/i;

                    const matchUnit = text.match(unitRE);
                    const matchStories= text.match(storiesRE);
                    const matchBuilt = text.match(builtRE);

                    if (matchUnit) {
                        units = this.utility.getInt(matchUnit[0]);
                    }

                    if (matchStories) {
                        stories = this.utility.getInt(matchStories[0]);
                    }

                    if (matchBuilt) {
                        built = this.utility.getInt(matchBuilt[0]);

                        if (built < 1939) {
                            builtType = 'prewar';
                        } else if (built < 1990) {
                            builtType = 'postwar';
                        } else {
                            builtType = 'modern';
                        }
                    }
                });
        }

        
        return {
            [SEK.buildingUnits]: units,
            [SEK.buildingStories]: stories,
            [SEK.buildingBuilt]: built,
            [SEK.buildingType]: builtType
        }
    }


    async getBuildingTransportation(selector=this.css.unitTransportation, contextEl=document, timeout=3000) {
        const element = await this.page.findElement(selector, contextEl, timeout);

        if (!element) {
            return;
        }

        const innerTextSplit = element.innerText.split('\n')

        const results = {};
        let nearestDistance = -1;
        let nearestTotal = -1;
        let stationTotal = -1;
        let stationAvgDistance = -1;

        const split = innerTextSplit.map(lineItem => lineItem.split(' at '));

        split.forEach((lineItem, lineItemIndex) => {
            if (lineItem.length !== 2) {
                return;
            }

            const stations = lineItem[0];
            const distanceStr = lineItem[1];
            const feetInMiles = 5280;

            let distanceNormalized;

            const reFeet = /\d+ feet/i;
            const reMiles = /\d\.\d+ miles/i

            if(reFeet.test(distanceStr)) {
                const match = distanceStr.match(reFeet);
                const distanceFloat = this.utility.getFloat(match[0]);
                distanceNormalized = distanceFloat / feetInMiles;

            } else {
                const match = distanceStr.match(reMiles);
                const distanceFloat = this.utility.getFloat(match[0]);
                distanceNormalized = distanceFloat;
            }

            stations.split(' ').forEach(station => {
                if (station && !results[station]) {
                    results[station] = distanceNormalized;

                    if (lineItemIndex === 0) {
                        nearestTotal += 1;
                        nearestDistance = distanceNormalized;
                    }
                }
            });

        });

        let sum = 0;
        for (let station in results) {
            sum += results[station]
        }

        stationTotal = Object.keys(results).length;
        stationAvgDistance = sum / stationTotal;

        return {
            [SEK.stationNearestDistance]: nearestDistance,
            [SEK.stationNearestTotal]: nearestTotal,
            [SEK.stationAvgDistance]: stationAvgDistance,
            [SEK.stationTotal]: stationTotal,
        }
    }

    // For individual page buildings
    async getBuildingDetails(selector=this.css.unitBuilding, contextEl=document) {
        const details = await this.page.findElements(selector, contextEl);
        const results = {};


        details.forEach(async (detail) => {
            const beds = await this.getCardDetailsBeds(detail);
            const baths = await this.getCardDetailsBaths(detail);
            const furnished = await this.isCardDetailsFurnished(detail);
            const neighborhood = await this.getCardDetailsNeighborhood(detail);
            const sqft = await this.getCardDetailsSqft(detail);

            if (beds) {
                results[SEK.beds] = beds;
            }

            if (baths) {
                results[SEK.baths] = baths;
            }

            if (furnished) {
                results[SEK.furnished] = furnished;
            }

            if (neighborhood) {
                results[SEK.neighborhood] = neighborhood;
            }

            if (sqft) {
                results[SEK.sqft] = sqft;
            }
        });

        return results;
    }

    async hasBrokerFee(selector = this.css.noFeeBanner, contextEl = document) {
        const noFeeBanner = await this.page.findElement(selector, contextEl, 100);
        return !noFeeBanner;
    }

    async getUnits(selector = this.css.units, contextEl = document, tries = 2) {
        const units = await this.page.findElements(selector, contextEl);

        // possible captcha
        if ((!units || !units.length) && tries > 0) {
            this.utility.warn();
            await this.utility.delay(30000);
            return this.getUnits(undefined, undefined, tries--)
        }

        return units;
    }

    async getPageInfo(url) {

        const buildingTransportation = await this.getBuildingTransportation();
        const buildingDetails = await this.getUnitBuildingDetails();
        const buildingAmenities = await this.getBuildingAmenities();
        const pagination = new StreetPagination();

        pagination[SEK.units][url] = new StreetUnit({
            // card
            [SEK.url]: url,

            // building details
            [SEK.buildingUnits]: buildingDetails[SEK.buildingUnits],
            [SEK.buildingStories]: buildingDetails[SEK.buildingStories],
            [SEK.buildingBuilt]: buildingDetails[SEK.buildingBuilt],
            [SEK.buildingType]: buildingDetails[SEK.buildingType],

            // transportation
            [SEK.stationNearestDistance]: buildingTransportation[SEK.stationNearestDistance],
            [SEK.stationNearestTotal]: buildingTransportation[SEK.stationNearestTotal],
            [SEK.stationAvgDistance]: buildingTransportation[SEK.stationAvgDistance],
            [SEK.stationTotal]: buildingTransportation[SEK.stationTotal],

            // schools zoned

            // amenities
            [SEK.outdoorSpace]: !!buildingAmenities.outdoorSpace,
            [SEK.petsAllowed]: !!buildingAmenities.petsAllowed,
            [SEK.dishwasher]: !!buildingAmenities['dishwasher'],
            [SEK.doorman]: !!buildingAmenities['doorman'],
            [SEK.elevator]: !!buildingAmenities['elevator'],
            [SEK.gym]: !!buildingAmenities['gym'],
            [SEK.laundryInBuilding]: !!buildingAmenities['laundry in building'],
            [SEK.liveInSuper]: !!buildingAmenities['live-in super'],
            [SEK.parking]: !!buildingAmenities['parking'],
            [SEK.laundryInUnit]: !!buildingAmenities['washer/dryer in-unit'],
        });

        console.log('ghl page:', JSON.stringify(pagination, null, 4));

        return pagination;

    }


    // pagination extraction
    async getPaginationInfo(initialQuery = {}) {

        const units = await this.getUnits();
        const pageMeta = await this.getPageMeta();
        const pagination = new StreetPagination(initialQuery);

        pagination.lastPage = pageMeta.href;

        for (let i = 0; i < units.length; i++) {
            const unit = units[i];

            const isFeatured = await this.isFeatured(undefined, unit);

            if (isFeatured) {
                continue;
            }

            const unitStreet = await this.getUnitStreet(undefined, unit);
            const unitDetails = await this.getCardDetails(undefined, unit);
            const cardUrl = await this.getUnitUrl(undefined, unit, true);
            const price = await this.getUnitPrice(undefined, unit);
            const hasBrokerFee = await this.hasBrokerFee(undefined, unit);


            pagination[SEK.units][cardUrl] = new HomeUnit({
                // target
                [SEK.price]: price,

                // details
                [SEK.baths]: unitDetails.baths,
                [SEK.beds]: unitDetails.beds,
                [SEK.neighborhood]: unitDetails.neighborhood,
                [SEK.furnished]: unitDetails.furnished,
                [SEK.sqft]: unitDetails.sqft,

                // card
                [SEK.hasFee]: hasBrokerFee,
                [SEK.url]: cardUrl,
                [SEK.street]: unitStreet,
                [SEK.borough]: initialQuery.borough,
                [SEK.city]: initialQuery.city,
            });
        }

        console.log('ghl pagination:', JSON.stringify(pagination, null, 4));

        return pagination;
    }

    async nextPage(selector = this.css.nextPage, contextEl = document) {
        const next = await this.page.findElement(selector, contextEl);

        setTimeout(() => {
            if (next) {
                next.click()
            }
        })

        return next || null;
    }

}

// Street Easy Keys for local storage
const SEK = {

    // pagingation
    units: 'units',
    totalCount: 'total_count',
    totalPages: 'total_pages',
    lastPage: 'last_page',
    queries: 'queries',

    price: 'price',
    street: 'street',
    url: 'url',
    beds: 'beds',
    baths: 'baths',
    neighborhood: 'neighborhood',
    sqft: 'sqft',
    hasFee: 'has_broker_fee',
    city: 'city',
    borough: 'borough',
    furnished: 'furnished',
    address: 'address',

    // building transportation
    stationNearestDistance: 'station_nearest_distance',
    stationNearestTotal: 'station_nearest_total',
    stationAvgDistance: 'station_avg_distance',
    stationTotal: 'station_total',

    // home from individual page
    buildingUnits: 'building_units',
    buildingStories: 'building_stories',
    buildingBuilt: 'building_built',
    buildingType: 'building_type',

    // listing / building amenities
    outdoorSpace: 'amen_outdoor_space',
    petsAllowed: 'amen_pets_allowed',
    dishwasher: 'amen_dishwasher',
    doorman: 'amen_doorman',
    elevator: 'amen_elevator',
    gym: 'amen_gym',
    laundryInBuilding: 'amen_laundry_in_building',
    laundryInUnit: 'amen_laundry_in_unit',
    liveInSuper: 'amen_live_in_super',
    parking: 'amen_parking',

};

class HomeUnit {
    constructor (values = {}) {
        Object.assign(this, {
            [SEK.url]: undefined,
            [SEK.price]: undefined,
            [SEK.beds]: undefined,
            [SEK.baths]: undefined,
            [SEK.street]: undefined,
            [SEK.neighborhood]: undefined,
            [SEK.sqft]: undefined,
            [SEK.hasFee]: undefined,
            [SEK.borough]: undefined,
            [SEK.city]: undefined,
            [SEK.furnished]: undefined,

            // from pages
            [SEK.outdoorSpace]: undefined,
            [SEK.petsAllowed]: undefined,
            [SEK.dishwasher]: undefined,
            [SEK.doorman]: undefined,
            [SEK.elevator]: undefined,
            [SEK.gym]: undefined,
            [SEK.laundryInBuilding]: undefined,
            [SEK.liveInSuper]: undefined,
            [SEK.parking]: undefined,
            [SEK.laundryInUnit]: undefined

        }, values);
    }
}

class StreetUnit {
    constructor(options = {}) {
        Object.assign(this, {

        }, options);
    }
}

class StreetPagination {
    constructor(options = {}) {
        Object.assign(this, {
            /**
             * {
             *     'https://streeteasy.com/building/some-unit (remove queryParameters): Unit
             * }
             */
            [SEK.units]: {},

            // total expected observations
            [SEK.totalCount]: 0,

            // how many expected pages are there
            [SEK.totalPages]: 0,

            // a url to go directly to and continue from incase of error.
            [SEK.lastPage]: null,

            // keep track of which queries i'm on
            [SEK.queries]: options.initialQuery

        }, options);
    }

    getStatOutput() {
        const units = this.units;

        const results = {
            [SEK.price]: [],
            [SEK.street]: [],
            [SEK.furnished]: [],
            [SEK.url]: [],
            [SEK.beds]: [],
            [SEK.baths]: [],
            [SEK.hasFee]: [],
            [SEK.borough]: [],
            [SEK.city]: [],
            [SEK.sqft]: [],
            [SEK.neighborhood]: [],
            [SEK.address]: [],
        };

        for (let unitUrl in units) {
            const unit = units[unitUrl];

            const price = unit[SEK.price];
            const beds = unit[SEK.beds];
            const baths = unit[SEK.baths];
            const hasFee = unit[SEK.hasFee];
            const borough = unit[SEK.borough]
            const city = unit[SEK.city]
            const sqft = unit[SEK.sqft]
            const neighborhood = unit[SEK.neighborhood]
            const furnished = unit[SEK.furnished]
            const street = unit[SEK.street]

            // combination of above
            const address = `${street}, ${neighborhood}, ${city}`;

            results[SEK.price].push(price);
            results[SEK.url].push(unitUrl);
            results[SEK.beds].push(beds);
            results[SEK.baths].push(baths);
            results[SEK.hasFee].push(hasFee);
            results[SEK.borough].push(borough);
            results[SEK.city].push(city);
            results[SEK.sqft].push(sqft);
            results[SEK.neighborhood].push(neighborhood);
            results[SEK.furnished].push(furnished);
            results[SEK.street].push(street);
            results[SEK.address].push(address);
        }

        return results;
    }

    getStatOutputPage() {
        const units = this.units;

        const results = {
            [SEK.url]: [],

            // building
            [SEK.buildingUnits]: [],
            [SEK.buildingStories]: [],
            [SEK.buildingBuilt]: [],
            [SEK.buildingType]: [],

            // transportation
            [SEK.stationNearestDistance]: [],
            [SEK.stationNearestTotal]: [],
            [SEK.stationAvgDistance]: [],
            [SEK.stationTotal]: [],

            // amenities
            [SEK.outdoorSpace]: [],
            [SEK.petsAllowed]: [],
            [SEK.dishwasher]: [],
            [SEK.doorman]: [],
            [SEK.elevator]: [],
            [SEK.gym]: [],
            [SEK.laundryInBuilding]: [],
            [SEK.liveInSuper]: [],
            [SEK.parking]: [],
            [SEK.laundryInUnit]: [],

        };

        for (let unitUrl in units) {
            const unit = units[unitUrl];

            const buildingUnits = unit[SEK.buildingUnits];
            const buildingStories = unit[SEK.buildingStories];
            const buildingBuilt = unit[SEK.buildingBuilt];
            const buildingType = unit[SEK.buildingType];

            const stationNearestDistance = unit[SEK.stationNearestDistance];
            const stationNearestTotal = unit[SEK.stationNearestTotal];
            const stationAvgDistance = unit[SEK.stationAvgDistance];
            const stationTotal = unit[SEK.stationTotal];

            const outdoorSpace = unit[SEK.outdoorSpace];
            const petsAllowed = unit[SEK.petsAllowed];
            const dishwasher = unit[SEK.dishwasher];
            const doorman = unit[SEK.doorman];
            const elevator = unit[SEK.elevator];
            const gym = unit[SEK.gym];
            const laundryInBuilding = unit[SEK.laundryInBuilding];
            const liveInSuper = unit[SEK.liveInSuper];
            const parking = unit[SEK.parking];
            const laundryInUnit = unit[SEK.laundryInUnit];


            // url identifier
            results[SEK.url].push(unitUrl);

            // building
            results[SEK.buildingUnits].push(buildingUnits);
            results[SEK.buildingStories].push(buildingStories);
            results[SEK.buildingBuilt].push(buildingBuilt);
            results[SEK.buildingType].push(buildingType);

            // transportation
            results[SEK.stationNearestDistance].push(stationNearestDistance);
            results[SEK.stationNearestTotal].push(stationNearestTotal);
            results[SEK.stationAvgDistance].push(stationAvgDistance);
            results[SEK.stationTotal].push(stationTotal);

            // amenities
            results[SEK.outdoorSpace].push(outdoorSpace);
            results[SEK.petsAllowed].push(petsAllowed);
            results[SEK.dishwasher].push(dishwasher);
            results[SEK.doorman].push(doorman);
            results[SEK.elevator].push(elevator);
            results[SEK.gym].push(gym);
            results[SEK.laundryInBuilding].push(laundryInBuilding);
            results[SEK.liveInSuper].push(liveInSuper);
            results[SEK.parking].push(parking);
            results[SEK.laundryInUnit].push(laundryInUnit);
        }

        return results;
    }



}
