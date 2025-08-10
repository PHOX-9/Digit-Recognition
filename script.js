const mycanvas = document.getElementById("canvas");
const ctx = mycanvas.getContext("2d");
const slider = document.getElementById("myRange");
const output = document.getElementById("sliderValue");
const enter = document.getElementById("enter");
const pred = document.getElementById("prediction");

if (window.innerWidth <= 600) {
  mycanvas.height = 300;
  mycanvas.width = 300;
} else {
  mycanvas.height = 450;
  mycanvas.width = 450;
}

let drawing = false;
let posX = 0;
let posY = 0;
let strokewidth = 25;

ctx.fillStyle = "white";
ctx.fillRect(0, 0, mycanvas.width, mycanvas.height);

//Mouse Event listeners

mycanvas.addEventListener("mousedown", (e) => {
  init(e);
  drawing = true;
});

mycanvas.addEventListener("mouseup", () => {
  drawing = false;
});

mycanvas.addEventListener("mousemove", (e) => {
  if (drawing) draw(e.offsetX, e.offsetY);
});

//Touch event listeners

mycanvas.addEventListener("touchstart", (e) => {
  initTouch(e);
  drawing = true;
});

mycanvas.addEventListener("touchend", () => {
  drawing = false;
});

mycanvas.addEventListener("touchmove", (e) => {
  if (drawing) {
    e.preventDefault(); // Prevent scrolling
    const rect = mycanvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    draw(x, y);
  }
});

// Initialize for mouse
function init(e) {
  posX = e.offsetX;
  posY = e.offsetY;
}

// Initialize for touch
function initTouch(e) {
  e.preventDefault();
  const rect = mycanvas.getBoundingClientRect();
  posX = e.touches[0].clientX - rect.left;
  posY = e.touches[0].clientY - rect.top;
}

// Unified draw function for both mouse & touch
function draw(x, y) {
  ctx.lineWidth = strokewidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(posX, posY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.closePath();

  posX = x;
  posY = y;
}

const clearbtn = document.getElementById("clear");

clearbtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, mycanvas.width, mycanvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, mycanvas.width, mycanvas.height);
  pred.textContent = "";
});

//slider
slider.oninput = function () {
  output.textContent = this.value;
  strokewidth = 20.0 + parseInt(this.value);
  console.log(strokewidth);
};

//colour picker
colourpicker.addEventListener("change", (e) => {
  ctx.strokeStyle = e.target.value;
});

//model
let model;

async function loadModel() {
  try {
    // Create the model architecture to match your JSON exactly
    model = tf.sequential();

    // Input layer - explicit shape
    model.add(
      tf.layers.inputLayer({
        inputShape: [28, 28, 1],
        name: "input_layer",
      })
    );

    // First Conv2D layer
    model.add(
      tf.layers.conv2d({
        filters: 32,
        kernelSize: [3, 3],
        activation: "relu",
        name: "conv2d",
      })
    );

    // First MaxPooling layer
    model.add(
      tf.layers.maxPooling2d({
        poolSize: [2, 2],
        strides: [2, 2],
        name: "max_pooling2d",
      })
    );

    // Second Conv2D layer
    model.add(
      tf.layers.conv2d({
        filters: 48,
        kernelSize: [3, 3],
        activation: "relu",
        name: "conv2d_1",
      })
    );

    // Second MaxPooling layer
    model.add(
      tf.layers.maxPooling2d({
        poolSize: [2, 2],
        strides: [2, 2],
        name: "max_pooling2d_1",
      })
    );

    // Dropout layer
    model.add(
      tf.layers.dropout({
        rate: 0.5,
        name: "dropout",
      })
    );

    // Flatten layer
    model.add(
      tf.layers.flatten({
        name: "flatten",
      })
    );

    // First Dense layer
    model.add(
      tf.layers.dense({
        units: 500,
        activation: "relu",
        name: "dense",
      })
    );

    // Output layer
    model.add(
      tf.layers.dense({
        units: 10,
        activation: "softmax",
        name: "dense_1",
      })
    );

    // Load weights
    const weightsResponse = await fetch("model/group1-shard1of1.bin");
    const weightsBuffer = await weightsResponse.arrayBuffer();
    const weightsArray = new Float32Array(weightsBuffer);

    // Set weights in correct order
    const weights = [];
    let offset = 0;

    // Weight shapes in order of layers
    const weightShapes = [
      [3, 3, 1, 32], // conv2d kernel
      [32], // conv2d bias
      [3, 3, 32, 48], // conv2d_1 kernel
      [48], // conv2d_1 bias
      [1200, 500], // dense kernel (28x28 -> maxpool(13x13) -> maxpool(5x5) -> 5*5*48 = 1200)
      [500], // dense bias
      [500, 10], // dense_1 kernel
      [10], // dense_1 bias
    ];

    for (const shape of weightShapes) {
      const size = shape.reduce((a, b) => a * b, 1);
      const values = weightsArray.slice(offset, offset + size);
      offset += size;
      weights.push(tf.tensor(values, shape));
    }

    model.setWeights(weights);

    // Compile the model (not necessary for inference but good practice)
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "sparseCategoricalCrossentropy",
      metrics: ["accuracy"],
    });

    console.log("Model loaded successfully!");
    model.summary();
  } catch (err) {
    console.error("Error loading model:", err);
  }
}

loadModel();

// FIXED PREDICTION FUNCTION
enter.addEventListener("click", async () => {
  if (!model) {
    alert("Model is still loading. Please try again in a moment.");
    return;
  }

  try {
    // Create a temporary canvas for processing
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tctx = tempCanvas.getContext("2d");

    // Fill background to white
    tctx.fillStyle = "white";
    tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw and scale to 28x28
    tctx.drawImage(mycanvas, 0, 0, 28, 28);

    // Get image data
    const imageData = tctx.getImageData(0, 0, 28, 28);
    const data = imageData.data;

    // Convert to grayscale and normalize
    const inputData = new Float32Array(28 * 28 * 1);
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale (luminance method)
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Normalize to 0-1 and invert (MNIST style - white on black)
      inputData[i / 4] = (255 - gray) / 255.0;
    }

    // Create tensor for prediction
    const inputTensor = tf.tensor4d(inputData, [1, 28, 28, 1]);

    // Make prediction
    const prediction = model.predict(inputTensor);
    const results = await prediction.data();

    // Get the predicted digit
    const predictedDigit = results.indexOf(Math.max(...results));
    console.log(`Predicted digit: ${predictedDigit}`);

    pred.textContent = "Predicted Number: " + predictedDigit;

    // Clean up
    inputTensor.dispose();
    prediction.dispose();
  } catch (err) {
    console.error("Prediction error:", err);
    alert("Error making prediction. See console for details.");
  }
});
