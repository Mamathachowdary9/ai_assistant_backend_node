const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
  })
);

app.use(express.json());

const userDetails = [
  {
    userType: "user",
    userName: "mamatha@gmail.com",
    password: "mamatha123",
  },
  {
    userType: "admin",
    userName: "adminzitara@gmail.com",
    password: "zitara@123",
  },
];

function getIntentFromMessage(message) {
  const lower = message.toLowerCase();

  if (
    /what.*(is|does).*product|product.*description|what does this product do|product features|tell me about the product|describe.*product/.test(
      lower
    )
  )
    return "productDescription";

  if (
    /how much.*(cost|price)|price.*product|what's the price|product.*price|cost of this/.test(
      lower
    )
  )
    return "price";

  if (
    /what.*(product|item).*name|name of (this|the) product|product name|what did i order/.test(
      lower
    )
  )
    return "productName";

  if (
    /product.*availability|available now|can i buy it|is it available|do you sell this/.test(
      lower
    )
  )
    return "productAvailability";

  if (
    /is it in stock|still in stock|product.*stock|is there stock left|check stock/.test(
      lower
    )
  )
    return "inStock";

  if (
    /how to use|instructions|usage guide|how does it work|how do i use this|operate the product/.test(
      lower
    )
  )
    return "productUsage";

  if (
    /warranty|guarantee|warranty period|is it under warranty|how long is warranty/.test(
      lower
    )
  )
    return "productWarranty";

  if (
    /order.*status|where.*order|track.*order|status of.*order|order update/.test(
      lower
    )
  )
    return "orderStatus";

  if (
    /delivery.*(date|time)|when.*arrive|expected delivery|shipping date|delivered by/.test(
      lower
    )
  )
    return "deliveryDate";

  if (
    /refund.*status|has.*refund.*processed|is my refund done|when will i get refund/.test(
      lower
    )
  )
    return "refundStatus";

  if (
    /refund.*amount|how much.*refund|get back.*refund|amount refunded/.test(
      lower
    )
  )
    return "refundAmount";

  if (
    /return.*policy|refund policy|exchange policy|can i return|can i exchange|store policy/.test(
      lower
    )
  )
    return "storePolicy";

  if (
    /order summary|order details|what did i order|show me my order/.test(lower)
  )
    return "orderDetails";

  return "unknown";
}

function generatePrompt(product, message) {
  const intent = getIntentFromMessage(message);
  const responses = {
    productDescription: `Product Description for *${product.name}*:\n${product.description}`,
    price: `The price of *${product.name}* is ₹${product.price}.`,
    productName: `You're checking on: *${product.name}*.`,
    productAvailability: `*${product.name}* is a product available in our store.`,
    inStock: `${product.inStock ? "Yes" : "No"}, *${product.name}* is ${
      product.inStock ? "currently in stock" : "not available right now"
    }.`,
    productUsage: `How to use *${product.name}*:\n${product.usageInstructions}`,
    productWarranty: `*${product.name}* comes with a warranty of ${product.warrantyPeriod}.`,
    orderStatus: `Your order is currently *${product.status}*. You'll get a notification once it's out for delivery or delivered.`,
    deliveryDate: `The expected delivery date is *${product.deliveryDate}*. We’ll keep you posted with tracking updates.`,
    refundStatus: `Refund status: *${product.refundStatus}*. Refunds are usually processed within 3–5 business days.`,
    refundAmount: `The refund amount processed for your order is ₹${product.refundAmount}.`,
    storePolicy: `Store Policy for *${product.name}*:\n${product.storePolicy}`,
    orderDetails: `Here's your order summary:\n• Product: ${product.name}\n• Status: ${product.status}\n• Delivery by: ${product.deliveryDate}`,
    unknown: `I'm not sure how to answer that. Could you please rephrase your question?`,
  };

  const response = responses[intent] || responses.full;

  return `
    Respond ONLY with:
    ${response}
  `.trim();
}

app.post("/chat", async (req, res) => {
  const { product, message } = req.body;

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const prompt = generatePrompt(product, message);

  try {
    const hfResponse = await axios.post(
      `https://api-inference.huggingface.co/models/${process.env.MODEL}`,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        },
      }
    );

    const responseText =
      hfResponse.data?.[0]?.generated_text || "No response generated";

    res.json({ response: responseText.trim() });
  } catch (error) {
    console.error("Hugging Face Error:", error.message);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

app.post("/login", async (req, res) => {
  const { userName, password } = req.body;
  const matchedUser = userDetails.find(
    (user) => user.userName === userName && user.password === password
  );

  if (matchedUser) {
    return res.status(200).json({
      message: "Login successful",
      userType: matchedUser.userType,
    });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
