const download = require('image-downloader'),
    combineTiles = require('combine-tiles'),
    dateTime = require('node-datetime'), fs = require('fs'),
    PNG = require('pngjs').PNG,
    pixelMatch = require('pixelmatch'),
    looksSame = require('looks-same');

const tileUrls = ["https://images.lif.online/eu-maps/steam/6-0-19.png",
    "https://images.lif.online/eu-maps/steam/6-5-19.png",
    "https://images.lif.online/eu-maps/steam/6-0-26.png",
    "https://images.lif.online/eu-maps/steam/6-5-26.png"];

const mapXStart = 0;
const mapXEnd = 6;
const mapYStart = 18;
const mapYEnd = 27;

function compareTiles() {

    let img1 = fs.createReadStream('../public/images/temp/combined-2018-02-13.png').pipe(new PNG()).on('parsed', doneReading),
        img2 = fs.createReadStream('../public/images/temp/combined-2018-02-14.png').pipe(new PNG()).on('parsed', doneReading),
        filesRead = 0;

    function doneReading() {
        if (++filesRead < 2) return;
        const diff = new PNG({width: img1.width, height: img1.height});

        pixelMatch(img1.data, img2.data, diff.data, img1.width, img1.height, {threshold: 0.1});

        diff.pack().pipe(fs.createWriteStream('../public/images/diff-.png'));
    }
}

async function combineDownloadedTiles() {
    console.log("Combining Tiles...");
    const tiles = [];
    for (y = mapYStart; y < mapYEnd; y++) {
        for (x = mapXStart; x < mapXEnd; x++) {
            tiles.push({x: x, y: y - 19, file: '../public/images/temp/tiles/' + x + '-' + y + '.png'});
        }
    }
    const size = 167;
    let dt = dateTime.create();
    let formatted = dt.format('Y-m-d');
    const dest = '../public/images/temp/combined-' + formatted + '.png';
    await combineTiles(tiles, size, size, dest, (err) => {
        if (err) console.error(err);
        else {
            console.log("Tiles Combined")
        };
    });
}

async function downloadTiles() {
    console.log("Downloading Tiles...");
    for (let y = mapYStart; y < mapYEnd; y++) {
        for (let x = mapXStart; x < mapXEnd; x++) {
            const options = {
                url: 'https://images.lif.online/eu-maps/steam/6-' + x + '-' + y + '.png',
                dest: '../public/images/temp/tiles/' + x + '-' + y + '.png'
            };
            if(x === mapXEnd - 1 && y === mapYEnd - 1) {
                download.image(options).then(
                    ({filename, _}) => {
                        console.debug("Downloaded tile, saved to: "  + filename);
                        console.log("Tiles Downloaded");
                        combineDownloadedTiles();
                    }
                );
            }
            else {
                await download.image(options).then(
                    ({filename, _}) => {
                        console.debug("Downloaded tile, saved to: "  + filename);
                    }
                );
            }
        }
    }
}

function diffMapImages() {
    console.log('Comparing Images...');
    let prevImagePath = "../public/images/temp/combined-2018-02-18.png";
    let currentImagePath = "../public/images/temp/combined-2018-02-19.png";
    let diffPath = "../public/images/temp/diff.png";
    looksSame.createDiff({
        reference: prevImagePath,
        current: currentImagePath,
        diff: diffPath,
        highlightColor: '#ff0000', //color to highlight the differences
        strict: false,//strict comparsion
        tolerance: 0
    }, function(error) {
        console.error(error);
    });
}

let needTiles = true;
let needsCombine = true;
let needsDiff = true;

async function run() {
    if (needTiles) {
        await downloadTiles();
    }
    if (needsCombine) {
        await combineDownloadedTiles();
    }
    if (needsDiff) {
        await diffMapImages()
    }
}

run();


