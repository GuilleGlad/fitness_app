const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const {addRecipe, listRecipes, getRecipe, updateRecipe, deleteRecipe} = require('../../controllers/recipesController');

//PLANS - /progress
router.post('/add', authenticateMiddleware, authorizeMiddleware('trainer','admin'),addRecipe);
router.get('/list', authenticateMiddleware, authorizeMiddleware('trainer','admin'), listRecipes);
router.get('/get/:recipeId', authenticateMiddleware, getRecipe);
router.put('/update', authenticateMiddleware, authorizeMiddleware('trainer','admin'), updateRecipe);
router.delete('/delete/:recipeId', authenticateMiddleware, authorizeMiddleware('trainer','admin'), deleteRecipe);
module.exports = router;




