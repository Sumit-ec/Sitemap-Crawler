const axios = require("axios");
const cheerio = require("cheerio");
const Page = require("../models/page.model");
const { normalizeUrl } = require("../utils/urlHelper");

const BASE_DOMAIN = "https://www.edzy.ai";

async function fetchSitemapUrls() {
  try {
    console.log("Attempting to fetch sitemap...");
    const { data } = await axios.get(`${BASE_DOMAIN}/sitemap.xml`, { 
      timeout: 15000,
      headers: { 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const locRegex = /<loc>(.*?)<\/loc>/g;
    const urls = [];
    let match;
    while ((match = locRegex.exec(data)) !== null) {
      urls.push(normalizeUrl(match[1].trim()));
    }

    if (urls.length === 0) {
      console.warn("⚠️ Sitemap blocked or empty. Using manual URL list for testing...");
      return [
        "https://www.edzy.ai",
        "https://www.edzy.ai/about",
        "https://www.edzy.ai/blog",
        "https://www.edzy.ai/cbse",
        "https://www.edzy.ai/buy"
      ].map(url => normalizeUrl(url)); 
    }

    return urls;
  } catch (err) {
    console.error("Error fetching sitemap:", err.message);
    return [normalizeUrl(BASE_DOMAIN)];
  }
}

async function crawlPage(url) {
  try {
    const normalizedTarget = normalizeUrl(url);
    const { data } = await axios.get(normalizedTarget, { timeout: 10000 });
    const $ = cheerio.load(data);
    const outgoingLinks = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      try {
        const resolvedUrl = new URL(href, normalizedTarget);
        const isInternal = resolvedUrl.hostname.includes("edzy.ai");
        
        outgoingLinks.push({ 
          url: normalizeUrl(resolvedUrl.href),
          linkType: isInternal ? "internal" : "external" 
        });
      } catch (e) {}
    });

    await Page.findOneAndUpdate(
      { url: normalizedTarget },
      { url: normalizedTarget, html: data, outgoingLinks },
      { upsert: true, new: true }
    );
    console.log(`Crawled: ${normalizedTarget}`);
  } catch (err) {
    console.error(`Failed to crawl ${url}: ${err.message}`);
  }
}

async function buildIncomingLinks() {
  console.log("Processing incoming links map...");
  const pages = await Page.find();
  await Page.updateMany({}, { $set: { incomingLinks: [] } });

  for (const page of pages) {
    const internalOutgoing = page.outgoingLinks
      .filter(link => link.linkType === "internal")
      .map(link => link.url);

    await Page.updateMany(
      { url: { $in: internalOutgoing } },
      { $addToSet: { incomingLinks: page.url } }
    );
  }
}

async function startCrawling() {
  const urls = await fetchSitemapUrls();
  console.log(`Initial URL queue size: ${urls.length}`);

  for (const url of urls) {
    await crawlPage(url);
    await new Promise(resolve => setTimeout(resolve, 500)); 
  }

  await buildIncomingLinks();
  console.log("Crawling and Linking completed successfully");
}

module.exports = { startCrawling };