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
let strokewidth = 5;

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

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
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

//slider
slider.oninput = function () {
  output.textContent = this.value;
  strokewidth = this.value;
};

//colour picker
colourpicker.addEventListener("change", (e) => {
  ctx.strokeStyle = e.target.value;
});

//image export

enter.addEventListener("click", () => {
  const image = canvas.toDataURL("image/jpeg");

  const a = document.createElement("a");
  a.href = image;
  a.download = "Number.jpeg";
  a.click();
});
