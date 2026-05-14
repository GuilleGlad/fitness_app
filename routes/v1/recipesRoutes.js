const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const {addRecipe, listRecipes, getRecipe} = require('../../controllers/recipesController');

//PLANS - /progress
router.post('/add', authenticateMiddleware, authorizeMiddleware('trainer','admin'),addRecipe);
router.get('/list', authenticateMiddleware, authorizeMiddleware('trainer','admin'), listRecipes);
router.get('/get/:recipeId', authenticateMiddleware, getRecipe);
module.exports = router;




