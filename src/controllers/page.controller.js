const Page = require("../models/page.model");
const { normalizeUrl } = require("../utils/urlHelper");

exports.getIncomingLinks = async (req, res) => {
  try {
    const url = normalizeUrl(req.body.url);
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await Page.countDocuments({ "outgoingLinks.url": url });
    const linkingPages = await Page.find({ "outgoingLinks.url": url })
      .select("url")
      .skip(skip)
      .limit(limit);

    res.json({
      url,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      incomingLinks: linkingPages.map(p => p.url)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOutgoingLinks = async (req, res) => {
  try {
    const url = normalizeUrl(req.body.url);
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;

    const pageDoc = await Page.findOne({ url });
    if (!pageDoc) return res.status(404).json({ message: "Page not found" });

    const totalCount = pageDoc.outgoingLinks.length;
    const startIndex = (page - 1) * limit;
    const paginatedLinks = pageDoc.outgoingLinks.slice(startIndex, startIndex + limit);

    res.json({
      url,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      outgoingLinks: paginatedLinks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopLinkedPages = async (req, res) => {
  try {
    const n = parseInt(req.body.n) || 10;
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const topPages = await Page.aggregate([
      {
        $project: {
          url: 1,
          incomingCount: { $size: { $ifNull: ["$incomingLinks", []] } }
        }
      },
      { $sort: { incomingCount: -1 } },
      { $limit: n }, 
      { $skip: skip }, 
      { $limit: limit }
    ]);

    res.json({
      requestedTopN: n,
      page,
      limit,
      results: topPages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};