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

function generatePrompt(product, message) {
  return `
Only respond with a short and direct answer to the customer's question. Do not include explanations, context, greetings, follow-up questions, or code blocks.
 
Product Information:
- Name: ${product.name}
- Price: ₹${product.price}
- Description: ${product.description}
- In Stock: ${product.inStock ? "Yes" : "No"}
- Usage Instructions: ${product.usageInstructions}
- Warranty Period: ${product.warrantyPeriod}
- Delivery Date: ${product.deliveryDate}
- Store Policy: ${product.storePolicy}
- Refund Amount: ₹${product.refundAmount}
- Refund Status: ${product.refundStatus}
- Order Status: ${product.status}
 
Customer Question: ${message}
Answer:`.trim();
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
    const responseOnly = responseText
      .split("Answer:")
      .pop()
      .trim()
      .split("\n")[0];
    res.json({ response: responseOnly });
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
