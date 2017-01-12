var osc = [];
var note = [];
var touchNum = 0;

function setup() {
  var container = select('#vis-container'),
  canvas = createCanvas(container.width - 30, windowHeight - 100);

  canvas.parent('vis-container');
  background(0, 0, 0);
}

function draw() {
  background(0, 0, 0, 20);
}

function windowResized() {
  resizeCanvas(select('#vis-container').width - 30, windowHeight - 100);
}

function mousePressed() {
  note[0] = new ellipseNote();
  note[0].drawEllipse(mouseX, mouseY);
  note[0].playNote(mouseX, mouseY, 0, true);

  // prevent default
  return false;
}

function touchStarted() {
  touchNum = touches.length - 1;
  note[touchNum] = new ellipseNote();
  note[touchNum].drawEllipse(touches[touchNum].x, touches[touchNum].y);
  note[touchNum].playNote(touches[touchNum].x, touches[touchNum].y, touchNum, true);

  console.log("touch started!", touches);
  // prevent default
  return false;
}

function mouseDragged() {
  note[0].moveEllipse(mouseX, mouseY);
  note[0].playNote(mouseX, mouseY, 0, false);

  // prevent default
  return false;
}

function touchMoved() {
  for (i = 0; i < touches.length; i++) {
    note[i].moveEllipse(touches[i].x, touches[i].y);
    note[i].playNote(touches[i].x, touches[i].y, i, false);
  }

   console.log("touch moved!", touches.length);

  // prevent default
  return false;
}

function mouseReleased() {
  osc[0].fade(0, 0.25);
  osc[0].stop(0.25);

  // prevent default
  return false;
}

function touchEnded() {
  for (i = 0; i < touchNum + 1; i++) {
    osc[i].fade(0, 0.25);
    osc[i].stop(0.25);
  }
  rect(0,0,100,100);
  console.log("touch stopped!", touches.length);

  // prevent default
  return false;
}

var ellipseNote = function() {
  this.ellipseColor = {
    r: random(255),
    g: random(255),
    b: random(255)
  };
};

ellipseNote.prototype.drawEllipse = function(inputX, inputY) {
  //Draw ellipse at input position
  noStroke();
  fill(this.ellipseColor.r, this.ellipseColor.g, this.ellipseColor.b, 130);
  ellipse(inputX, inputY, inputY / 4, inputY / 4);
};

ellipseNote.prototype.moveEllipse = function(inputX, inputY) {
  //Move ellipse based on input position
  ellipse(inputX, inputY, inputY / 4, inputY / 4);
};

ellipseNote.prototype.playNote = function(inputX, inputY, touchNum, start) {
  if (start) {
    osc[touchNum] = new p5.Oscillator('sawtooth');
    osc[touchNum].start();
    // console.log("touch started!")
  }
  //Change frequecy based on mouse x position
  var midiNote = floor(map(inputX, 0, width, 50, 90));
  osc[touchNum].freq(midiToFreq(midiNote));

  //Change amplitude based on mouse y position
  osc[touchNum].amp(map(inputY, 0, 500, 0, 0.4));
};
