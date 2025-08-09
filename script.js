const mycanvas = document.getElementById("canvas");
const ctx = mycanvas.getContext("2d");
const slider = document.getElementById("myRange");
const output = document.getElementById("sliderValue");
const enter = document.getElementById("enter");

mycanvas.height = window.innerHeight / 1.5;
mycanvas.width = window.innerWidth / 3;

let drawing = false;
let posX = 0;
let posY = 0;
let strokewidth = 25;

ctx.fillStyle = "white";
ctx.fillRect(0, 0, mycanvas.width, mycanvas.height);

mycanvas.addEventListener("mousedown", (e) => {
  init(e);
  drawing = true;
});

mycanvas.addEventListener("mouseup", () => {
  drawing = false;
});

mycanvas.addEventListener("mousemove", (e) => {
  if (drawing) draw(e);
});

function init(e) {
  posX = e.offsetX;
  posY = e.offsetY;
}

function draw(e) {
  ctx.lineWidth = strokewidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(posX, posY);
  ctx.lineTo(e.offsetX, e.offsetY);

  ctx.stroke();

  ctx.closePath();
  posX = e.offsetX;
  posY = e.offsetY;
}

const clearbtn = document.getElementById("clear");

clearbtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, mycanvas.width, mycanvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, mycanvas.width, mycanvas.height);
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
    // Load the model configuration separately
    const modelResponse = await fetch("model/model.json");
    const modelJson = await modelResponse.json();

    // Manually create the model architecture
    const modelConfig = modelJson.modelTopology.model_config;
    const layers = modelConfig.config.layers;

    // Create a sequential model
    model = tf.sequential();

    // Add layers manually
    layers.forEach((layerConfig) => {
      const layerClass = layerConfig.class_name;
      const config = layerConfig.config;

      switch (layerClass) {
        case "InputLayer":
          // We'll skip input layer since it's handled internally
          break;
        case "Conv2D":
          model.add(
            tf.layers.conv2d({
              filters: config.filters,
              kernelSize: config.kernel_size,
              strides: config.strides,
              padding: config.padding,
              activation: config.activation,
              inputShape: [28, 28, 1], // Add input shape explicitly
            })
          );
          break;
        case "MaxPooling2D":
          model.add(
            tf.layers.maxPooling2d({
              poolSize: config.pool_size,
              strides: config.strides,
            })
          );
          break;
        case "Dropout":
          model.add(tf.layers.dropout({ rate: config.rate }));
          break;
        case "Flatten":
          model.add(tf.layers.flatten());
          break;
        case "Dense":
          model.add(
            tf.layers.dense({
              units: config.units,
              activation: config.activation,
            })
          );
          break;
      }
    });

    // Load weights
    const weightsResponse = await fetch("model/group1-shard1of1.bin");
    const weightsBuffer = await weightsResponse.arrayBuffer();
    const weightsArray = new Float32Array(weightsBuffer);

    // Manually set weights
    const weights = [];
    let offset = 0;

    // Define weight shapes in the order they appear in your model
    const weightShapes = [
      [3, 3, 1, 32], // conv2d kernel
      [32], // conv2d bias
      [3, 3, 32, 48], // conv2d_1 kernel
      [48], // conv2d_1 bias
      [1200, 500], // dense kernel
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
    console.log("Model loaded successfully!");
    console.log("Model summary:", model.summary());
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

    // Show result to user
    alert(`Predicted digit: ${predictedDigit}`);

    // Clean up
    inputTensor.dispose();
    prediction.dispose();
  } catch (err) {
    console.error("Prediction error:", err);
    alert("Error making prediction. See console for details.");
  }
});
