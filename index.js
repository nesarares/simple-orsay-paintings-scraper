require("tls").DEFAULT_MIN_VERSION = "TLSv1"; // old TLS for HTTPS compatibility with musee-orsay.fr
const rp = require("request-promise");
const $ = require("cheerio");
const fs = require("fs");

const base = "https://www.musee-orsay.fr";
const url = `${base}/en/collections/works-in-focus/painting.html`;
const dataFile = `./data/data.json`;

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

const writePaintingsToFile = paintings => {
  const json = JSON.stringify(paintings);
  fs.writeFile(dataFile, json, err => {
    if (err) console.error(err);
  });
};

const parsePaintingLink = async url => {
  const html = await rp(url); // get the page content using request promise
  const meta = $(".tx-commentaire-pi1 .vignetteListeCollection165", html).next(
    "div"
  )[0].children; // div that contains the metadata
  return {
    title: $(".tx-commentaire-pi1 h3", html).text(),
    text: $(".tx-commentaire-pi1 .bodytext", html).text(),
    artist: meta[0].data.trim(0), // line 0
    year: meta[4].data, // line 4
    medium: meta[6].data, // line 6
    dimensions: meta[8].data, // line 8
    copyright: meta[10].data // line 10
  };
};

const getData = async () => {
  const html = await rp(url); // get the page content using request promise
  const links = [];
  const paintings = [];

  $(".archive a", html).each((idx, elem) => {
    const link = elem.attribs.href; // get link from the href attribute
    links.push(`${base}/${link}`); // push to list the absolute url
  }); // build a list of links to each painting's details webpage

  const noPaintings = links.length; // total number of paintings
  await asyncForEach(links, async (link, idx) => {
    try {
      const painting = await parsePaintingLink(link);
      paintings.push(painting);
      writePaintingsToFile(paintings); // save the paintings to a JSON file
      console.log(`Done parsing painting #${idx + 1}/${noPaintings}`);
    } catch (error) {
      console.log(`Error parsing painting #${idx + 1}/${noPaintings}`);
      console.log(error);
    }
  });
};

getData();
