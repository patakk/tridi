let canvas;

let effect;
let blurH;
let blurV;

var fbo;
var drawingFbo;
var effectFbo;
var bhFbo;
var bvFbo;
let song;

var charFbos = {};

var cl1, cl2, cl3, cl4;

let mm;
let WW, HH;
let ratio = Math.sqrt(2);
//ratio = 1;
let margin = 50;
//var resx = map(rand(), 0, 1,  1000, 1400);
//var resy = Math.round(1580*1000/resx);
var resx, resy;
if(rand() < -.5){
    resx = 1100;
    resy = Math.round(1100/ratio);
}
else{
    resx = Math.round(1100/ratio);
    resy = 1100;
}
//resx=resy=1400;
var res = Math.min(resx, resy);
var zoom = .8;
var globalseed = Math.floor(rand()*1000000);

var randomtint = [.1, .1, .1]

var pts = [];

//let plt1 = 0.8;
let plt1 = 0.1;


let skelets = [];
let skeletBlob;
let skeletTentacles= [];
let stargets = [];
let ntargets = 4;

let people = [];

let mx;
let my;
let cursor;
let cursorp;
const NOTROOT = false;

let mainHue;
let mainCol;

function preload() {
    effect = loadShader('assets/shaders/effect.vert', 'assets/shaders/effect.frag');
    blurH = loadShader('assets/shaders/blur.vert', 'assets/shaders/blur.frag');
    blurV = loadShader('assets/shaders/blur.vert', 'assets/shaders/blur.frag');
    inconsolata = loadFont('assets/fonts/couriermb.ttf');
    //inconsolata = loadFont('assets/fonts/helveticaneue/HelveticaNeueBd.ttf');
}

function calculateCanvasDims(){
    var or = innerWidth/innerHeight;
    var cr = resx / resy;
    var cw, ch;

    if(or > cr){
        ch = innerHeight-margin;
        cw = round(ch*cr);
    }
    else{
        cw = innerWidth-margin;
        ch = round(cw/cr);
    }
    return {'w': cw, 'h': ch}
}

function setupCanvas(){
    pixelDensity(2);
    let dims = calculateCanvasDims();

    canvas = createCanvas(dims.w, dims.h, WEBGL);
    canvas.id('maincanvas');
}

function getClosesFromList(p, ps){
    let md = 100000;
    let pt;
    for(let k = 0; k < ps.length; k++){
        let d = dist(p.x, p.y, ps[k].x, ps[k].y);
        if(d < md){
            md = d;
            pt = ps[k];
        }
    }
    return [pt, md];
}


function createTargets(){
    let targets = [];
    for(let k = 0; k < ntargets; k++){
        if(targets.length == 0){
            targets.push(createVector(.8*random(-resx/2, resx/2), .8*random(-resy/2, resy/2)))
            continue;
        }
        let candidates = [];
        for(let c = 0; c < 50; c++){
            candidates.push(createVector(.8*random(-resx/2, resx/2), .8*random(-resy/2, resy/2)))
        }
        let best;
        let mind = -1;
        for(let c = 0; c < candidates.length; c++){
            let cand = candidates[c];
            let dd = getClosesFromList(cand, targets)[1];
            if(dd > mind){
                mind = dd;
                best = cand;
            }
        }
        targets.push(best);
    }
    return targets;
}

function setup(){
    setupCanvas()

    imageMode(CENTER);
    randomSeed(globalseed);
    noiseSeed(globalseed+123.1341);

    print('fxhash:', fxhash);

    curveDetail(44);
    textFont(inconsolata);
    textAlign(CENTER, CENTER);
    imageMode(CENTER);
    rectMode(CENTER);
    colorMode(RGB, 1);

    fbo = new p5Fbo({renderer: canvas, width: resx*2, height: resy*2});
    drawingFbo = new p5Fbo({renderer: canvas, width: resx*2, height: resy*2});
    effectFbo = new p5Fbo({renderer: canvas, width: resx*2, height: resy*2});
    bhFbo = new p5Fbo({renderer: canvas, width: resx*2, height: resy*2});
    bvFbo = new p5Fbo({renderer: canvas, width: resx*2, height: resy*2});

    mainHue = random(1);
    mainCol = getRandomRYB(mainHue);
    skeletBlob = new SkeletBlob();
    stargets = createTargets();

    drawingFbo.begin();
    background(.1);
    drawingFbo.end();

    showall();
    showall();
    // fxpreview();
    // noCursor();
}

function calcMouse(){
    mx = map(mouseX, 0, width, -resx/2, resx/2);
    my = map(mouseY, 0, height, -resy/2, resy/2);
}


function drawTargets(){
    fill(.5);
    for(let k = 0; k < stargets.length; k++){
        let t = stargets[k];
        push();
        noStroke();
        translate(0,0,10);
        rect(t.x, t.y, 10, 2);
        rect(t.x, t.y, 2, 10);
        pop();
    }
}

function drawMouse(){
    noStroke();
    fill(0);
    push();
    translate(0,0,10);
    rect(map(mouseX, 0, width, -resx/2, resx/2), map(mouseY, 0, height, -resy/2, resy/2), 10, 2);
    rect(map(mouseX, 0, width, -resx/2, resx/2), map(mouseY, 0, height, -resy/2, resy/2), 2, 10);
    pop();
}


function draw(){

    if(mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
        calcMouse();


    fbo.begin();
    clear();
    ortho(-resx/2, resx/2, -resy/2, resy/2, 0, 4444);

    let backgroundColor = getRandomRYB(.41);
    backgroundColor = brightencol(backgroundColor, -1.0);
    backgroundColor = saturatecol(backgroundColor, .0);
    background(backgroundColor);
    
    push();
    translate(0,0,-100);
    drawingFbo.draw(0, 0, resx, resy);
    pop();

    drawTargets();
    // drawMouse();
    

    // recording tentacles endings BEFORE applying the physics step
    // (in order to draw everything in between, to avoid gaps)
    skeletBlob.recordEndgins();

    skeletBlob.resetForce();
    skeletBlob.solveForce();
    skeletBlob.solveVelPos();
    skeletBlob.draw();

    fbo.end();

    // draw trail on surface
    skeletBlob.drawPermanent();
    showall();
    //if(frameCount > 33)
    //    noLoop();

}

class Constraint{
    constructor(p1, p2, d, show=true){
        this.seed = random(100000);
        this.p1 = p1;
        this.p2 = p2;
        this.d = d;
        this.cd = d;
        this.show = show;
        this.stiffness = 0.9;
    }

    update(){
        let p1 = this.p1;
        let p2 = this.p2;
        let distance = this.d;
        
        // if(this.isWobbly == true){
        //     this.cd += 10*noise(frameCount*0.01, this.seed);
        // }

        let relativePos = p5.Vector.sub(p2, p1);
        let offsetDir = relativePos.copy();
        offsetDir.normalize();

        let currentDistance = relativePos.mag();
        let offset = distance - currentDistance;

        let relativeVelocity = p5.Vector.sub(p2.vel, p1.vel);

        let velocityImpact = p5.Vector.dot(relativeVelocity, offsetDir);
        let biasFactor = this.stiffness;
        let bias = biasFactor * offset;

        let lambda = -(velocityImpact*0 + bias) / 2.; // 2 je 1+1, masa jednog i drugog

        let impulse1 = offsetDir.copy();
        let impulse2 = offsetDir.copy();
        
        impulse1.mult(lambda/p1.mass);
        impulse2.mult(-lambda/p2.mass);

        if(this.name === 'nula'){
            //print(impulse1.mag())
        }
        
        this.p1.acc.add(impulse1);
        this.p2.acc.add(impulse2);
    }
}



class Skelet {
    constructor(x=0, y=0) {
        this.points = [];
        this.constraints = [];
    }

    resetForce(){
        for(let k = 0; k < this.points.length; k++){
            let po = this.points[k];
            po.acc.mult(0);
        }
    }

    solveForce(){

        let mx = map(mouseX, 0, width, -resx/2, resx/2);
        let my = map(mouseY, 0, height, -resy/2, resy/2);
        let mv = createVector(mx, my);

        let eps = 2;
        let isin = 0;
        if(mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
            isin = 1;
        
        for(let kk = 0; kk < 1; kk++){
            for(let k = 0; k < this.constraints.length; k++){
                this.constraints[k].update();
            }
        }

        // border, mouse, and gravity
        let brd = 20;
        let rv = createVector(1, 0).mult(3);
        let lv = createVector(-1, 0).mult(3);
        let uv = createVector(0, -1).mult(3);
        let dv = createVector(0, 1).mult(3);
        let gravity = createVector(0, 1).mult(.0);

        for(let k = 0; k < this.points.length; k++){
            let po = this.points[k];
            let totalforce = createVector(0, 0);
            let fom = p5.Vector.sub(po, mv);
            fom.normalize();
            let dm = dist(mx, my, po.x, po.y);
            let p = 1;
            if(dm < 900 && dm > 66){
                p = map(dm, 66, 900, 0, 1);
                fom.mult(p*26*po.sspeed*isin);
            }
            else{
                fom.mult(0);
            }

            let borderForce = createVector(0, 0);
            if(po.x > resx/2-brd){
                borderForce.add(lv);
            }
            if(po.x < -resx/2+brd){
                borderForce.add(rv);
            }
            if(po.y > resy/2-brd){
                borderForce.add(uv);
            }
            if(po.y < -resy/2+brd){
                borderForce.add(dv);
            }

            let turbulence = createVector(0, 0);
            turbulence.x = .2*(-.5 + power(noise(po.x*.01+100, po.y*.01+100, 56.123+frameCount*0.004), 2));
            turbulence.y = .2*(-.5 + power(noise(po.x*.01+100, po.y*.01+100, 31.314+frameCount*0.004), 2));

            totalforce.add(gravity);
            totalforce.add(turbulence);

            fom.mult(-1);
            if(po.type == 'head')
                totalforce.add(fom);

            if(po.type == 'active'){
                let outward = p5.Vector.sub(po.troot, this.center).normalize();
                let target = getClosesFromList(po.troot, stargets)[0];
                let totarget = p5.Vector.sub(target, po);
                totarget.normalize();
                let dm = dist(target.x, target.y, po.x, po.y);
                let p = 1;
                if(dm < 500 && dm > 4 && totarget.dot(outward) > 0.4){
                    p = map(dm, 4, 500, 0, 1);
                    totarget.mult(p*6*po.sspeed);
                }
                else{
                    totarget.mult(0);
                }
                totalforce.add(totarget);
            }
        

            po.acc.add(totalforce);

            
            // po.vel.add(po.acc);
            // po.vel.mult(.9);
            // po.add(po.vel);
        }

        
        for(let k = 0; k < this.constraints.length; k++){
            this.constraints[k].d = this.constraints[k].d + .1*(this.constraints[k].cd - this.constraints[k].d);
        }

        for(let it = 0; it < this.tentacleroots.length; it++){
            let tent = this.tentacleroots[it];

            for(let pt = 2; pt < tent.length; pt++){
                let po = tent[pt%tent.length];

                let clo = -1;
                let md = 10000;
                for(let bp = 0; bp < this.blobpoints.length; bp++){
                    let bo = this.blobpoints[bp];
                    let d = p5.Vector.sub(bo, po).mag();
                    if(d < md){
                        md = d;
                        clo = bp;
                    }
                }
                let p1 = this.blobpoints[clo];
                let p1a = this.blobpoints[(clo+1)%this.blobpoints.length];
                let p1b = this.blobpoints[(clo+this.blobpoints.length-1)%this.blobpoints.length];
                let dir = p5.Vector.sub(p1b, p1a).normalize();
                dir.rotate(PI/2);
                if(md < 20)
                    po.acc.add(dir);
            }
            // stroke(0.8, 0, 0);
            // noFill();
            // beginShape();
            // for(let k = 0; k < tent.length; k++){
            //     vertex(tent[k%tent.length].x, tent[k%tent.length].y);
            // }
            // endShape();
            
            // fill(1);
            // noStroke();
            // for(let k = 0; k < tent.length; k++){
            //     rect(tent[k%tent.length].x, tent[k%tent.length].y, 4, 4);
            // }
        }
        // this.points[0].x = mv.x;
        // this.points[0].y = mv.y;
    }

    solveVelPos(){
        for(let k = 0; k < this.points.length; k++){
            let po = this.points[k];
            po.vel.add(po.acc);
            po.vel.mult(.9);
            po.add(po.vel);
        }
    }

}

class SkeletBlob extends Skelet{
    constructor(){
        super();    
        this.N = round(random(5, 44))*0+13;
        this.NN = this.N;
        this.R = random(22, 66);
        this.blobpoints = [];
        this.tentacleroots = [];
        this.roots = [];
        this.generate();    
        this.generateTents();    
        this.center = createVector(0, 0);
    }

    generate(){
        for(let k = 0; k < this.N; k++){
            let ang = map(k, 0, this.N, 0, 2*PI);
            let x = this.R * cos(ang);
            let y = this.R * sin(ang);
            let v = createVector(x, y);
            v.vel = createVector(0, 0);
            v.acc = createVector(0, 0);
            v.mass = 1;
            v.type = 'head';
            v.sspeed = random(1, 3);
            this.points.push(v);
            this.blobpoints.push(v);
        }
        for(let k = 0; k < this.points.length; k++){
            let point = this.points[k];
            let pointp = this.points[(k+1)%this.points.length];
            let d = p5.Vector.sub(pointp, point).mag() * map(power(noise(point.x*0.008+10, point.y*0.008+10, 135.1), 3), 0, 1, .9, 1.1);
            let constraint = new Constraint(point, pointp, d);
            this.constraints.push(constraint);
        }
        
          for(let k = 0; k < this.points.length; k++){
              let point = this.points[k];
              let pointp = this.points[(k+3)%this.points.length];
              let d = p5.Vector.sub(pointp, point).mag();
              let constraint = new Constraint(point, pointp, d);
              constraint.show = false;
              constraint.stiffness = 0.1;
              this.constraints.push(constraint);
          }
        //  for(let k = 0; k < this.points.length; k++){
        //      let point = this.points[k];
        //      let pointp = this.points[(k+4)%this.points.length];
        //      let d = p5.Vector.sub(pointp, point).mag();
        //      let constraint = new Constraint(point, pointp, d);
        //      constraint.show = false;
        //      this.constraints.push(constraint);
        //  }
         for(let k = 0; k < this.points.length; k++){
             let point = this.points[k];
             let pointp = this.points[(k+9)%this.points.length];
             let d = p5.Vector.sub(pointp, point).mag();
             let constraint = new Constraint(point, pointp, d);
             constraint.show = false;
             constraint.stiffness = 0.1;
             this.constraints.push(constraint);
         }
    }

    generateTents(){
        for(let it = 0; it < this.NN; it++){
            let ri = floor(random(this.blobpoints.length));
            let po = this.blobpoints[ri].copy();
            let dir = po.copy().normalize().mult(25);
            let pv = po;
            let v;
            let tete = [];
            let le = round(random(2, 8)*1.);
            if(it == 0)
                le = 16;
            let oo = round(random(1, le/2));
            oo = floor(random(1, 2));
            oo = 1;
            for(let k = 0; k < le; k++){
                if(k == 0)
                    v = this.blobpoints[ri];
                else
                    v = po.copy();
                v.vel = createVector(0, 0);
                v.acc = createVector(0, 0);
                v.mass = 1;
                if(k == le-oo){
                    v.type = 'active';
                    v.troot = this.blobpoints[ri];
                }
                v.sspeed = random(1, 3);
                    
                tete.push(v);
                if(k > 0){
                    this.points.push(v);
                    let point = pv;
                    let pointp = v;
                    let d = p5.Vector.sub(pointp, point).mag();
                    let constraint = new Constraint(point, pointp, d);
                    constraint.stiffness = random(.2, .9);
                    this.constraints.push(constraint);
                }
    
                pv = v;
                po.add(dir);
            }
            this.tentacleroots.push(tete);
            this.roots.push(ri);
        }
    }

    draw(){
        var knots = makeknots(this.blobpoints, 1, true);
        var hobbypts = gethobbypoints(knots, true, 10);
        stroke(1-1.0);
        noFill();
        // noStroke();
        // fill(1-1.0);
        fill(.8, .79, .76);
        fill(0);
        fill(1-0.58);
        fill(getRandomRYB(.02));
        stroke(getRandomRYB(.2));
        noStroke();
        // drawhobby(knots, 1);

        // stroke(0.8);
        // noFill();
        fill(getRandomRYB(.2));
        let leColor = getRandomRYB(mainHue + 1*.21);
        leColor = saturatecol(leColor, 1*-.5);
        leColor = brightencol(leColor, 1*.5);
        fill(leColor);
        
        // the BLOB
        push();
        translate(0,0,-11);
        beginShape();
        strokeWeight(.5+1*power(noise(frameCount*0.01,93.31), 3));
        this.center.set(0, 0);
        for(let k = 0; k < this.blobpoints.length; k++){
            let amp = 1;
            let nzx = amp*0*25*(-.5 + power(noise(132.41, k, frameCount*0.1), 2));
            let nzy = amp*0*25*(-.5 + power(noise(132.41, k+1134.31, frameCount*0.1), 2));
            let x = this.blobpoints[k%this.blobpoints.length].x+nzx;
            let y = this.blobpoints[k%this.blobpoints.length].y+nzy;
            vertex(x, y);
            // if(random(100) < 1) rect(this.blobpoints[k%this.blobpoints.length].x+nzx, this.blobpoints[k%this.blobpoints.length].y+nzy, 2*random(1,2), 2*random(1,2));
            this.center.add(this.blobpoints[k%this.blobpoints.length]);
        }
        this.center.div(this.blobpoints.length);
        endShape(CLOSE);
        pop();
        
        // BLOB border        
        // push();
        // translate(0,0,-11);
        // beginShape();
        // strokeWeight(.5+1*power(noise(frameCount*0.01,55.22), 3));
        // for(let k = 0; k < this.blobpoints.length; k++){
        //     let amp = 1;
        //     let nzx = amp*25*(-.5 + power(noise(55.41, k, frameCount*0.1), 2));
        //     let nzy = amp*25*(-.5 + power(noise(55.41, k+3134.31, frameCount*0.1), 2));
        //     vertex(this.blobpoints[k%this.blobpoints.length].x+nzx, this.blobpoints[k%this.blobpoints.length].y+nzy);
        //     if(random(100) < 1) rect(this.blobpoints[k%this.blobpoints.length].x+nzx, this.blobpoints[k%this.blobpoints.length].y+nzy, 2*random(1,2), 2*random(1,2));
        // }
        // stroke(123/255, 1/255, 15/255);
        // stroke(getRandomRYB(.9*power(noise(491.331, frameCount*0.1), 3)));
        // stroke(.8, .5, .5);
        // noFill();
        // endShape(CLOSE);
        // pop();
        // push();
        // translate(0,0,-11);
        // beginShape();
        // strokeWeight(.5+1*power(noise(frameCount*0.01,24.87), 3));
        // for(let k = 0; k < this.blobpoints.length; k++){
        //     let amp = 1;
        //     let nzx = amp*25*(-.5 + power(noise(121.41, k, frameCount*0.1), 2));
        //     let nzy = amp*25*(-.5 + power(noise(121.41, k+3134.31, frameCount*0.1), 2));
        //     vertex(this.blobpoints[k%this.blobpoints.length].x+nzx, this.blobpoints[k%this.blobpoints.length].y+nzy);
        //     if(random(100) < 1) rect(this.blobpoints[k%this.blobpoints.length].x+nzx, this.blobpoints[k%this.blobpoints.length].y+nzy, 2*random(1,2), 2*random(1,2));
        // }
        // stroke(0.24, 0.44, 0.44);
        // stroke(getRandomRYB(.9*power(noise(91.66, frameCount*0.1), 3)));
        // stroke(.8, .5, .5);
        // noFill();
        // endShape(CLOSE);
        // pop();
        
        strokeWeight(.5+1*power(noise(frameCount*0.01,24.87), 3));
        for(let it = 0; it < this.tentacleroots.length; it++){
            push();
            translate(0, it*.1);
            let tent = this.tentacleroots[it];
            
            stroke(1-1.0);
            noFill();
            //  var knots = makeknots(tent, 1, false);
            //  var hobbypts = gethobbypoints(knots, false, 10);
            //  drawhobby(knots, 0);
            // stroke(0.8, 0, 0);
            // noFill();

            // tentacle thin line
            // push();
            // translate(0,0,-1);
            // stroke(0.58, 0.24, 0.24);
            // let col = getRandomRYB(noise(it)*10.);
            // col = getRandomRYB(0);
            // col = saturatecol(col, -.7);
            // col = brightencol(col, -.7);
            // stroke(col);
            // stroke(mainCol);
            // noFill();
            // beginShape();
            // for(let k = 0; k < tent.length; k++){
            //     let amp = map(k, 0, tent.length-1, 0, 1);
            //     amp = power(1 - abs(amp-.5)*2, 2);
            //     let nzx = amp*30*(-.5 + power(noise(it, k, frameCount*0.1), 2));
            //     let nzy = amp*30*(-.5 + power(noise(it, k+3134.31, frameCount*0.1), 2));
            //     if(k == 0)
            //         vertex(tent[k%tent.length].x+nzx, tent[k%tent.length].y+nzy);
            //     vertex(tent[k%tent.length].x+nzx, tent[k%tent.length].y+nzy);
            //     if(k == tent.length-1)
            //         vertex(tent[k%tent.length].x+nzx, tent[k%tent.length].y+nzy);
            // }
            // endShape();
            // pop();

            // tentacle body
            noStroke();
            fill(0);
            fill(.8);
            // tentacle tip
            rect(tent[tent.length-1].x, tent[tent.length-1].y, 4, 4);
            let left = skeletBlob.blobpoints[(this.roots[it]-1+skeletBlob.blobpoints.length)%skeletBlob.blobpoints.length];
            let right = skeletBlob.blobpoints[(this.roots[it]+1)%skeletBlob.blobpoints.length];
            fill(0);
            fill(mainCol);
            noStroke();
            noFill();
            stroke(mainCol);
            strokeWeight(4);
            beginShape(TRIANGLE_STRIP);
            // vertex(left.x, left.y);
            // vertex(left.x, left.y);
            let th = 4 + 4*power(noise(it, 5412.21), 3);
            let punctured = p5.Vector.sub(tent[0], tent[1]).normalize();
            punctured.mult(10);
            punctured.add(tent[0]);
            for(let k = -1; k < tent.length-1; k++){
                let p = map(k, 0, tent.length-1, 1, 0);
                p = constrain(p, 0, 1);
                let t1;
                if(k>=0)
                    t1 = tent[k];
                else
                    t1 = punctured;
                let t2 = tent[k+1];
                let ve = p5.Vector.sub(t2, t1);
                let ven = ve.copy().normalize();
                let nz = map(power(noise(it, k, 55.27), 3), 0, 1, .5, 2.0);

                let leColor = getRandomRYB(mainHue + p*.21);
                leColor = saturatecol(leColor, p*-.5);
                leColor = brightencol(leColor, p*.5);

                if(p > .8){
                    p = .8 - (p-.8);
                }
                ven.rotate(-PI/2);
                ven.mult(p * th * nz);
                ven.add(t1);
                // fill(leColor);
                vertex(ven.x, ven.y);
                ven = ve.copy().normalize();
                ven.rotate(+PI/2);
                ven.mult(p * th * nz);
                ven.add(t1);
                vertex(ven.x, ven.y);
            }
            vertex(tent[tent.length-1].x, tent[tent.length-1].y);
            // for(let k = tent.length-2; k >= 0; k--){
            //     let p = map(k, 0, tent.length-1, 1, 0);
            //     let t1 = tent[k];
            //     let t2 = tent[k+1];
            //     let ve = p5.Vector.sub(t2, t1);
            //     let ven = ve.copy().normalize();
            //     let nz = map(power(noise(it, k, 81.31), 3), 0, 1, .5, 2.0);
            //     ven.rotate(+PI/2);
            //     ven.mult(p * th *nz);
            //     ven.add(t1);
            //     fill(p);
            //     vertex(ven.x, ven.y);
            // }
            // vertex(right.x, right.y);
            // vertex(right.x, right.y);
            endShape();
            pop();

        }
    }

    recordEndgins(){
        this.tentrail = [];
        for(let it = 0; it < skeletBlob.tentacleroots.length; it++){
            let tent = skeletBlob.tentacleroots[it];
            this.tentrail.push(tent[tent.length-1].copy());
        }
    }

    
    drawPermanent(){
        drawingFbo.begin();
        ortho(-resx/2, resx/2, -resy/2, resy/2, 0, 4444);
        fill(.45);
        noStroke();
        for(let it = 0; it < skeletBlob.tentacleroots.length; it++){

            let hueDivergence = .6;
            if(noise(it, 9999.31) < .625){
                hueDivergence = .2;
            }
            else{
                hueDivergence = 1.;
            }

            let col = getRandomRYB(noise(it)*10.);
            col = saturatecol(col, -.7);
            col = brightencol(col, -.7);
            fill(col);
            fill(.1);
            col = getRandomRYB(0.3 + 1.5*noise(it, frameCount*0.03));
            col = getRandomRYB(mainHue + hueDivergence*(-.5 + power(noise(it, frameCount*0.01), 2)));
            col = saturatecol(col, 1*(-.5 + power(noise(it, frameCount*0.03, 1112.), 2)));
            col = brightencol(col, .2+.1*sin(frameCount*.01 + 1000*noise(it)));
            fill(col);
            let tent = skeletBlob.tentacleroots[it];
            let dir = p5.Vector.sub(tent[tent.length-1], this.tentrail[it]);
            let le = dir.mag();
            let lim = max(1, le*1);
            for(let k = 0; k < lim; k++){
                let p = map(k, 0, lim, 0, 1);
                let x = lerp(this.tentrail[it].x, tent[tent.length-1].x, p);
                let y = lerp(this.tentrail[it].y, tent[tent.length-1].y, p);
                push();
                translate(0,0,it+frameCount*.04)
                fill(col);
                rect(x, y, 33*power(noise(it,99.31), 3), 33*power(noise(it,99.31), 3));
                let fl = .05 + .1*(-.5 + power(noise(it, frameCount*0.01, 22.66), 3));
                fill(fl+.7, .25, .25);
                let sz = 1.5 + 1.5*(-.5 + power(noise(it, frameCount*0.01, 831.41), 3));
                fill(0, .4*power(noise(it, frameCount*0.1, 22.341), 3));
                translate(0,0,it+frameCount*.04+1)
                rect(x, y, sz*0+1, sz*0+1);
                pop();
            }
        }
        drawingFbo.end();
    }
}

class SkeletGrid extends Skelet{
    constructor(){
        super();    
        this.generate();    
    }

    generate(){
        this.nx = 6;
        this.ny = 6;
        for(let j = 0; j < this.ny; j++){
            for(let i = 0; i < this.nx; i++){
                let x = map(i, 0, this.nx-1, -200*ratio, 200*ratio);
                let y = map(j, 0, this.ny-1, -200, 200);
                let v = createVector(x, y);
                v.vel = createVector(0, 0);
                v.acc = createVector(0, 0);
                v.mass = 100;
                this.points.push(v);
            }
        }
        for(let j = 0; j < this.ny; j++){
            for(let i = 0; i < this.nx; i++){
                let idx = j*this.nx + i;
                let point = this.points[idx];
                if(i < this.nx-1){
                    let idxp = j*this.nx + (i+1);
                    let pointp = this.points[idxp];
                    let d = p5.Vector.sub(pointp, point).mag();
                    this.constraints.push(new Constraint(point, pointp, d));
                }
                if(j < this.ny-1){
                    let idxp = (j+1)*this.nx + i;
                    let pointp = this.points[idxp];
                    let d = p5.Vector.sub(pointp, point).mag();
                    this.constraints.push(new Constraint(point, pointp, d));
                }
                if(i < this.nx-1 && j < this.ny-1){
                    let idxp = (j+1)*this.nx + (i+1);
                    let pointp = this.points[idxp];
                    let d = p5.Vector.sub(pointp, point).mag();
                    this.constraints.push(new Constraint(point, pointp, d));
                }
                if(i > 0 && j < this.ny-1){
                    let idxp = (j+1)*this.nx + (i-1);
                    let pointp = this.points[idxp];
                    let d = p5.Vector.sub(pointp, point).mag();
                    this.constraints.push(new Constraint(point, pointp, d));
                }
            }
        }
        this.constraints[0].name = 'nula';
    }
}

function showall(){
    background(1);
    //pg.push();
    //pg.scale(0.8);
    //pg.pop();
    //pg.line(0,0,mouseX-width/2,mouseY-height/2);

    var an = rand()*PI;
    var dir = [cos(an), sin(an)]
    blurH.setUniform('tex0', fbo.getTexture());
    //blurH.setUniform('tex1', mask);
    blurH.setUniform('texelSize', [1.0/resx, 1.0/resy]);
    blurH.setUniform('direction', [dir[0], [1]]);
    blurH.setUniform('u_time', frameCount*0+globalseed*.01);
    blurH.setUniform('amp', .25);
    blurH.setUniform('seed', (globalseed*.12134)%33.+random(.1,11));
    //blurpass1.shader(blurH);
    //blurpass1.quad(-1,-1,1,-1,1,1,-1,1);
    bhFbo.begin();
    clear();
    shader(blurH);
    quad(-1,-1,1,-1,1,1,-1,1);
    bhFbo.end();
    
    blurV.setUniform('tex0', bhFbo.getTexture());
    //blurV.setUniform('tex1', mask);
    blurV.setUniform('texelSize', [1.0/resx, 1.0/resy]);
    blurV.setUniform('direction', [-dir[1], [0]]);
    blurV.setUniform('u_time', frameCount*0+globalseed*.01);
    blurV.setUniform('amp', .25);
    blurV.setUniform('seed', (globalseed*.12134)%33.+random(.1,11));
    //blurpass2.shader(blurV);
    //blurpass2.quad(-1,-1,1,-1,1,1,-1,1);
    bvFbo.begin();
    clear();
    shader(blurV);
    quad(-1,-1,1,-1,1,1,-1,1);
    bvFbo.end();

    effect.setUniform('tex0', fbo.getTexture());
    effect.setUniform('tex1', bvFbo.getTexture());
    //effect.setUniform('tex2', blurpass2);
    //effect.setUniform('tex3', bgpg);
    effect.setUniform('u_usemask', 0.);
    effect.setUniform('u_resolution', [resx, resy]);
    effect.setUniform('u_mouse',[dir[0], [1]]);
    effect.setUniform('u_time', frameCount);
    effect.setUniform('incolor', randomtint);
    effect.setUniform('seed', globalseed+random(.1,11));
    effect.setUniform('noiseamp', mouseX/width*0+1);
    effect.setUniform('hasmargin', 1);
    //effect.setUniform('tintColor', HSVtoRGB(rand(), 0.2, 0.95));
    var hue1 = rand();
   //effect.setUniform('tintColor', HSVtoRGB(rand(),.3,.9));
    //effect.setUniform('tintColor2', HSVtoRGB((hue1+.45+rand()*.1)%1,.3,.9));
    effect.setUniform('tintColor', [0.,0.,1.]);
    effect.setUniform('tintColor2', [0.,0.,1.]);

    effectFbo.begin();
    clear();
    shader(effect);
    quad(-1,-1,1,-1,1,1,-1,1);
    effectFbo.end();
    //effectpass.shader(effect);
    //effectpass.quad(-1,-1,1,-1,1,1,-1,1);
  
    // draw the second pass to the screen
    //image(effectpass, 0, 0, mm-18, mm-18);
    var xx = 0;
    //image(pg, 0, 0, mm*resx/resy-xx, mm-xx);
    effectFbo.draw(0, 0, width, height);

    // drawingFbo.draw(0, 0, width, height);
    // fbo.draw(0, 0, width, height);
}

function windowResized() {
    let dims = calculateCanvasDims();
    resizeCanvas(dims.w, dims.h, true);
    
    showall();
}



function max(a, b){
    if(a >= b)
        return a;
    return b;
}

function min(a, b){
    if(a <= b)
        return a;
    return b;
}




 function mouseClicked(){
    drawingFbo.begin();
    clear();
    drawingFbo.end();
 }

function keyPressed(){
    if(key == 's'){
        var data = effectFbo.readToPixels();
        var img = createImage(effectFbo.width, effectFbo.height);
        for (i = 0; i < effectFbo.width; i++){
          for (j = 0; j < effectFbo.height; j++){
            var pos = (j * effectFbo.width*4) + i * 4;
            img.set(i,effectFbo.height-1-j, [data[pos], data[pos+1], data[pos+2],255]);
          }
        }
        img.updatePixels();
        img.save('output_' + fxhash, 'png');
    }
}

function rnoise(s, v1, v2){
    return v1 + (v2-v1)*((power(noise(s), 3)*1)%1.0);
}


function power(p, g) {
    if (p < 0.5)
        return 0.5 * Math.pow(2*p, g);
    else
        return 1 - 0.5 * Math.pow(2*(1 - p), g);
}


class Person {
    constructor(x=0, y=0) {
        this.seed = random(1);
        let scale = random(.2,.3);
        //scale = .21;
        this.scale = scale;
        this.fattness = random(.5, .66);
        //this.fattness = 1
        this.root = new Bone('root', x, y-150*scale, null, true);

        this.spine0 = new Bone('spine0', x, y-120*scale, this.root, NOTROOT);
        this.spine1 = new Bone('spine1', x, y-90*scale, this.spine0, NOTROOT);
        this.spine2 = new Bone('spine2', x, y-30*scale, this.spine1, NOTROOT);
        
        this.neck = new Bone('neck', x, y-188*scale, this.root, NOTROOT);
        
        this.kneel = new Bone('kneel', x-40*scale, y+20*scale, this.spine2, NOTROOT, createVector(-30*scale, -5*scale));
        this.kneer = new Bone('kneer', x+40*scale, y+20*scale, this.spine2, NOTROOT, createVector(30*scale, -5*scale));
        this.anklel = new Bone('anklel', x-30*scale, y+70*scale, this.kneel, NOTROOT);
        this.ankler = new Bone('ankler', x+30*scale, y+70*scale, this.kneer, NOTROOT);

        this.spine1.maxangle = radians(12);
        this.spine1.minangle = radians(-12);

        this.elbowl = new Bone('elbowl', x-40*scale, y-110*scale, this.root, NOTROOT, createVector(-30*scale, 10*scale));
        this.wristl = new Bone('wristl', x-75*scale, y-120*scale, this.elbowl, NOTROOT);
        this.fingertipsl = new Bone('fingertipsl', x-110*scale, y-100*scale, this.wristl, NOTROOT);

        this.elbowr = new Bone('elbowr', x+40*scale, y-110*scale, this.root, NOTROOT, createVector(30*scale, 10*scale));
        this.wristr = new Bone('wristr', x+75*scale, y-120*scale, this.elbowr, NOTROOT);
        this.fingertipsr = new Bone('fingertipsr', x+110*scale, y-100*scale, this.wristr, NOTROOT);

        //  this.fingertipsl.setTarget(skelet.points[0]);
        //  this.fingertipsl.iksteps = 3;
        //this.fingertipsr.setTarget(createVector(random(-resx*.47, resx*.47), random(-resy*.47, resy*.47)));
        //this.fingertipsr.setTarget(createVector(this.fingertipsl.ctarget.x, this.fingertipsl.ctarget.y));
        //this.fingertipsr.iksteps = 3;
        
        // this.neck.setTarget(createVector(this.fingertipsl.ctarget.x, this.fingertipsl.ctarget.y));
        // this.neck.iksteps = 1;

        this.bones = [];
        this.bones.push(
            this.spine0,
            this.spine1,
            this.spine2,
            this.neck,
            this.kneel,
            this.anklel,
            this.kneer,
            this.ankler,
            this.elbowl,
            this.wristl,
            this.fingertipsl,
            this.elbowr,
            this.wristr,
            this.fingertipsr,
        )
    }

    drawDebug(){
        for(let k = 0; k < this.bones.length; k++){
            this.bones[k].drawDebug(this.seed, this.scale, this.fattness);
        }
    }

    drawLineart(){
        noFill();
        stroke(1.-plt1);
        strokeWeight(2);

        let v1 = p5.Vector.sub(this.wristl.pos, this.elbowl.pos).normalize().mult(this.fattness*3.);
        let wristlup = p5.Vector.add(this.wristl.pos, v1);
        let wristldn = p5.Vector.add(this.wristl.pos, v1);
        v1.rotate(PI/2);
        wristlup.add(v1);
        v1.rotate(PI);
        wristldn.add(v1);
        
        let v2 = p5.Vector.sub(this.elbowl.pos, this.spine0.pos).normalize().mult(this.fattness*3.);
        let elbowlup = this.elbowl.pos.copy();
        let elbowldn = this.elbowl.pos.copy();
        v2.rotate(PI/2);
        elbowlup.add(v2);
        v2.rotate(PI);
        elbowldn.add(v2);
        
        let v3 = p5.Vector.sub(this.wristr.pos, this.elbowr.pos).normalize().mult(this.fattness*3.);
        let wristrup = p5.Vector.add(this.wristr.pos, v3);
        let wristrdn = p5.Vector.add(this.wristr.pos, v3);
        v3.rotate(-PI/2);
        wristrup.add(v3);
        v3.rotate(PI);
        wristrdn.add(v3);
        
        let v4 = p5.Vector.sub(this.elbowr.pos, this.spine0.pos).normalize().mult(this.fattness*3.);
        let elbowrup = this.elbowr.pos.copy();
        let elbowrdn = this.elbowr.pos.copy();
        v4.rotate(-PI/2);
        elbowrup.add(v4);
        v4.rotate(PI);
        elbowrdn.add(v4);

        let v5 = p5.Vector.sub(this.neck.pos, this.spine0.pos).normalize().mult(this.fattness*3.);
        let neckup = p5.Vector.add(this.spine0.pos, v5);
        neckup.add(v5);

        // noStroke();
        // fill(0,1,0);
        // ellipse(wristlup.x, wristlup.y, 2, 2);
        // ellipse(elbowlup.x, elbowlup.y, 2, 2);
        // ellipse(wristrup.x, wristrup.y, 2, 2);
        // ellipse(elbowrup.x, elbowrup.y, 2, 2);

        noFill();
        fill(plt1*2);
        stroke(plt1*5);
        beginShape();
        vertex(this.kneer.pos.x, this.kneer.pos.y,12);
        vertex(this.anklel.pos.x, this.anklel.pos.y,1);
        vertex(this.kneel.pos.x, this.kneel.pos.y,2);
        vertex(elbowldn.x, elbowldn.y,3);
        // vertex(wristldn.x, wristldn.y,1);
        vertex(this.fingertipsl.pos.x, this.fingertipsl.pos.y,4);
        // vertex(wristlup.x, wristlup.y,5);
        vertex(elbowlup.x, elbowlup.y,6);
        vertex(this.spine0.pos.x, this.spine0.pos.y,7);
        vertex(elbowrup.x, elbowrup.y,8);
        // vertex(wristrup.x, wristrup.y,9);
        vertex(this.fingertipsr.pos.x, this.fingertipsr.pos.y,10);
        // vertex(wristrdn.x, wristrdn.y,1);
        vertex(elbowrdn.x, elbowrdn.y,11);
        vertex(this.kneer.pos.x, this.kneer.pos.y,12);
        vertex(this.ankler.pos.x, this.ankler.pos.y,13);
        vertex(this.kneel.pos.x, this.kneel.pos.y,12);
        endShape();

        push();
        translate(0,0,10);
        rect(this.spine0.pos.x, this.spine0.pos.y, 7, 10);
        pop();
    }
    
    solve(){
        
        //this.fingertipsr.setTarget(createVector(this.wristr.pos.x+30, this.wristr.pos.y));
        //this.fingertipsr.iksteps = 1;

        //this.spine0.setTarget(cursor);
        //this.spine0.iksteps = 2;

        this.neck.setTarget(createVector(this.root.pos.x, this.root.pos.y-150));
        this.neck.iksteps = 1;

        for(let it = 0; it < 6; it++){

            // !!!!!!!!!!!!!!!
            let ve;
            ve = p5.Vector.sub(this.spine1.pos, this.root.pos);
            if(ve.mag() < this.scale*40){
                ve.normalize().mult(this.scale*40);
                this.spine1.setTarget(p5.Vector.add(this.root.pos, ve));
                this.spine1.iksteps = 2;
            }
            else{
                this.spine1.target = null;
            }
            ve = p5.Vector.sub(this.spine2.pos, this.root.pos);
            if(ve.mag() < this.scale*85){
                ve.normalize().mult(this.scale*85);
                this.spine2.setTarget(p5.Vector.add(this.root.pos, ve));
                this.spine2.iksteps = 3;
            }
            else{
                this.spine2.target = null;
            }
            ve = p5.Vector.sub(this.ankler.pos, this.root.pos);
            if(ve.mag() < this.scale*140){
                ve.normalize().mult(this.scale*140);
                this.ankler.setTarget(p5.Vector.add(this.root.pos, ve));
                this.ankler.iksteps = 2;
            }
            else{
                this.ankler.target = null;
            }
            ve = p5.Vector.sub(this.anklel.pos, this.root.pos);
            if(ve.mag() < this.scale*140){
                ve.normalize().mult(this.scale*140);
                this.anklel.setTarget(p5.Vector.add(this.root.pos, ve));
                this.anklel.iksteps = 2;
            }
            else{
                this.anklel.target = null;
            }

            for(let k = 0; k < this.bones.length; k++){
                let bone = this.bones[k];
                if(bone.offset.mag() === 0.0)
                    continue;
                if(bone.name != 'kneel' && bone.name != 'kneer' && bone.name != 'elbowl' && bone.name != 'elbowr')
                    continue;
                // continue;
                let p = bone.parent.pos;
                let pp, angle;
                if(bone.name == 'elbowl' || bone.name == 'elbowr'){
                    angle = p5.Vector.sub(this.spine0.pos, this.spine1.pos).heading();
                    bone.offset = p5.Vector.rotate(bone.offset0, angle-bone.parent.nominalangle);
                }
                else{
                    pp = bone.parent.parent.pos;
                    angle = p5.Vector.sub(p, pp).heading();
                    bone.offset = p5.Vector.rotate(bone.offset0, angle-bone.parent.nominalangle);
                }
            }

            for(let k = 0; k < this.bones.length; k++){
                if(this.bones[k].target != null){
                    let dd = dist(this.bones[k].ctarget.x, this.bones[k].ctarget.y, this.root.pos.x, this.root.pos.y);
                    if(dd < 600 && (this.bones[k].name === 'fingertipsl' || this.bones[k].name === 'fingertipsr')){
                        if(!this.bones[k].entered){
                            this.bones[k].entered = true;
                            this.bones[k].enterdpos = this.bones[k].pos.copy();
                        }
                        let pp = constrain(map(dd, 600, 200, 0, 1), 0, 1);
                        let amp = max(pp, this.bones[k].currentAmp);
                        this.bones[k].currentAmp = amp;
                        this.bones[k].target.x = lerp(this.bones[k].enterdpos.x, this.bones[k].ctarget.x, amp);
                        this.bones[k].target.y = lerp(this.bones[k].enterdpos.y, this.bones[k].ctarget.y, amp);
                        this.bones[k].solve();
                    }
                    else{
                        this.bones[k].entered = false;
                        this.bones[k].currentAmp = 0;
                    }
                    //this.bones[k].target = this.bones[k].ctarget.copy();
                    if(this.bones[k].name != 'fingertipsl' && this.bones[k].name != 'fingertipsr')
                        this.bones[k].solve();
                }
                //this.bones[k].solveRotationConstraints();
            }
        }
        this.root.solveChildren();
        //this.root.pos.x = 100*cos(frameCount*0.03);
        //this.root.pos.y = 100*sin(frameCount*0.03);
    }

}

class Bone {
    constructor(name, x, y, parent=null, isRoot=false, offset=createVector(0,0)){
        this.pos = createVector(x, y);
        this.offset = offset;
        this.offset0 = offset.copy();
        this.entered = false;
        this.currentAmp = 0;
        this.seed = random(1);
        this.name = name;
        this.parent = parent;
        this.isRoot = isRoot;
        this.maxangle = 10000;
        this.minangle = -10000;
        this.iksteps = 0;
        this.children = [];
        if(!this.isRoot){
            if(this.parent.isRoot){
                this.nominalangle = p5.Vector.sub(this.pos, this.parent.pos).heading();
            }
            else{
                this.nominalangle = p5.Vector.sub(p5.Vector.add(this.parent.pos, this.offset), p5.Vector.add(this.parent.parent.pos, this.offset)).angleBetween(p5.Vector.sub(this.pos, p5.Vector.add(this.parent.pos, this.offset)));
                // kod move to child ovo testiram
                this.nominalangle = p5.Vector.sub(this.pos, this.parent.pos).heading();
            }
            if(this.parent.children === undefined){
                this.parent.children = [this];
            }
            else{
                this.parent.children.push(this);
            }
            this.nominal = dist(this.pos.x, this.pos.y, this.parent.pos.x+this.offset.x, this.parent.pos.y+this.offset.y);
        }
        else{
            this.nominalangle = -PI/2;
        }
        this.target = null;
    }

    setTarget(target){
        this.target = target;
        this.ctarget = target.copy();
        // this.reached = this.parent.parent;
    }

    getCurrentAngle(){
        
        let currentNode = this;
        let currentAngle = 0;
        if(currentNode.parent.isRoot){
            currentAngle = p5.Vector.sub(currentNode.pos, p5.Vector.add(currentNode.parent.pos, currentNode.offset)).heading();
        }
        else{
            currentAngle = p5.Vector.sub(
                    p5.Vector.add(currentNode.parent.pos, currentNode.offset),
                    p5.Vector.add(currentNode.parent.parent.pos, currentNode.offset)
                ).angleBetween(
                    p5.Vector.sub(
                        currentNode.pos,
                        p5.Vector.add(currentNode.parent.pos, currentNode.offset)
                    )
                );
            currentAngle = p5.Vector.sub(p5.Vector.add(currentNode.parent.pos, currentNode.offset), p5.Vector.add(currentNode.parent.parent.pos, currentNode.offset)).angleBetween(p5.Vector.sub(currentNode.pos, p5.Vector.add(currentNode.parent.pos, currentNode.offset)));
            // kod move to child ovo testiram
        }
        return currentAngle;
    }

    solveRotationConstraints(){
        let currentNode = this;

        let currentAngle = 0;
        if(currentNode.parent.isRoot){
            currentAngle = p5.Vector.sub(currentNode.pos, p5.Vector.add(currentNode.parent.pos, currentNode.offset)).heading();
        }
        else{
            currentAngle = p5.Vector.sub(
                    p5.Vector.add(currentNode.parent.pos, currentNode.offset),
                    p5.Vector.add(currentNode.parent.parent.pos, currentNode.offset)
                ).angleBetween(
                    p5.Vector.sub(
                        currentNode.pos,
                        p5.Vector.add(currentNode.parent.pos, currentNode.offset)
                    )
                );
            currentAngle = p5.Vector.sub(p5.Vector.add(currentNode.parent.pos, currentNode.offset), p5.Vector.add(currentNode.parent.parent.pos, currentNode.offset)).angleBetween(p5.Vector.sub(currentNode.pos, p5.Vector.add(currentNode.parent.pos, currentNode.offset)));
            // kod move to child ovo testiram
        }
        if(currentNode.name == 'spine1'){
            let v1 = p5.Vector.sub(currentNode.parent.pos, currentNode.parent.parent.pos);
            let v2 = p5.Vector.sub(currentNode.pos, currentNode.parent.pos);
        }
        if(currentAngle-currentNode.nominalangle > currentNode.maxangle){
            let fromParent1 = p5.Vector.sub(currentNode.pos, p5.Vector.add(currentNode.parent.pos, currentNode.offset));
            let fromParent2 = fromParent1.copy();
            fromParent2.rotate((currentAngle-currentNode.nominalangle) - currentNode.maxangle);
            fromParent2.normalize();
            fromParent2.mult(currentNode.nominal);
            //currentNode.pos = p5.Vector.add(p5.Vector.add(currentNode.parent.pos, currentNode.offset), fromParent2);
        }
    }

    solve(){
        if(this.target != null){
            this.pos.x = this.target.x;
            this.pos.y = this.target.y;
            let currentNode = this.parent;
            let realizedsteps = 0;
            for(let k = 0; k < this.iksteps-1; k++){
                //if(currentNode.isRoot)
                //    break;
                if(currentNode != null){
                    for(let c = 0; c < currentNode.children.length; c++){
                        let child = currentNode.children[c];
                        let toChild = p5.Vector.sub(child.pos, currentNode.pos);
                        let ddis = toChild.mag() - child.nominal;
                        if(currentNode.name=='spine1'){
                            //print(currentNode.getCurrentAngle())
                        }
                        if(abs(ddis) > 0.01){
                            toChild.normalize().mult(ddis);
                            currentNode.pos.add(toChild);
                        }
                        
                    }
                    if(currentNode.parent != null) currentNode = currentNode.parent;
                    else break;
                }
                realizedsteps++;
            }
            currentNode = this;
            while(realizedsteps-- > -1){
                currentNode = currentNode.parent;
            }
            //currentNode.solveChildren();
            // for(let c = 0; c < currentNode.children.length; c++){
            //     currentNode = currentNode.children[c];
            //     while(true){
            //         let toParent = p5.Vector.sub(currentNode.parent.pos, currentNode.pos);
            //         let ddis = toParent.mag() - currentNode.nominal;
            //         if(abs(ddis) > 0.01){
            //             toParent.normalize().mult(ddis);
            //             currentNode.pos.add(toParent);
            //         }
            //         if(currentNode.child != null) currentNode = currentNode.child;
            //         else break;
            //     }
            // }
        }
    }

    solveChildren(){
        for(let c = 0; c < this.children.length; c++){
            let child = this.children[c];
            let toParent = p5.Vector.sub(p5.Vector.add(child.parent.pos, child.offset), child.pos);
            let ddis = toParent.mag() - child.nominal;
            if(abs(ddis) > 0.01 && child.name != 'spine21x'){
                toParent.normalize().mult(ddis);
                child.pos.add(toParent);
            }
            if(ddis < 0.01 && child.name === 'spine21x'){
                toParent.normalize().mult(ddis);
                child.pos.add(toParent);
            }
            child.solveChildren();
        }
    }

    drawDebug(sseed, sscale, sfatness){
        let x1, y1;
        let x2, y2;

        x1 = this.parent.pos.x + this.offset.x;
        y1 = this.parent.pos.y + this.offset.y;
        x2 = this.pos.x;
        y2 = this.pos.y;

        if(this.offset.mag() > 0.001){
            //strokeWeight(4);
            stroke(.5, 0, .0, .6);
            //line(this.parent.pos.x, this.parent.pos.y, this.parent.pos.x+this.offset.x, this.parent.pos.y+this.offset.y);
        }

        let vec = createVector(x2-x1, y2-y1);
        let angle = vec.heading();
        let dista = vec.mag();

        push();
        translate(x1, y1, sseed*10);
        if(this.name == 'neck'){
            // translate(0, 0, 10);
        }
        rotate(angle);
        scale(1, sscale*3.5*sfatness);
        noFill();
        fill(0, .4);
        fill(.4+.2*this.seed);
        fill(.3 + .3*sseed + this.seed*0.05);
        // fill(.15);
        // fill(.65);
        if(this.name == 'elbowr' || this.name == 'elbowl' || this.name == 'wristl' || this.name == 'wristr' || this.name == 'fingertipsl' || this.name == 'fingertipsr'){
            //fill(.45 + .3*sseed);
        }
        noStroke();
        if(this.name == 'neck'){
            fill(.3 + .3*sseed,.3 + .3*sseed,.3 + .45*sseed);
            fill(.3 + .3*sseed);
            fill(...getRandomRYB(sseed*.015));
            rect(dista/2, 0, dista*1.6, 10);
        }
        else if(this.name == 'spine2'){
            rect(dista/2, 0, dista*1.6, 21);
        }
        else if(this.name == 'spine1'){
            rect(dista/2, 0, dista*1.6, 21);
        }
        else if(this.name == 'spine0'){
            rect(dista/2, 0, dista*1.6, 21);
        }
        else{
            rect(dista/2, 0, dista, 10);
        }

        // translate(0,0,1);
        // noStroke();
        // fill(0, 0, 0);
        //  beginShape();
        //  vertex(0, 0);
        //  vertex(dista*.1*0+5, dista*.1*0+5);
        //  vertex(dista, 0);
        //  vertex(dista*.1*0+5, -dista*.1*0-5);
        //  vertex(0, 0);
        //  endShape();
         pop();
    }
}


function gethobbypoints(knots, cycle, det=12){
    var hobbypts = [];
    for (var i=0; i<knots.length; i++) {
        var p0x = knots[i].x_pt;
        var p1x = knots[i].rx_pt;
        var p2x = knots[(i+1)%knots.length].lx_pt;
        var p3x = knots[(i+1)%knots.length].x_pt;
        var p0y = knots[i].y_pt;
        var p1y = knots[i].ry_pt;
        var p2y = knots[(i+1)%knots.length].ly_pt;
        var p3y = knots[(i+1)%knots.length].y_pt;

        //bezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);

        var steps = 44;
        var totald = 0;
        var algorithm = 1;
        if(algorithm == 0){
            for(var st = 0; st < steps; st++){
                var t = map(st, 0, steps, 0, 1);
                var tn = map(st+1, 0, steps, 0, 1);
                x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
                y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
                
                xn = (1-tn)*(1-tn)*(1-tn)*p0x + 3*(1-tn)*(1-tn)*tn*p1x + 3*(1-tn)*tn*tn*p2x + tn*tn*tn*p3x;
                yn = (1-tn)*(1-tn)*(1-tn)*p0y + 3*(1-tn)*(1-tn)*tn*p1y + 3*(1-tn)*tn*tn*p2y + tn*tn*tn*p3y;
    
                var tonext = dist(xn, yn, x, y);
                totald += tonext;
            }
            steps = 2 + round(totald/det);
    
    
            for(var st = 0; st < steps; st++){
                var t = map(st, 0, steps, 0, 1);
                x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
                y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
    
                hobbypts.push(createVector(x, y));
            }
        }
        if(algorithm == 1){
            var t = 0;
            var dt = 0.05;
            while(t < 1.-dt/2){
                x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
                y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
                hobbypts.push(createVector(x, y));
    
                var tn = t + dt;
                xn = (1-tn)*(1-tn)*(1-tn)*p0x + 3*(1-tn)*(1-tn)*tn*p1x + 3*(1-tn)*tn*tn*p2x + tn*tn*tn*p3x;
                yn = (1-tn)*(1-tn)*(1-tn)*p0y + 3*(1-tn)*(1-tn)*tn*p1y + 3*(1-tn)*tn*tn*p2y + tn*tn*tn*p3y;
                var tonext = dist(xn, yn, x, y);
                var offsc = tonext/det;
                dt = dt/offsc;
    
                t = t + dt;
            }
        }
        
    }
    return hobbypts;
}

function drawhobby(knots, cycle) {
    
    //  for (var i=0; i<knots.length; i+=2) {
    //      push();
    //      fill(.6);
    //      noStroke();
    //      translate(knots[i].x_pt, knots[i].y_pt, 0);
    //      ellipse(0, 0, 6, 6);
    //      pop();
    //  }

    var det = 10;
    for (var i=0; i<knots.length-1*cycle; i++) {
        var p0x = knots[i].x_pt;
        var p1x = knots[i].rx_pt;
        var p2x = knots[(i+1)%knots.length].lx_pt;
        var p3x = knots[(i+1)%knots.length].x_pt;
        var p0y = knots[i].y_pt;
        var p1y = knots[i].ry_pt;
        var p2y = knots[(i+1)%knots.length].ly_pt;
        var p3y = knots[(i+1)%knots.length].y_pt;

        //bezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);

        var steps = 10;
        var totald = 0;
        for(var st = 0; st < steps; st++){
            var t = map(st, 0, steps, 0, 1);
            var tn = map(st+1, 0, steps, 0, 1);
            x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
            y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
            
            xn = (1-tn)*(1-tn)*(1-tn)*p0x + 3*(1-tn)*(1-tn)*tn*p1x + 3*(1-tn)*tn*tn*p2x + tn*tn*tn*p3x;
            yn = (1-tn)*(1-tn)*(1-tn)*p0y + 3*(1-tn)*(1-tn)*tn*p1y + 3*(1-tn)*tn*tn*p2y + tn*tn*tn*p3y;

            totald += dist(xn, yn, x, y);
        }
        steps = 2 + round(totald/det);


        for(var st = 0; st < steps; st++){
            var t = map(st, 0, steps, 0, 1);
            x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
            y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;

            // push();
            // fill(.6);
            // noStroke();
            // translate(x, y, 0);
            // ellipse(0, 0, 3, 3);
            // pop();
        }
    }

    // return;

    beginShape();
    vertex(knots[0].x_pt, knots[0].y_pt, 0);
    for (var i=0; i<knots.length-1; i++) {
      //   knots[i+1].lx_pt.toFixed(4), knots[i+1].ly_pt.toFixed(4),
      //   knots[i+1].x_pt.toFixed(4), knots[i+1].y_pt.toFixed(4));
        
        bezierVertex(
            knots[i].rx_pt, knots[i].ry_pt,
            knots[i+1].lx_pt, knots[i+1].ly_pt, 
            knots[i+1].x_pt, knots[i+1].y_pt,
        );
  
        //push();
        //noStroke();
        //fill(...getRandomColor());
        //ellipse(knots[i].x_pt,  knots[i].y_pt, 3, 3);
        //ellipse(knots[i].rx_pt, knots[i].ry_pt, 1, 1);
        //ellipse(knots[i+1].lx_pt, knots[i+1].ly_pt, 1, 1);
        //ellipse(knots[i+1].x_pt,  knots[i+1].y_pt, 3, 3);
        //pop();
    }
    if (cycle) {
        i = knots.length-1;
        bezierVertex(
            knots[i].rx_pt, knots[i].ry_pt,
            knots[0].lx_pt, knots[0].ly_pt,
            knots[0].x_pt, knots[0].y_pt,
        );
    }
    endShape();

}
