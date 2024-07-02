const express = require("express");
const { registerUser, authUser, allUsers } = require("../controllers/userControllers");
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// Define routes
router.route('/')
  .post(registerUser)
  .get(protect, allUsers);

router.route('/login')
  .post(authUser);

module.exports = router;
