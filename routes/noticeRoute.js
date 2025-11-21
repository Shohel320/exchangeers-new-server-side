const express = require("express");
const { updateNotice, getActiveNotice } = require ("../controler/notice.js");

const router = express.Router();

router.post("/update", updateNotice); // only admin
router.get("/active", getActiveNotice); // for use
//  router;

module.exports = router
