const axios = require("axios");
const cheerio = require("cheerio");
const Page = require("../models/page.model");

const BASE_DOMAIN = "https://www.edzy.ai";

async function fetchSitemapUrls() {
  try {
    console.log("Attempting to fetch sitemap...");
    const { data } = await axios.get(`${BASE_DOMAIN}/sitemap.xml`, { 
      timeout: 15000,
      headers: { 
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const locRegex = /<loc>(.*?)<\/loc>/g;
    const urls = [];
    let match;
    while ((match = locRegex.exec(data)) !== null) {
      urls.push(match[1].trim());
    }

    // if (urls.length === 0) {
    //   console.warn("⚠️ Sitemap returned 0 URLs (Site blocked the bot). Switching to Homepage Crawler mode...");
    //   // Return just the homepage as a starting point
    //   return [BASE_DOMAIN]; 
    // }

    if (urls.length === 0) {
  console.warn("⚠️ Sitemap blocked. Using manual URL list for testing...");
  return [
    "https://www.edzy.ai",
    "https://www.edzy.ai/about",
    "https://www.edzy.ai/blog",
    "https://www.edzy.ai/cbse",
    "https://www.edzy.ai/buy"
  ]; 
}

    return urls;
  } catch (err) {
    console.error("Error fetching sitemap:", err.message);
    return [BASE_DOMAIN]; // Fallback to homepage on error
  }
}

async function startCrawling() {
  const urls = await fetchSitemapUrls();
  console.log(`Initial URL queue size: ${urls.length}`);

  // Loop through URLs
  for (const url of urls) {
    await crawlPage(url);
    // Add a small delay so we don't get banned
    await new Promise(resolve => setTimeout(resolve, 500)); 
  }

  await buildIncomingLinks();
  console.log("🚀 Crawling and Linking completed successfully");
}

async function crawlPage(url) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    const outgoingLinks = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      try {
        const resolvedUrl = new URL(href, url); 
        const isInternal = resolvedUrl.hostname.includes("edzy.ai");
        
        outgoingLinks.push({ 
          url: resolvedUrl.href, 
          linkType: isInternal ? "internal" : "external" 
        });
      } catch (e) {
      }
    });

    await Page.findOneAndUpdate(
      { url },
      { url, html: data, outgoingLinks },
      { upsert: true, new: true }
    );
    console.log(`✅ Crawled: ${url}`);
  } catch (err) {
    console.error(`❌ Failed to crawl ${url}: ${err.message}`);
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
  console.log(`Found ${urls.length} URLs in sitemap.`);

  for (const url of urls) {
    await crawlPage(url);
  }

  await buildIncomingLinks();
  console.log("🚀 Crawling and Linking completed successfully");
}

module.exports = { startCrawling };