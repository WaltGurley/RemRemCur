//Global vars
var mic, rec, soundFile,
  rev = 0, rate = 1, osc = [],
  recording = false,
  reversePlay = false,
  linear = true;

var trackDuration, trackStartTime, ellapsedTrackTime = 0;

function windowResized() {
  resizeCanvas(select('#vis-container').width - 30, windowHeight - 120);
}

function setup() {
  var container = select('#vis-container'),
  canvas = createCanvas(container.width - 30, windowHeight - 120);

  canvas.parent('#vis-container');
  background(0, 0, 0);

  mic = new p5.AudioIn();
  fft = new p5.FFT();
  rec = new p5.SoundRecorder();
  soundFile = new p5.SoundFile();

  //Set initial rate to 1.0, normal speed, and volume
  soundFile.rate(rate);
  soundFile.setVolume(1);

  //Reverb
  reverb = new p5.Reverb();
  reverb.amp(1);

  mic.amp(1);
  mic.start();
  mic.connect(fft);

  for (var i = 0; i < 3; i++) {
    osc[i] = new p5.Oscillator();
    osc[i].freq((i + 1) * 440);
    osc[i].amp(0.1);
  }

  colorMode(HSB, 255);
}

function draw() {
  background(0, 0, 0);

  //1 Hz - 24,000 Hz
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
  stroke(0, 0, 255);
  for (var i = 0; i < timeDom.length; i++) {
    var x = map(i, 0, timeDom.length, 0, width);
    var y = map(timeDom[i], 0, 255, 0, height);
    vertex(x, y);
  }
  endShape();

  //Check if soundFile is complete and stop playback if so
  if (soundFile.isPlaying() && (trackDuration - ellapsedTrackTime) - millis() / 1000 <= 0) {
    playbackStopped();
  }
}

//Draw half of frequency domain over linear scale
function linearScale() {
  for (var i = 0; i <= freqDom.length / 2; i++) {
    fill(map(i, 0, freqDom.length / 2, 170, 255), 255, 255);
    var x = map(i , 0, freqDom.length / 2, 20, width - 20);
    var h = map(freqDom[i], 0, 255, height, 0) - height;
    rect(x, height, width / (freqDom.length / 2), h);
    fill(0, 0, 255);
    if (i % 50 === 0) {
      var freq = Math.round(i * 24000 / freqDom.length);
      textAlign(CENTER);
      text(freq.toString() + " Hz", x + width / (freqDom.length / 2), h + height - 20);
    }
  }
}

//Draw half of frequency domain over natural log scale
function logScale() {
  var oldX = 0;
  for (var i = 0; i < freqDom.length; i++) {
    fill(map(i, 0, freqDom.length / 2, 170, 255), 255, 255);
    var x = map(Math.log(i+1) , 0, Math.log(freqDom.length), 0, width);
    var h = map(freqDom[i], 0, 255, height, 0) - height;
    rect(x, height, x - oldX, h);
    fill(0, 0, 255);
    if (Math.log(i) % (Math.log(2)) === 0) {
      var freq = Math.round(i * 24000 / freqDom.length);
      textAlign(CENTER);
      text(freq.toString() + " Hz", (x + (x - oldX) / 2), h + height - 20);
    }
    oldX = x;
  }
}

//Buttons to toggle frequency scale
$(".scale").on("click", function() {
  if (!$(this).hasClass("active")) {
    $(".scale").toggleClass("active");
  }

  if (this.innerHTML === "Linear Scale") {
    linear = true;
  } else if (this.innerHTML === "Log Scale") {
    linear = false;
  }
});

//Button to play 440 Hz tone
$(".tone").on("click", function() {
  $(this).toggleClass("btn-danger");

  if ($(this).hasClass("btn-danger")) {
    osc[this.innerHTML / 440 - 1].start();
  } else { osc[this.innerHTML / 440 - 1].stop(); }
});

//Button to record microphone input
$(".record").on("click", function() {
  if (mic.enabled) {
    $(this).toggleClass("btn-danger");

    if ($(this).hasClass("btn-danger")) {
      recording = true;
      soundFile.stop();
      rec.setInput(mic);
      rec.record(soundFile);
      if ($(".reverse").hasClass("btn-danger")) {
        soundFile.reverseBuffer();
        $(".reverse").removeClass("btn-danger");
      }
      $(this).html("<span class=iconicstroke-mic></span> Stop Rec.");
      $(".play-pause")
        .removeClass("paused")
        .html("<span class=iconicstroke-play></span> Play");
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
  var pressedButton = $(this);

  $(".main-btns").removeClass("active");
  pressedButton.addClass("active");

  if (pressedButton.hasClass("play-pause") && !recording) {

    if (pressedButton.hasClass("paused")) {
      soundFile.pause();
      mic.connect(fft);
      pressedButton.html("<span class=iconicstroke-play></span> Play");
      ellapsedTrackTime = millis() / 1000 - trackStartTime;
    } else {
      soundFile.play();
      mic.disconnect(fft);
      pressedButton.html("<span class=iconicstroke-pause></span> Pause");
      trackDuration = soundFile.duration() / rate + millis() / 1000;
      trackStartTime = millis() / 1000;
    }

    pressedButton.toggleClass("paused");
  } else if (pressedButton.hasClass("stop") && !recording) {
    playbackStopped();
  }
});

//Buttons to control reverb.
// Connect if going from 0 to 1, disconnect if going from 1 to 0
$(".rev").on("click", function() {
  rev = parseInt($(".rev-value").html());
  if (this.value === "up" && rev < 3) {
    rev+= 1;
    if (rev === 1) {
      reverb.connect();
    }
    reverb.process(soundFile, 2 * rev, map(rev, 0, 3, 100, 0));
  } else if (this.value === "down" && rev > 0) {
    rev-= 1;
    if (rev === 0) {
      reverb.disconnect();
    }
    reverb.process(soundFile, 2 * rev, map(rev, 0, 3, 100, 0));
  }
  $(".rev-value").html(rev);
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
  }
});

//Button to reverse playback
$(".reverse").on("click", function() {
  $(this).toggleClass("btn-danger");
  soundFile.reverseBuffer();
});

//Button to save file
$(".save").on("click", function() {
  saveSound(soundFile, "MyFile.wav");
});

//Handle when playback is stopped
function playbackStopped() {
  soundFile.stop();
  mic.connect(fft);
  ellapsedTrackTime = 0;
  $(".main-btns").removeClass("active");
  $(".play-pause")
    .removeClass("paused")
    .html("<span class=iconicstroke-play></span> Play");
}

//Toggle active part of page
$(".nav-list").on("click", function() {
  $(".nav-list").removeClass("active");
  $(this).addClass("active");
});
