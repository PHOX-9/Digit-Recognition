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

//image export

enter.addEventListener("click", () => {
  const imageData = ctx.getImageData(0, 0, mycanvas.width, mycanvas.height);
  const data = imageData.data;

  //temporary canvas to store negative values
  const tempcanvas = document.createElement("canvas");
  tempcanvas.height = window.innerHeight / 1.5;
  tempcanvas.width = window.innerWidth / 3;
  const tctx = tempcanvas.getContext("2d");

  //temporary canvas to scale it to 28x28
  const tempcanvas2 = document.createElement("canvas");
  tempcanvas2.height = 28;
  tempcanvas2.width = 28;
  const tctx2 = tempcanvas2.getContext("2d");

  //converting all colours to black so that it can easily be inverted
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] == 255 && data[i + 1] == 255 && data[i + 2] == 255) continue;
    else {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }

  //inverting black to white and white to black
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }

  tctx.putImageData(imageData, 0, 0);

  tctx2.drawImage(tempcanvas, 0, 0, 28, 28);

  const image = tempcanvas2.toDataURL("image/jpeg");

  const a = document.createElement("a");
  a.href = image;
  a.download = "Number.jpeg";
  a.click();
});
