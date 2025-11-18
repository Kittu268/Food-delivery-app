import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js";
import User from "../models/User.js";
import Orders from "../models/Orders.js";

dotenv.config();

// Auth

export const UserRegister = async (req, res, next) => {
  try {
    const { email, password, name, img } = req.body;

    //Check for existing user
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return next(createError(409, "Email is already in use."));
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      img,
    });
    const createdUser = await user.save();
    const token = jwt.sign({ id: createdUser._id }, process.env.JWT, {
      expiresIn: "9999 years",
    });
    return res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //Check for existing user
    const user = await User.findOne({ email: email }).exec();
    if (!user) {
      return next(createError(409, "User not found."));
    }

    const isPasswordCorrect = await bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT, {
      expiresIn: "9999 years",
    });
    return res.status(200).json({ token, user });
  } catch (err) {
    next(err);
  }
};

//Cart

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userJWT = req.user;
    const user = await User.findById(userJWT.id);
    const existingCartItemIndex = user.cart.findIndex((item) =>
      item.product.equals(productId)
    );
    if (existingCartItemIndex !== -1) {
      // Product is already in the cart, update the quantity
      user.cart[existingCartItemIndex].quantity += quantity;
    } else {
      // Product is not in the cart, add it
      user.cart.push({ product: productId, quantity });
    }
    await user.save();
    return res
      .status(200)
      .json({ message: "Product added to cart successfully", user });
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userJWT = req.user;
    const user = await User.findById(userJWT.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const productIndex = user.cart.findIndex((item) =>
      item.product.equals(productId)
    );
    if (productIndex !== -1) {
      if (quantity && quantity > 0) {
        user.cart[productIndex].quantity -= quantity;
        if (user.cart[productIndex].quantity <= 0) {
          user.cart.splice(productIndex, 1); // Remove the product from the cart
        }
      } else {
        user.cart.splice(productIndex, 1);
      }

      await user.save();

      return res
        .status(200)
        .json({ message: "Product quantity updated in cart", user });
    } else {
      return next(createError(404, "Product not found in the user's cart"));
    }
  } catch (err) {
    next(err);
  }
};

export const getAllCartItems = async (req, res, next) => {
  try {
    const userJWT = req.user;
    const user = await User.findById(userJWT.id).populate({
      path: "cart.product",
      model: "Food",
    });
    const cartItems = user.cart;
    return res.status(200).json(cartItems);
  } catch (err) {
    next(err);
  }
};

//Orders

export const placeOrder = async (req, res, next) => {
  try {
    const { products, address, totalAmount } = req.body;
    const userJWT = req.user;

    console.log("=== PLACE ORDER REQUEST ===");
    console.log("User ID:", userJWT.id);
    console.log("Products:", JSON.stringify(products, null, 2));
    console.log("Address:", address);
    console.log("Total Amount:", totalAmount);

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return next(createError(400, "Products array is required and cannot be empty"));
    }
    if (!address) {
      return next(createError(400, "Address is required"));
    }
    if (!totalAmount || totalAmount <= 0) {
      return next(createError(400, "Valid total amount is required"));
    }

    const user = await User.findById(userJWT.id);
    if (!user) {
      console.error("User not found:", userJWT.id);
      return next(createError(404, "User not found"));
    }

    const order = new Orders({
      products: products,
      user: user._id,
      total_amount: totalAmount,
      address: address,
      status: "Payment Done",
    });

    console.log("Order object before save:", JSON.stringify(order, null, 2));
    
    const savedOrder = await order.save();
    console.log("✓ Order saved successfully:", savedOrder._id);

    // Populate order data
    const populatedOrder = await Orders.findById(savedOrder._id).populate({
      path: "products.product",
      model: "Food",
    });

    user.cart = [];
    await user.save();
    console.log("✓ User cart cleared");

    return res.status(200).json({ 
      message: "Order placed successfully", 
      order: populatedOrder 
    });
  } catch (err) {
    console.error("❌ Order placement error:", err);
    console.error("Error stack:", err.stack);
    next(err);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    console.log("\n================================================");
    console.log("getAllOrders Controller Called");
    console.log("User ID:", userId);
    console.log("================================================");

    // Query the database
    const orders = await Orders.find({ user: userId })
      .populate({
        path: "products.product",
        model: "Food",
      })
      .sort({ createdAt: -1 })
      .exec();

    console.log("✓ Orders found in DB:", orders.length);

    if (orders.length > 0) {
      console.log("First order ID:", orders[0]._id);
      console.log("First order products:", orders[0].products?.length || 0);
    }

    // Create response object with explicit structure
    const responsePayload = {
      orders: orders,
      count: orders.length,
      success: true,
    };

    console.log("Response keys:", Object.keys(responsePayload));
    console.log("Response structure:", JSON.stringify({
      orders: "array[" + orders.length + "]",
      count: orders.length,
      success: true,
    }));

    console.log("Sending response...\n");

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error("❌ getAllOrders Error:", err.message);
    console.error("Stack:", err.stack);
    next(err);
  }
};

//Favorites

export const removeFromFavorites = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userJWT = req.user;
    const user = await User.findById(userJWT.id);
    user.favourites = user.favourites.filter((fav) => !fav.equals(productId));
    await user.save();

    return res
      .status(200)
      .json({ message: "Product removed from favorites successfully", user });
  } catch (err) {
    next(err);
  }
};

export const addToFavorites = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userJWT = req.user;
    const user = await User.findById(userJWT.id);

    if (!user.favourites.includes(productId)) {
      user.favourites.push(productId);
      await user.save();
    }

    return res
      .status(200)
      .json({ message: "Product added to favorites successfully", user });
  } catch (err) {
    next(err);
  }
};

export const getUserFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("favourites").exec();
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const favoriteProducts = user.favourites;
    return res.status(200).json(favoriteProducts);
  } catch (err) {
    next(err);
  }
};
