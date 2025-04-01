import mongoose from "mongoose";
import Shoe from "../models/shoes.model.js";

// Helper function to format price range
const formatPrice = (text) => {
  let slicedPrice = { maxRange: 9999, minRange: 0 };
  if (text.includes("above")) {
    slicedPrice.minRange = parseFloat(
      text.slice(1, text.indexOf("-") - 1).trim()
    );
  } else {
    slicedPrice.maxRange = parseFloat(text.slice(text.indexOf("-") + 1).trim());
    slicedPrice.minRange = parseFloat(
      text.slice(1, text.indexOf("-") - 1).trim()
    );
  }
  return slicedPrice;
};
//add a data(shoe)
export const addShoe = async (req, res) => {
  try {
    const newShoe = new Shoe(req.body);
    await newShoe.save();

    res.status(201).json({
      success: true,
      message: "Shoe added successfully!",
      data: newShoe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add shoe",
      error: error.message,
    });
  }
};

//DELETE A PRODUCT
export const deleteShoe = async (req, res) => {
  try {
    const shoe = await Shoe.findByIdAndDelete(req.params.id);

    if (!shoe) {
      return res.status(404).json({ message: "Shoe not found!" });
    }

    res.status(200).json({ message: "Shoe deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//UPDATE A PRODUCT
export const updateShoe = async (req, res) => {
  try {
    const updatedShoe = await Shoe.findByIdAndUpdate(
      req.params.id,
      req.body, // Request body contains updated fields
      { new: true, runValidators: true }
    );

    if (!updatedShoe) {
      return res.status(404).json({ message: "Shoe not found!" });
    }

    res.status(200).json(updatedShoe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//get a shoe by id
export const getShoeById = async (req, res) => {
  try {
    const shoe = await Shoe.findById(req.params.id);
    if (!shoe) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json(shoe);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//get all shoes
export const getAllShoes = async (req, res) => {
  try {
    const shoes = await Shoe.find({});

    res.status(200).json({
      success: true,
      data: shoes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve shoes",
      error: error.message,
    });
  }
};
// Get all shoes with filtering & pagination
export const getShoesWithFilteredAndPagination = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    let filterQuery = {};
    if (req.query.brand && req.query.brand.toLowerCase() !== "all") {
      filterQuery.brand = req.query.brand;
    }

    if (req.query.category && req.query.category.toLowerCase() !== "all") {
      filterQuery.category = req.query.category.toLowerCase();
    }

    if (req.query.color && req.query.color.toLowerCase() !== "all") {
      filterQuery.availableColors = { $in: [req.query.color.toLowerCase()] };
    }

    // if (req.query.size && req.query.size.toLowerCase() !== "all") {
    //   filterQuery.availableSizes = { $in: [parseInt(req.query.size)] };
    // }

    if (req.query.keyword) {
      filterQuery.title = { $regex: req.query.keyword, $options: "i" };
    }

    if (req.query.price && req.query.price.toLowerCase() !== "all") {
      const slicedPrice = formatPrice(req.query.price);
      filterQuery.newPrice = {
        $gte: slicedPrice.minRange,
        $lte: slicedPrice.maxRange,
      };
    }

    let shoes = await Shoe.find(filterQuery).limit(limit).skip(skip);
    const totalItems = await Shoe.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      data: shoes,
      hasMore: totalPages > page,
      page,
      meta: {
        currentPage: page,
        totalPages,
        totalItems,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addReview = async (req, res) => {
  const { id } = req.params;
  const { user, comment, rating } = req.body;

  // Validate rating range
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5",
    });
  }

  try {
    // Find shoe by ID
    const shoe = await Shoe.findById(id);
    if (!shoe) {
      return res.status(404).json({
        success: false,
        message: "Shoe not found",
      });
    }

    // Check if the user has already left a review
    const existingReview = shoe.reviews.find(
      (review) => review.user.toString() === user
    );

    if (existingReview) {
      // Update existing review
      existingReview.comment = comment;
      existingReview.rating = rating;
      existingReview.date = new Date();
    } else {
      // Add a new review
      const newReview = { user, comment, rating, date: new Date() };
      shoe.reviews.push(newReview);
    }

    // Calculate the new average rating
    const totalRatings = shoe.reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings / shoe.reviews.length;

    // Update ratings field in the database
    shoe.ratings = {
      average: averageRating.toFixed(1), // Round to 1 decimal place
      total: shoe.reviews.length,
    };

    // Save updated shoe document
    await shoe.save();

    res.status(200).json({
      success: true,
      message: existingReview
        ? "Review updated successfully!"
        : "Review added successfully!",
      data: shoe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: error.message,
    });
  }
};
