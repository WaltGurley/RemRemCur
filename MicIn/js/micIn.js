//Global vars
var mic, rec, soundFile,
  rev = 0, rate = 1,
  recording = false,
  reversePlay = false,
  linear = true;

var trackDuration, trackStartTime, ellapsedTrackTime = 0;

function preload() {
  //exPoem = loadSound("MicahGravesBaleenWhales.mp3");
}

function windowResized() {
  resizeCanvas(getElement('vis-container').width - 30, windowHeight - 100);
}

function setup() {
  var container = getElement('vis-container'),
  canvas = createCanvas(container.width - 30, windowHeight - 100);

  canvas.parent('vis-container');
  background(0, 0, 0);

  mic = new p5.AudioIn();
  fft = new p5.FFT();
  rec = new p5.SoundRecorder();
  soundFile = new p5.SoundFile();

  //Set initial rate to 1.0, normal speed
  soundFile.rate(rate);

  //Reverb
  reverb = new p5.Reverb();
  reverb.amp(1);
  mic.amp(1);
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
  for (var i = 0; i <= freqDom.length / 2; i++) {
    fill(255, 0, 0);
    var x = map(i , 0, freqDom.length / 2, 20, width - 20);
    var h = map(freqDom[i], 0, 255, height, 0) - height;
    rect(x, height, width / (freqDom.length / 2), h);
    fill(255, 255, 255);
    if (i % 50 === 0) {
      var freq = Math.round(i * 24000 / freqDom.length);
      textAlign(CENTER);
      text(freq.toString() + " Hz", x + width / (freqDom.length / 2), h + height - 20);
    }
  }
}

//Draw frequency domain over natural log scale
function logScale() {
  var oldX = 2;
  for (var i = 0; i < freqDom.length; i++) {
    fill(255, 0, 0);
    var x = map(Math.log(i+1) , 0, Math.log(freqDom.length), 0, width);
    var h = map(freqDom[i], 0, 255, height, 0) - height;
    rect(x, height, x - oldX, h);
    oldX = x;
    fill(255, 255, 255);
    if (Math.log(i) % (Math.log(2)) === 0) {
      var freq = Math.round(i * 24000 / freqDom.length);
      textAlign(CENTER);
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

//Button to record microphone input
$(".record").on("click", function() {
  if (mic.enabled) {
    $(this).toggleClass("btn-danger");
    if ($(this).hasClass("btn-danger")) {
      recording = true;
      soundFile.stop();
      rec.record(soundFile);
      if ($(".reverse").hasClass("btn-danger")) {
        soundFile.reverseBuffer();
        $(".reverse").removeClass("btn-danger");
      }
      $(this).html("<span class=iconicstroke-mic></span> Stop Rec.");
      $(".play-pause").removeClass("paused");
      $(".play-pause").html("<span class=iconicstroke-play></span> Play");
    } else {
      recording = false;
      rec.stop();
      $(this).html("<span class=iconicstroke-mic></span> Rec.");
    }
  } else {
    alert("You must allow the browser to use your microphone.");
  }
});

//Buttons to start, stop, or pause playback
$(".main-btns").on("click", function() {
  $(".main-btns").removeClass("active");
  $(this).addClass("active");

  if ($(this).hasClass("play-pause") && !recording) {
    if ($(this).hasClass("paused")) {
      soundFile.pause();
      $(this).html("<span class=iconicstroke-play></span> Play");
      ellapsedTrackTime = millis() / 1000 - trackStartTime;
    } else {
      soundFile.play();
      $(this).html("<span class=iconicstroke-pause></span> Pause");
      trackDuration = soundFile.duration() / rate + millis() / 1000;
      trackStartTime = millis() / 1000;
    }
    $(this).toggleClass("paused");
  } else if ($(this).hasClass("stop") && !recording) {
    soundFile.stop();
    ellapsedTrackTime = 0;
    $(".main-btns").removeClass("active");
    $(".play-pause").removeClass("paused");
    $(".play-pause").html("<span class=iconicstroke-play></span> Play");
  }
});

//Buttons to control reverb.
// Connect if going from 0 to 1, disconnect if going from 1 to 0
$(".rev").on("click", function() {
  rev = parseInt($(".rev-value").html()) * 2;
  if (this.value === "up" && rev < 10) {
    rev+= 2;
    if (rev === 10) {
      reverb.connect();
    }
    reverb.process(soundFile, rev, 0);
  } else if (this.value === "down" && rev > 0) {
    rev-= 2;
    if (rev === 0) {
      reverb.disconnect();
    }
    reverb.process(soundFile, rev, 0);
  }
  $(".rev-value").html(rev / 2);
});

//Buttons to control playback rate
$(".rate").on("click", function() {
  rate = parseFloat($(".rate-value").html());
  if (this.value === "up" && rate < 3) {
    rate+= 0.25;
  } else if (this.value === "down" && rate > 0.25) {
    rate-= 0.25;
  }
  $(".rate-value").html(rate.toFixed(2));

  soundFile.rate(rate);
  if ($(".reverse").hasClass("btn-danger")) {
    soundFile.reverseBuffer();
    console.log("rev w/ rate");
  }
});

//Button to reverse playback
$(".reverse").on("click", function() {
  $(this).toggleClass("btn-danger");
  soundFile.reverseBuffer();
  console.log("rev w/ button");
});

//Button to save file
$(".save").on("click", function() {
  saveSound(soundFile, "MyFile.wav");
});

//Toggle indicators to show state of program
function showState() {
  if (soundFile.isPlaying() && (trackDuration - ellapsedTrackTime) - millis() / 1000 <= 0) {
    soundFile.stop();
    ellapsedTrackTime = 0;
    $(".main-btns").removeClass("active");
    $(".play-pause").removeClass("paused");
    $(".play-pause").html("<span class=iconicstroke-play></span> Play");
    console.log("stopped without button");
  }
}

//FOR DEBUGGING
// function mouseClicked() {
//   console.log(ellapsedTrackTime);
// }
