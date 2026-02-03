const Page = require("../models/page.model");

exports.getIncomingLinks = async (req, res) => {
  try {
    const { url } = req.body;

    const linkingPages = await Page.find({ "outgoingLinks.url": url }).select("url");

    if (linkingPages.length === 0) {
      return res.status(200).json({ 
        message: "No pages link to this URL yet", 
        count: 0, 
        incomingLinks: [] 
      });
    }

    res.json({ 
      url, 
      count: linkingPages.length, 
      incomingLinks: linkingPages.map(p => p.url) 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOutgoingLinks = async (req, res) => {
  try {
    const { url } = req.body;
    const page = await Page.findOne({ url }).select("outgoingLinks");
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json({ url, outgoingLinks: page.outgoingLinks, count: page.outgoingLinks.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopLinkedPages = async (req, res) => {
  try {
    const { n } = req.body;
    const limitN = parseInt(n) || 10; 

    const pages = await Page.aggregate([
      {
        $project: {
          url: 1,
          incomingCount: { $size: { $ifNull: ["$incomingLinks", []] } }
        }
      },
      { $sort: { incomingCount: -1 } },
      { $limit: limitN }
    ]);

    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};