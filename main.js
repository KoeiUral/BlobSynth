
class Wobbler {
    constructor(x, y, maxR, faces) {
        this.posX = x;
        this.posY = y;
        this.delta = TWO_PI / faces;
        this.maxR = maxR;
        this.minR = maxR - maxR / 2;
        this.targetX = x;
        this.targetY = y;
        this.targetMaxR = maxR;

        this.cenX = x;
        this.cenY = y;
        this.cenRad = maxR;
        this.gridX = 0;
        this.gridY = 0;
        this.gridRad = 0;
        this.circleX = 0;
        this.circleY = 0;
        this.circleRad = 0;

        this.noiseMag = 0;
        this.phaseInc = 0;
        this.tInc = 0.01;
        this.t = 0;
        this.noisePhase = 0;
        this.seed = random(100);
        this.polygon = [];

        this.alpha = random(100, 255);
        this.playRadius = 0;
        this.isPlaying = false;
        this.note = 0;
    }

    setDynamics(rotInc, timeInc, noiseMag) {
        this.phaseInc = rotInc;
        this.tInc = timeInc;
        this.noiseMag = noiseMag;
        this.note = map(this.phaseInc, 0, 0.01, 69.30,  493.88);
    }
   
    draw() {
        if(this.isPlaying) {
            strokeWeight(6);
            stroke(strokeColor, 255);
        } else {
            strokeWeight(1);
            stroke(strokeColor, this.alpha);
        }

        noFill();
        beginShape();
        for (let i = 0; i < this.polygon.length; i++) {
            let x = this.polygon[i][0];
            let y = this.polygon[i][1];
            vertex(x, y);
        }
        endShape(CLOSE);
    }
  
    blob() {
        noiseSeed(this.seed);
        // Empty the array
        this.polygon.length = 0;

        for (let a = 0; a < TWO_PI; a += this.delta) {
            let xOff = map(cos(a + this.noisePhase), -1, 1, 0, this.noiseMag);
            let yOff = map(sin(a + this.noisePhase), -1, 1, 0, this.noiseMag);
            let r = map(noise(xOff, yOff, this.t), 0, 1, this.minR, this.maxR);
            let x = cos(a) * r + this.posX;
            let y = sin(a) * r + this.posY;
            this.polygon.push([x, y]);
            this.playRadius = r;
        }

        this.noisePhase = (this.noisePhase + this.phaseInc) % TWO_PI;
        this.t += this.tInc;

        // Move posX posY towards target
        this.posX = lerp(this.posX, this.targetX, 0.1);
        this.posY = lerp(this.posY, this.targetY, 0.1);
        this.maxR = lerp(this.maxR, this.targetMaxR, 0.1);
        this.minR = this.maxR / 2;
    }

    play() {
        let note = this.note;// + switchId * 500; // TODO: switch per switchId, i.e mult
        polySynth.play(note, 0.3, 0, dur);
    }
}

let wobbNumber = 8;
let wobblers = [];

let groupSize = 4;
let repTime = 2;
let groupTime = repTime;
let groupOffset = 0;
let lastPlayed = 0;
let switchId = 0;
let switchFlag = false;

let soundLen = 125; //in ms
const fps = 60;
let dur = soundLen / 1000;
let triggerRatio = soundLen / (1000/fps);
let playFlag = false;

let polySynth;
let playId;

let strokeColor = 255;
let bgColor = 0;

function updateSoundParam(len) {
    soundLen = len;
    dur = soundLen / 1000;
    triggerRatio = soundLen / (1000/fps);
    triggerRatio = floor(triggerRatio);
}

function setCentrinc() {
    for (let i = 0; i < wobbNumber; i++) {
        let maxRad = halfWidth * (1 -  i / wobbNumber);

        wobblers[i].cenX = halfWidth;
        wobblers[i].cenY = halfHeight;
        wobblers[i].cenRad = maxRad;
    }
}

function setGrid() {
    let rows = ceil(sqrt(wobbNumber));
    let scl = width / rows;
    let wobCount = 0;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < rows; j++) {
            let maxRad = scl / 2;
            let x = scl * i + scl/2;
            let y = scl * j + scl/2;

            wobblers[wobCount].gridX = x;
            wobblers[wobCount].gridY = y;
            wobblers[wobCount].gridRad = maxRad;

            wobCount++;

            if (wobCount === wobbNumber)
                break;
        }
    }
}

function setCircle() {
    let wobCount = 0; 
    let delta = TWO_PI / wobbNumber;

    for (let a = 0; a < TWO_PI; a+=delta) {
        let maxRad = width / wobbNumber;
        //let faces = round(map(a, 0, TWO_PI, 50, 10));
        //let magnitude = map(a, 0, TWO_PI, 10, 0.5);
        //let timeInc = random(0.01, 0.5);
        //let phaseInc = random(0, 0.01);

        let r = width / 2 - maxRad;
        let x = r * cos(a) + width/2;
        let y = r * sin(a) + width/2;

        wobblers[wobCount].circleX = x;
        wobblers[wobCount].circleY = y;
        wobblers[wobCount].circleRad = maxRad;

        wobCount++;
    }  
}

function switchToCenter() {
    for (let i = 0; i < wobbNumber; i++) {
        wobblers[i].targetX = wobblers[i].cenX;
        wobblers[i].targetY = wobblers[i].cenY ;
        wobblers[i].targetMaxR = wobblers[i].cenRad;
    }

    let len = (switchFlag) ? 125 : 250;
    updateSoundParam(len);
    switchFlag = !switchFlag;
}


function switchToGrid() {
    for (let i = 0; i < wobbNumber; i++) {
        wobblers[i].targetX = wobblers[i].gridX;
        wobblers[i].targetY = wobblers[i].gridY ;
        wobblers[i].targetMaxR = wobblers[i].gridRad;
    }

    let len = (switchFlag) ? 125 : 250;
    updateSoundParam(len);
    switchFlag = !switchFlag;
}


function switchToCircle() {
    for (let i = 0; i < wobbNumber; i++) {
        wobblers[i].targetX = wobblers[i].circleX;
        wobblers[i].targetY = wobblers[i].circleY ;
        wobblers[i].targetMaxR = wobblers[i].circleRad;
    }

    let len = (switchFlag) ? 125 : 250;
    updateSoundParam(len);
    switchFlag = !switchFlag;
}

function mousePressed() {
    userStartAudio();
    playFlag = true;
}

function setup() {
    getAudioContext().suspend();
    createCanvas(800, 800);
    polySynth = new p5.PolySynth();
    triggerRatio = floor(triggerRatio);
    playId = 0;

    // Init randomly the main conf
    wobbNumber = pow(2, floor(random(2, 5)));
    repTime = round(random(2,3));
    groupSize = 4 *(1 + round(random()));
    groupSize = (groupSize < wobbNumber) ? groupSize : wobbNumber;
    groupTime = repTime;
    switchId = round(random(2));

    console.log("Init, wobblers:%d, groupSize:%d, switchId:%d, rep:%d", wobbNumber, groupSize, switchId, repTime);

    // Radial displacement
    for (let i = 0; i < wobbNumber; i++) {
        let maxRad =(width / 2) * (1 -  i / wobbNumber);
        let faces = round(map(i, 0, wobbNumber - 1, 50, 10));
        let magnitude = map(i, 0, wobbNumber - 1, 10, 0.5);
        let timeInc = random(0.01, 0.5);//map(i,  0, wobbNumber - 1, 0.1, 0.01);
        let phaseInc = random(0, 0.01); //map(i,  0, wobbNumber - 1, 0, 0.05);

        wobblers[i] = new Wobbler(width / 2, height / 2, maxRad, faces);
        wobblers[i].setDynamics(phaseInc, timeInc, magnitude);
    }

    setGrid();
    setCircle();
}

function draw() {
    // Get the current frame rate
    let fps = frameRate();

    background(bgColor);

    for (let i = 0; i < wobbNumber; i++) {
        wobblers[i].blob();
        wobblers[i].draw();
    }

    if ((frameCount % triggerRatio == 0)) {
        wobblers[lastPlayed].isPlaying = false;
        wobblers[playId].isPlaying = true;
        if (playFlag) wobblers[playId].play();

        lastPlayed = playId; 
        playId = (playId + 1) % groupSize + groupOffset * groupSize;

        if(playId % groupSize == 0) {
            groupTime--;
            if (groupTime == 0) {
                groupTime = repTime;
                groupOffset = (groupOffset + 1) % (wobbNumber / groupSize);
                playId = groupOffset * groupSize;

                switchId = (switchId + 1) % 3;
                if (switchId == 0) {
                    switchToCenter();
                } else if (switchId == 1) {
                    switchToGrid();
                } else {
                    switchToCircle();
                }

                // invert color
                strokeColor = (strokeColor == 255) ? 0 : 255;
                bgColor = 255 - strokeColor;
            }     
        }    
    }

    // Print the frame rate on the bottom left of the canvas
    fill(255);
    stroke(0);
    text("FPS: " + fps.toFixed(2), 10, height - 10);
}