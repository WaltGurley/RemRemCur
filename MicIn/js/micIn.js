//Global vars for now, may move timeDom & freqDom later
var timeDom, freqDom, mic,
  linear = true;

function setup() {
  var container = getElement('vis-container'),
  canvas = createCanvas(container.width - 30, windowHeight - 100);

  canvas.parent('vis-container');
  background(0, 0, 0);

  mic = new p5.AudioIn();
  fft = new p5.FFT();

  mic.start();
  mic.connect(fft);
}

function draw() {
  var vol = mic.getLevel(),
    col = map(vol, 0, 1, 0, 255);
  //console.log(col);
  background(0, 0, col);

  freqDom = fft.analyze();
  timeDom = fft.waveform();

  noStroke();
  textSize(12);
  fill(255, 0, 0);

  //Toggle linear or log scale
  if (linear) {
    linearScale();
  } else {
    logScale();
  }

  noFill();
  beginShape();
  strokeWeight(2);
  stroke(255, 255, 255);
  for (var i = 0; i < timeDom.length; i++) {
    var x = map(i, 0, timeDom.length, 0, width);
    var y = map(timeDom[i], 0, 255, 0, height);
    vertex(x, y);
  }
  endShape();
}

function linearScale() {
  for (var i = 0; i < freqDom.length / 2; i++) {
    var x = map(i , 0, freqDom.length / 2, 0, width);
    var h = map(freqDom[i], 0, 255, height, 0) - height;
    rect(x, height, width / (freqDom.length / 2), h);
    if (i % 100 === 0) {
      var freq = Math.round(i * 22050 / freqDom.length);
      text(freq.toString() + " Hz", x, h + height - 20);
    }
  }
}

function logScale() {
  var oldX = 0;
  for (var i = 0; i < freqDom.length; i++) {
    var x = map(Math.log(i+1) , 0, Math.log(freqDom.length), 0, width);
    var h = map(freqDom[i], 0, 255, height, 0) - height;
    rect(x, height, x - oldX, h);
    oldX = x;
    if (i % 5 === 0) {
      var freq = Math.round(i * 22050 / freqDom.length);
      text(freq.toString() + " Hz", x, h + height - 20);
    }
  }
}

//1 Hz - 22,050 Hz

//Buttons to toggle frequency scale
$(".scale").on("click", function() {
  if (this.innerHTML === "Linear Frequency") {
    linear = true;
  } else if (this.innerHTML === "Log Frequency") {
    linear = false;
  }
});
