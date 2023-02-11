let canvas;

let effect;
let blurH;
let blurV;

var fbo;
var effectFbo;
var bhFbo;
var bvFbo;
let song;

var charFbos = {};

var cl1, cl2, cl3, cl4;

var mm;
var WW, HH;
var ratio = Math.sqrt(2);
let margin = 50;
//var resx = map(fxrand(), 0, 1,  1000, 1400);
//var resy = Math.round(1580*1000/resx);
var resx, resy;
if(fxrand() < -.5){
    resx = 1400;
    resy = Math.round(1400/ratio);
}
else{
    resx = Math.round(1400/ratio);
    resy = 1400;
}
//resx=resy=1400;
var res = Math.min(resx, resy);
var zoom = .8;
var globalseed = Math.floor(fxrand()*1000000);

var hasmargin = 1.0 * (fxrand()*100 < 50);
var numleaves = 10;
let inconsolata;
var letters = 'abcdefghijklmnopqrstuvwxyz!?$%&()<>';
var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!?$%&()<>';
var letters = 'abcdefghijklmnopqrstuvwxyz';
var letters = '023456789';
var letters = 'abcdeghkmnopqsuvwxyz';

var randomtint = [.1, .1, .1]

var pts = [];

//let plt1 = 0.8;
let plt1 = 0.1;


//var variant = Math.floor(fxrand()*5);

var choices = [
    0, 0,
    1, 1, 
    2, 2, 
    3,
    4, 4,
    5, 5,
]

let searchh = new URLSearchParams(window.location.search)
var variant = searchh.get('variant') || choices[Math.floor(fxrand()*choices.length)];

if(variant > 5)
    variant = choices[Math.floor(choices.length)];

if (fxhash.includes('ErL9qSm'))
    variant = 2;

///////
function getVariantString(value) {
    if (value == 0) return "entangled";
    if (value == 1) return "sharp";
    if (value == 2) return "portals";
    if (value == 3) return "function composition";
    if (value == 4) return "sim";
    if (value == 5) return "planes";
}

window.$fxhashFeatures = {
    "variant": getVariantString(variant),
}
///////


function preload() {
    effect = loadShader('assets/shaders/effect.vert', 'assets/shaders/effect.frag');
    blurH = loadShader('assets/shaders/blur.vert', 'assets/shaders/blur.frag');
    blurV = loadShader('assets/shaders/blur.vert', 'assets/shaders/blur.frag');
    inconsolata = loadFont('assets/fonts/couriermb.ttf');
    //inconsolata = loadFont('assets/fonts/helveticaneue/HelveticaNeueBd.ttf');
}

function getRandomRYB(p){
    p = p%1.;
    var cryb = map2(p);
    // cryb = saturatecol(cryb, map(fxrand(), 0, 1, -.3, .3));
    // cryb = brightencol(cryb, map(fxrand(), 0, 1, -.3, .3));
    return cryb;
}

function setup(){
    pixelDensity(2);
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

    canvas = createCanvas(cw, ch, WEBGL);
    canvas.id('maincanvas');

    var p5Canvas = document.getElementById("maincanvas");
    var w = document.getElementById("maincanvas").offsetWidth;
    var h = document.getElementById("maincanvas").offsetHeight;
    //p5Canvas.style.height = h-margin + 'px';
    //p5Canvas.style.width = w-margin + 'px';

    song = loadSound('assets/swoosh1.mp3');

    skelet = new Skelet();

    for(let k = 0; k < 5; k++){
        people.push(new Person(0, 0));
    }


    imageMode(CENTER);
    randomSeed(globalseed);
    noiseSeed(globalseed+123.1341);

    print('fxhash:', fxhash);

    //setAttributes('premultipliedAlpha', true);
    //setAttributes('antialias', true);

    //pg = createGraphics(resx, resy, WEBGL);
    //pg.colorMode(RGB, 1);
    //pg.noStroke();
    curveDetail(44);
    //pg.textFont(inconsolata);
    //ortho(-resx/2, resx/2, -resy/2, resy/2, 0, 4444);
    textFont(inconsolata);
    textAlign(CENTER, CENTER);
    imageMode(CENTER);
    rectMode(CENTER);
    colorMode(RGB, 1);

    //prepareFbos();

    //drawCube(pg);


    //pg.rotateY(accas);
    //mask.rotateY(accas);

    fbo = new p5Fbo({renderer: canvas, width: resx*2, height: resy*2});
    effectFbo = new p5Fbo({renderer: canvas, width: resx*2, height: resy*2});
    bhFbo = new p5Fbo({renderer: canvas, width: resx*2, height: resy*2});
    bvFbo = new p5Fbo({renderer: canvas, width: resx*2, height: resy*2});


    //setAttributes('premultipliedAlpha', true);
    //setAttributes('antialias', true);

    //pg = createGraphics(resx, resy, WEBGL);
    //pg.colorMode(RGB, 1);
    //pg.noStroke();
    curveDetail(44);
    //pg.textFont(inconsolata);
    //ortho(-resx/2, resx/2, -resy/2, resy/2, 0, 4444);
    textFont(inconsolata);
    textAlign(CENTER, CENTER);
    imageMode(CENTER);
    rectMode(CENTER);
    colorMode(RGB, 1);

    //prepareFbos();

    //drawCube(pg);


    
    fbo.begin();
    ortho(-resx/2, resx/2, -resy/2, resy/2, 0, 4444);
    clear();
    background(plt1);
    noStroke();
    fill(0);
    ellipse(random(-1,1), random(-1,1), 55, 55);

    fbo.end();
    showall();
    showall();
    // fxpreview();
    noCursor();

}

let skelets = [];
let skelet;

let people = [];

let mx;
let my;
let cursor;
let cursorp;
const NOTROOT = false;


function draw(){

    mx = map(mouseX, 0, width, -resx/2, resx/2);
    my = map(mouseY, 0, height, -resy/2, resy/2);

    fbo.begin();
    clear();
    ortho(-resx/2, resx/2, -resy/2, resy/2, 0, 4444);
    background(0.15);
   
    noStroke();
    fill(1);
    rect(map(mouseX, 0, width, -resx/2, resx/2), map(mouseY, 0, height, -resy/2, resy/2), 10, 2);
    rect(map(mouseX, 0, width, -resx/2, resx/2), map(mouseY, 0, height, -resy/2, resy/2), 2, 10);

    skelet.solve();
    skelet.draw();

    for(let k = 0; k < people.length; k++){
        let avav = p5.Vector.sub(people[k].spine1.pos, people[k].spine1.parent.pos).heading();
        let veve = createVector(1, 0);
        veve.rotate(avav);
        veve.rotate(PI/2);
        veve.mult(20*sin(frameCount*0.27));
        // people[k].root.pos.x = mx;
        // people[k].root.pos.y = my;
         people[k].root.pos.x = skelet.points[round(1000*noise(k*13.41, 94.31))%skelet.points.length].x;
         people[k].root.pos.y = skelet.points[round(1000*noise(k*13.41, 94.31))%skelet.points.length].y;
        //  people[k].fingertipsl.ctarget.x = skelet.points[round(1000*noise(k*13.41, 94.31))%skelet.points.length].x;
        //  people[k].fingertipsl.ctarget.y = skelet.points[round(1000*noise(k*13.41, 94.31))%skelet.points.length].y;
        //if(p5.Vector.sub(cursor, cursorp).mag() > 0.){
            // people[k].root.pos.x += veve.x;
            // people[k].root.pos.y += veve.y;
        //}
        people[k].solve();
        people[k].drawDebug();
    }

    fbo.end();

    showall();
    //if(frameCount > 33)
    //    noLoop();

}

class Constraint{
    constructor(p1, p2, d, show=true){
        this.p1 = p1;
        this.p2 = p2;
        this.d = d;
        this.cd = d;
        this.show = show;
    }
}


class Skelet {
    constructor(x=0, y=0) {
        this.nx = 4;
        this.ny = 21;
        let ratio = this.nx / this.ny;
        this.points = [];
        this.constraints = [];
        for(let j = 0; j < this.ny; j++){
            for(let i = 0; i < this.nx; i++){
                let x = map(i, 0, this.nx-1, -33*ratio, 33*ratio);
                let y = map(j, 0, this.ny-1, -333, 333);
                let v = createVector(x, y);
                v.vel = createVector(0, 0);
                v.acc = createVector(0, 0);
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
                    if(random(100)<99) this.constraints.push(new Constraint(idx, idxp, d));
                }
                if(j < this.ny-1){
                    let idxp = (j+1)*this.nx + i;
                    let pointp = this.points[idxp];
                    let d = p5.Vector.sub(pointp, point).mag();
                    if(random(100)<99) this.constraints.push(new Constraint(idx, idxp, d));
                }
                if(i < this.nx-1 && j < this.ny-1){
                    let idxp = (j+1)*this.nx + (i+1);
                    let pointp = this.points[idxp];
                    let d = p5.Vector.sub(pointp, point).mag();
                    if(random(100)<99) this.constraints.push(new Constraint(idx, idxp, d));
                }
                if(i > 0 && j < this.ny-1){
                    let idxp = (j+1)*this.nx + (i-1);
                    let pointp = this.points[idxp];
                    let d = p5.Vector.sub(pointp, point).mag();
                    if(random(100)<99) this.constraints.push(new Constraint(idx, idxp, d));
                }
            }
        }
        let pp1, pp2, dd;
        // pp1 = 0;
        // pp2 = this.nx-1;
        // dd = p5.Vector.dist(this.points[pp1], this.points[pp2]);
        // this.constraints.push(new Constraint(pp1, pp2, dd, false))
        // pp1 = 0;
        // pp2 = (this.ny-1)*this.nx;
        // dd = p5.Vector.dist(this.points[pp1], this.points[pp2]);
        // this.constraints.push(new Constraint(pp1, pp2, dd, false))
        // pp1 = this.nx-1;
        // pp2 = (this.ny-1)*this.nx + this.nx-1;
        // dd = p5.Vector.dist(this.points[pp1], this.points[pp2]);
        // this.constraints.push(new Constraint(pp1, pp2, dd, false))
        // pp1 = (this.ny-1)*this.nx;
        // pp2 = (this.ny-1)*this.nx + this.nx-1;
        // dd = p5.Vector.dist(this.points[pp1], this.points[pp2]);
        // this.constraints.push(new Constraint(pp1, pp2, dd, false))
        // pp1 = this.nx-1;
        // pp2 = (this.ny-1)*this.nx;
        // dd = p5.Vector.dist(this.points[pp1], this.points[pp2]);
        // this.constraints.push(new Constraint(pp1, pp2, dd, false))
        // pp1 = 0;
        // pp2 = (this.ny-1)*this.nx + this.nx-1;
        // dd = p5.Vector.dist(this.points[pp1], this.points[pp2]);
        // this.constraints.push(new Constraint(pp1, pp2, dd, false))

    }

    solve(){

        let mx = map(mouseX, 0, width, -resx/2, resx/2);
        let my = map(mouseY, 0, height, -resy/2, resy/2);
        let mv = createVector(mx, my);

        let eps = 2;
        
        for(let k = 0; k < this.points.length; k++){
            let po = this.points[k];
            po.acc.mult(0);
        }
        
        for(let kk = 0; kk < 3; kk++){
            for(let k = 0; k < this.constraints.length; k++){
                let i1 = this.constraints[k].p1;
                let i2 = this.constraints[k].p2;
                let p1 = this.points[i1];
                let p2 = this.points[i2];

                let x1 = i1%this.nx;
                let y1 = floor(i1/this.ny);
                let x2 = i2%this.nx;
                let y2 = floor(i2/this.ny);

                let cle = this.constraints[k].d;
                
                let p12 = p5.Vector.sub(p2, p1);
                let p12n = p12.copy().normalize();

                let d = p12.mag();

                let force = createVector(0, 0);
                if(d < cle-eps){
                    let f = p12n.copy();
                    f.mult(cle-eps-d);
                    f.mult(-.5);
                    force.add(f);
                    if(1 != 0 && 1 != this.nx-1 || true) p1.add(f);
                    f.mult(-1);
                    if(x2 != 0 && x2 != this.nx-1 || true) p2.add(f);
                }
                if(d > cle+eps){
                    let f = p12n.copy();
                    f.mult(d-cle-eps);
                    f.mult(.5);
                    force.add(f);
                    if(x1 != 0 && x1 != this.nx-1 || true) p1.add(f);
                    f.mult(-1);
                    if(x2 != 0 && x2 != this.nx-1 || true) p2.add(f);
                }

                p1.acc.add(force);
                p2.acc.add(force.copy().mult(-1));
                
                //p1.vel.add(p1.acc);
                //p1.vel.mult(.9);
                //p1.add(p1.vel);
                
                //p2.vel.add(p2.acc);
                //p2.vel.mult(.9);
                //p2.add(p1.vel);
            }
        }

        let brd = 20;
        let rv = createVector(1, 0).mult(3);
        let lv = createVector(-1, 0).mult(3);
        let uv = createVector(0, -1).mult(3);
        let dv = createVector(0, 1).mult(3);
        let gravity = createVector(0, 1).mult(.0);

        for(let k = 0; k < this.points.length; k++){
            let po = this.points[k];
            let fom = p5.Vector.sub(po, mv);
            fom.normalize();
            let dm = dist(mx, my, po.x, po.y);
            if(dm < 44){
                let p = map(dm, 0, 44, 1, 0);
                fom.mult(p*55);
            }
            else{
                fom.mult(0);
            }

            if(po.x > resx/2-brd){
                fom.add(lv);
            }
            if(po.x < -resx/2+brd){
                fom.add(rv);
            }
            if(po.y > resy/2-brd){
                fom.add(uv);
            }
            if(po.y < -resy/2+brd){
                fom.add(dv);
            }

            fom.add(gravity);

            po.acc.add(fom);
            po.vel.add(po.acc);
            po.vel.mult(.85);
            //po.vel.limit(2);
            
            let x1 = k%this.nx;
            let y1 = floor(k/this.ny);
            if(x1 != 0 && x1 != this.nx-1 || true) po.add(po.vel);
        }

        
        for(let k = 0; k < skelet.constraints.length; k++){
            this.constraints[k].d = this.constraints[k].d + .1*(this.constraints[k].cd - this.constraints[k].d);
        }
        // this.points[0].x = mv.x;
        // this.points[0].y = mv.y;
        // this.points[(this.ny-1)*this.nx].y = mv.y;
        // this.points[(this.ny-1)*this.nx].y = mv.y;
    }

    draw(){
        if(frameCount%100 == 0)
            print(frameRate());
        noFill();
        stroke(1, .5);
        strokeWeight(2);
        fill(1);
        noStroke();

        let red = getRandomRYB(0);
        //beginShape();
        for(let k = 0; k < this.constraints.length; k++){
            if(!this.constraints[k].show)
                continue;
            let i1 = this.constraints[k].p1;
            let i2 = this.constraints[k].p2;
            let p1 = this.points[i1];
            let p2 = this.points[i2];
            let mid = p5.Vector.add(p1, p2);
            let ve = p5.Vector.sub(p2, p1);

            mid.div(2);
            push();
            
            let oo = abs(ve.mag() - this.constraints[k].d)/5;
            oo = constrain(oo, 0.2, 1)-.2;
            fill(1*(1-oo) + oo*red[0],1*(1-oo) + oo*red[1],1*(1-oo) + oo*red[2]);

            let co = power(noise(k), 3);
            // if(noise(k) > .6)
            //     co += .7;
            let fc = getRandomRYB(0);
            fc = saturatecol(fc, -1+oo);

            fill(...fc);
            // if(noise(k) > .73)
            //     fill(.9, .7, .7);
            translate(mid.x, mid.y);
            rotate(ve.heading());
            rect(0, 0, 3, 42.7+.1*power(noise(k*.1), 3));
            
            fill(.8, .6, .66);
            translate(0,0,3);
            rect(0, 0, 2, 6.7+.1*power(noise(k*.1), 3));
            //rect(0, 0, ve.mag(), .7+.1*power(noise(k*.1), 3));
            pop();
            //line(p1.x, p1.y, p2.x, p2.y);
        }
        fill(1);
        noStroke();
        for(let k = 0; k < this.points.length; k++){
            let p1 = this.points[k];
            //ellipse(p1.x, p1.y, 3, 3);
            //rect(p1.x, p1.y, 3, 3);
        }
    }
}

function showall(){
    background(1);
    //pg.push();
    //pg.scale(0.8);
    //pg.pop();
    //pg.line(0,0,mouseX-width/2,mouseY-height/2);

    var an = fxrand()*PI;
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
    effect.setUniform('hasmargin', hasmargin);
    //effect.setUniform('tintColor', HSVtoRGB(fxrand(), 0.2, 0.95));
    var hue1 = fxrand();
   //effect.setUniform('tintColor', HSVtoRGB(fxrand(),.3,.9));
    //effect.setUniform('tintColor2', HSVtoRGB((hue1+.45+fxrand()*.1)%1,.3,.9));
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

}

function windowResized() {
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
    resizeCanvas(cw, ch, true);
    
    var p5Canvas = document.getElementById("maincanvas");
    var w = cw;
    var h = ch;
    //p5Canvas.style.height = h-margin + 'px';
    //p5Canvas.style.width = w-margin + 'px';

    showall();
}

var randomstring = function(){
    var le = round(random(1, 33));
    var ou = '';
    for(var k = 0; k < le; k++){
        ou += letters[floor(random(letters.length))];
    }
    return ou;
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
    
    for (var i=0; i<knots.length-1; i++) {
        push();
        fill(0);
        noStroke();
        translate(knots[i].x_pt, knots[i].y_pt, 0);
        ellipse(0, 0, 5, 5);
        pop();
    }

    var det = 10;
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

            push();
            fill(0);
            noStroke();
            translate(x, y, 0);
            ellipse(0, 0, 5, 5);
            pop();
        }
    }

    return;

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

function map(v, v1, v2, v3, v4){
    return (v-v1)/(v2-v1)*(v4-v3)+v3;
}


function mouseClicked(){
    //createShapes();
    
    for(let k = 0; k < skelet.constraints.length; k+=4){
        skelet.constraints[k].d *= 2;
    }
    
    song.play();
}

function keyPressed(){
    //noiseSeed(round(random(1000)));
    //createShapes();
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