const express = require('express');
const { manageUser } = require('../controllers/adminController');
const router = express.Router();

router.post('/manage-user', manageUser);

module.exports = router;
