const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true 
  },
  html: String,
  outgoingLinks: [{
    url: String,
    linkType: { 
      type: String, 
      enum: ["internal", "external"] }
  }],
  incomingLinks: [
    {
       type: String 
      }
    ]
}, 
{ timestamps: true });

PageSchema.index({ "outgoingLinks.url": 1 });

module.exports = mongoose.model("Page", PageSchema);