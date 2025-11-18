import express from "express";
import {
  UserLogin,
  UserRegister,
  addToCart,
  addToFavorites,
  getAllCartItems,
  getAllOrders,
  getUserFavorites,
  placeOrder,
  removeFromCart,
  removeFromFavorites,
} from "../controllers/User.js";
import { verifyToken } from "../middleware/verifyUser.js";
import Orders from "../models/Orders.js";

const router = express.Router();

console.log("========== User Routes Initializing ==========");

// Auth routes
router.post("/signup", UserRegister);
router.post("/signin", UserLogin);

// Cart routes
router.post("/cart", verifyToken, addToCart);
router.get("/cart", verifyToken, getAllCartItems);
router.patch("/cart", verifyToken, removeFromCart);

// Favorites routes
router.post("/favorite", verifyToken, addToFavorites);
router.get("/favorite", verifyToken, getUserFavorites);
router.patch("/favorite", verifyToken, removeFromFavorites);

// Order routes - CRITICAL: Must be specific paths, not conflicting
router.post("/order", verifyToken, (req, res, next) => {
  console.log("[ROUTE HIT] POST /api/user/order");
  placeOrder(req, res, next);
});

router.get("/order", verifyToken, (req, res, next) => {
  console.log("[ROUTE HIT] GET /api/user/order");
  console.log("[USER] ID:", req.user.id);
  getAllOrders(req, res, next);
});

// Test endpoint
router.get("/test/all-orders", async (req, res) => {
  try {
    console.log("[TEST] Fetching all orders from DB");
    const allOrders = await Orders.find()
      .populate("products.product")
      .populate("user");
    console.log("[TEST] Total orders in DB:", allOrders.length);
    res.status(200).json({ 
      test: true,
      totalOrders: allOrders.length, 
      orders: allOrders 
    });
  } catch (err) {
    console.error("[TEST] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

console.log("========== User Routes Loaded ==========");

export default router;
