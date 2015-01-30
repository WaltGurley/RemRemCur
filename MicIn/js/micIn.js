//Global vars for now, may move timeDom & freqDom later
var mic, rec, soundFile,
  linear = true,
  state;

function windowResized() {
  resizeCanvas(getElement('vis-container').width - 30, windowHeight - 100);
}

function setup() {
  var container = getElement('vis-container'),
  canvas = createCanvas(container.width - 30, windowHeight - 100);

  canvas.parent('vis-container');
  background(0, 0, 0);
  textAlign(CENTER);

  mic = new p5.AudioIn();
  fft = new p5.FFT();
  rec = new p5.SoundRecorder();
  soundFile = new p5.SoundFile();

  //Filter
  // filter = new p5.BandPass();
  // filter.res(50);
  // filter.freq(1000);
  // filter.amp(1);

  mic.start();
  mic.connect(fft);
  rec.setInput(mic);
  soundFile.setVolume(1);
}

function draw() {
  var vol = mic.getLevel(),
    col = map(vol, 0, 1, 0, 255);
  background(0, 0, col);

  //Indicate state of program (i.e., recording, playback, or live)
  noStroke();
  fill(255, 255, 255);
  textSize(32);
  showState();

  //1 Hz - 22,050 Hz
  freqDom = fft.analyze();
  timeDom = fft.waveform();

  //Toggle drawing of linear or log scale (frequency domain)
  textSize(12);
  noStroke();
  if (linear) {
    linearScale();
  } else {
    logScale();
  }

  //Draw waveform (time domain)
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

//Draw frequency domain over linear scale
function linearScale() {
  for (var i = 0; i < freqDom.length / 2; i++) {
    fill(255, 0, 0);
    var x = map(i , 0, freqDom.length / 2, 0, width);
    var h = map(freqDom[i], 0, 255, height, 0) - height;
    rect(x, height, width / (freqDom.length / 2), h);
    fill(255, 255, 255);
    if (i % 50 === 0) {
      var freq = Math.round(i * 22050 / freqDom.length);
      text(freq.toString() + " Hz", x + width / (freqDom.length / 2), h + height - 20);
    }
  }
}

//Draw frequency domain over natural log scale
function logScale() {
  var oldX = 2;
  for (var i = 0; i < freqDom.length; i++) {
    fill(255, 0, 0);
    var x = map(Math.log(i+2) , 0, Math.log(freqDom.length), 0, width);
    var h = map(freqDom[i], 0, 255, height, 0) - height;
    rect(x, height, x - oldX, h);
    oldX = x;
    fill(255, 255, 255);
    if (Math.log(i) % (Math.log(2)) === 0) {
      var freq = Math.round(i * 22050 / freqDom.length);
      text(freq.toString() + " Hz", x + (x - oldX) / 2, h + height - 20);
    }
  }
}

//Buttons to toggle frequency scale
$(".scale").on("click", function() {
  if (!$(this).hasClass("active")) {
    $(".scale").toggleClass("active");
  }

  if (this.innerHTML === "Linear Frequency") {
    linear = true;
  } else if (this.innerHTML === "Log Frequency") {
    linear = false;
  }
});

//Setup for recording
var recordToggle = 0,
  recording;
function keyPressed() {
  if (key === "R" && mic.enabled) {
    if (recordToggle % 2 === 0) {
      recording = true;
      soundFile.stop();
      rec.record(soundFile);
      text("Recording", 10, 25);
    } else {
      rec.stop();
      recording = false;
    }
    recordToggle++;
  } else if (key === "P" && !recording) {
    // soundFile.disconnect();
    // soundFile.connect(filter);
    soundFile.play();
  }
}

//Toggle indicators to show state of program
function showState() {
  if (soundFile.duration() - soundFile.currentTime() <= 0.1) {
    soundFile.stop();
  }

  state = recording ? "Recording" : soundFile.isPlaying() ? "Recorded Sound" : "Live Sound";
  text(state, 10, 30);
}
