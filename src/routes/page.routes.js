const express = require("express");
const {
  getIncomingLinks,
  getOutgoingLinks,
  getTopLinkedPages
} = require("../controllers/page.controller");

const router = express.Router();

router.post("/incoming", getIncomingLinks);
router.post("/outgoing", getOutgoingLinks);
router.post("/top-linked", getTopLinkedPages);

module.exports = router;
