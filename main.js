

function randRangeInt(minVal, maxVal) {
    return Math.round(fxrand() * (maxVal - minVal) + minVal);
}

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
        this.seed = randRangeInt(0, 100);
        this.polygon = [];

        this.alpha = (palId == 0) ? randRangeInt(100, 255) : 255;
        this.weigth = (palId == 0) ? 1 : 2;
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
            //stroke(strokeColor, 255);
            stroke(colorScheme[palId][stId].r, colorScheme[palId][stId].g, colorScheme[palId][stId].b, 255);
        } else {
            strokeWeight(this.weigth);
            //stroke(strokeColor, this.alpha);
            stroke(colorScheme[palId][stId].r, colorScheme[palId][stId].g, colorScheme[palId][stId].b, this.alpha);
        }

        noFill();
        beginShape();
        for (let i = 0; i < this.polygon.length; i++) {
            let x = this.polygon[i][0];
            let y = this.polygon[i][1];
            vertex(x, y);
        }
        endShape(CLOSE);

        if(this.isPlaying == false) {
            let offset = map(this.maxR, 0.1, width/2, 1, 3);
            strokeWeight(1);
            stroke(255, 0, 255);
            beginShape();
            for (let i = 0; i < this.polygon.length; i++) {
                let x = this.polygon[i][0] + offset;
                let y = this.polygon[i][1];
                vertex(x, y);
            }
            endShape(CLOSE);

            stroke(0, 255, 255);
            beginShape();
            for (let i = 0; i < this.polygon.length; i++) {
                let x = this.polygon[i][0] - offset;
                let y = this.polygon[i][1];
                vertex(x, y);
            }
            endShape(CLOSE);
        }
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

let colorScheme = [
    [{r:0, g:0, b:0}, {r:255, g:255, b:255}],
    [{r:255, g:255, b:0}, {r:255, g:0, b:255}]
]

let palId = 1;
let bgId = 0;
let stId = 1;
let displayString;
let coolFont;

function updateSoundParam(len) {
    soundLen = len;
    dur = soundLen / 1000;
    triggerRatio = soundLen / (1000/fps);
    triggerRatio = floor(triggerRatio);
}

function setCentrinc() {
    let halfWidth =  width / 2;
    let halfHeight =  height / 2;
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
    let wobCount = wobbNumber - 1;
    let circleTime = 1;
    let deltaR = width / (2 * ceil(wobbNumber / 8));

    do {
        let wobMin = min(8, wobCount) + 1;
        let delta = TWO_PI / wobMin;
        let maxRad = width / wobMin;
        let r = deltaR * circleTime - maxRad;

        for (let a = 0; a < TWO_PI; a+=delta) {
            let x = r * cos(a) + width/2;
            let y = r * sin(a) + width/2;

            wobblers[wobCount].circleX = x;
            wobblers[wobCount].circleY = y;
            wobblers[wobCount].circleRad = maxRad;
            wobCount--;
        } 
        circleTime++;
    } while (wobCount > 0);
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


function windowResized() {
    let minSize = min(windowWidth, windowHeight);
    setGrid();
    setCircle();
    setCentrinc();

    resizeCanvas(minSize, minSize);
}


function preload() {
    // load font
    coolFont = loadFont('font/INVASION2000.TTF');
}

function setup() {
    let minSize = min(windowWidth, windowHeight);
    canvas = createCanvas(minSize, minSize);
    
    getAudioContext().suspend();
    polySynth = new p5.PolySynth();
    triggerRatio = floor(triggerRatio);
    playId = 0;
    palId = floor(fxrand()*(colorScheme.length));

    // Init randomly the main conf
    wobbNumber = pow(2, randRangeInt(3, 6));
    repTime = randRangeInt(2,3);
    groupSize = 4 *(1 + round(fxrand()));
    groupSize = (groupSize < wobbNumber) ? groupSize : wobbNumber;
    groupTime = repTime;
    switchId = floor(fxrand()*3);
    switchId = (switchId === 3) ? 2: switchId;

    let code = wobbNumber * 256 + groupSize * 32 + repTime;
    displayString = "0x" + code.toString(16).padStart(4, '0').toUpperCase();

    // Radial displacement
    for (let i = 0; i < wobbNumber; i++) {
        let maxRad =(width / 2) * (1 -  i / wobbNumber);
        let faces = round(map(i, 0, wobbNumber - 1, 50, 10));
        let magnitude = map(i, 0, wobbNumber - 1, 10, 0.5);
        let timeInc = random(0.01, 0.5);
        let phaseInc = random(0, 0.01); 

        wobblers[i] = new Wobbler(width / 2, height / 2, maxRad, faces);
        wobblers[i].setDynamics(phaseInc, timeInc, magnitude);
    }

    setGrid();
    setCircle();
}

function draw() {
    background(colorScheme[palId][bgId].r, colorScheme[palId][bgId].g, colorScheme[palId][bgId].b);

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
                bgId = (bgId == 0) ? 1 : 0;
                stId = 1 - bgId;
            }     
        }    
    }

    // Print the gen code at bottom left of the canvas
    textAlign(RIGHT);
    textStyle(ITALIC);
    textFont(coolFont);
    textSize(width/60);
    stroke(0);
    strokeWeight(0);
    fill(colorScheme[palId][stId].r, colorScheme[palId][stId].g, colorScheme[palId][stId].b);
    text(displayString, width - 10, height - 10);
}