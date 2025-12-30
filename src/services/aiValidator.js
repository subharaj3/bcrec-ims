// src/services/aiValidator.js
import * as mobilenet from "@tensorflow-models/mobilenet";
import "@tensorflow/tfjs"; // Loads the backend (CPU/WebGL)

// 1. Define "Allowed" Keywords
// MobileNet detects 1000 types of objects. We only want these:
// src/services/aiValidator.js
// ... imports

const VALID_KEYWORDS = [
  "wall",
  "monitor",
  "screen",
  "desk",
  "table",
  "chair",
  "seat",
  "cabinet",
  "shelf",
  "fan",
  "electric fan",
  "switch",
  "light",
  "computer",
  "keyboard",
  "mouse",
  "printer",
  "projector",
  "wires",
  "window",
  "door",
  "floor",
  "tile",
  "glass",
  "radiator",
  "heater",
  "toilet",
  "sink",
  "basin",
  "tap",
  "faucet",
  "mirror",
  "soap",
  "towel",
  "bathroom",
  "tub",
];

// Singleton pattern to load model once
let model = null;

const loadModel = async () => {
  if (!model) {
    console.log("Loading TensorFlow MobileNet model...");
    model = await mobilenet.load();
    console.log("Model loaded!");
  }
  return model;
};

export const validateImageContent = async (file) => {
  if (!file) return { isValid: false, reason: "No file provided" };

  try {
    const net = await loadModel();

    // 1. Convert File -> HTMLImageElement (Required by TF.js)
    const imgElement = document.createElement("img");
    imgElement.src = URL.createObjectURL(file);

    // Wait for image to load into memory
    await new Promise((resolve) => {
      imgElement.onload = resolve;
    });

    // 2. Classify
    // Returns array: [{ className: "desktop computer", probability: 0.9 }, ...]
    const predictions = await net.classify(imgElement);
    console.log("AI Predictions:", predictions);

    // Clean up memory
    URL.revokeObjectURL(imgElement.src);

    // 3. Logic: Check if ANY prediction matches our keywords
    const topPrediction = predictions[0]; // The most likely object

    // Check if any of the top 3 predictions contain our keywords
    const isRelevant = predictions.some((p) =>
      VALID_KEYWORDS.some((keyword) =>
        p.className.toLowerCase().includes(keyword)
      )
    );

    if (isRelevant) {
      return {
        isValid: true,
        tags: predictions.map((p) => p.className).slice(0, 3),
      };
    } else {
      return {
        isValid: false,
        reason: `Image appears to be not related! . Please upload a Valid Photo of campus infrastructure.`,
      };
    }
  } catch (error) {
    console.error("AI Error:", error);
    // Fail safe: If AI breaks, allow upload but log warning
    return { isValid: true, tags: ["ai-error"] };
  }
};
