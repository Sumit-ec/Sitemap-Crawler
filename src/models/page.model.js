const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  html: {
    type: String
  },
  outgoingLinks: [
    {
      url: String,
      linkType: { 
        type: String,
        enum: ["internal", "external"]
      }
    }
  ],
  incomingLinks: [
    {
      type: String
    }
  ]
}, { timestamps: true });

// PageSchema.index({ url: 1 });
PageSchema.index({ "outgoingLinks.url": 1 });
PageSchema.index({ incomingLinks: 1 });

module.exports = mongoose.model("Page", PageSchema);