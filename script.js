const mycanvas = document.getElementById("canvas");
const ctx = mycanvas.getContext("2d");
const slider = document.getElementById("myRange");
const output = document.getElementById("sliderValue");

mycanvas.height = window.innerHeight / 2;
mycanvas.width = window.innerWidth / 3;

let drawing = false;
let posX = 0;
let posY = 0;
let strokewidth = 5;

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
