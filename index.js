const cnv = document.getElementsByTagName("canvas")[0];
const ctx = cnv.getContext("2d");
const expressionDiv = document.getElementById("expression");
const resultDiv = document.getElementById("result");


cnv.width = cnv.parentElement.offsetWidth;
cnv.height = cnv.parentElement.offsetHeight;

let cw = cnv.width/100
let ch = cnv.height/100

let cnvbg = "rgb(0, 98, 255)";
let cnvBrightness = 100;
let cnvHue = 0;

const fps = 36;

const signs = ['+','-','*','/','**','*Math.sqrt(','*(',')*', '.'];


const jumpSfx = new Audio("audio/jump.wav");
const startSfx = new Audio("audio/start.wav");
const outSfx = new Audio("audio/out.wav");
const rainSound = new Audio("audio/rain2.wav");
const thunderSfxSrc = "audio/thunder.wav";
rainSound.loop = true;;
rainSound.volume = .7;


let isGameover = true;


//pipe functions
const randomPipey = () => Math.round(Math.random()*65*ch)

function drawPipes(){
    for(var i in pipes){
        let pipey = pipes[i];
        ctx.drawImage(pipedownimage, i*50*ch+pipeoffset, pipey-pipeheight,pipewidth, pipeheight);
        ctx.drawImage(pipeupimage, i*50*ch+pipeoffset, pipey+35*ch,pipewidth, pipeheight);
    }
}

function incrementPipeoffset(){
    pipeoffset-=pipespeed;

    if (raining) pipeoffset -= Math.sin(performance.now() * 0.002) * .05*cw;

    if (pipeoffset<=-pipewidth){
        pipes = pipes.slice(1, pipes.length);
        pipes.push(randomPipey());
        pipeoffset = 50*cw-pipewidth;
        birdpassed = false;
    }
}

function acceleratePipe(){
    pipespeed+=pipeaccn;
}

function checkCollision(){
    for(var i in pipes){
        let pipey = pipes[i];
        let pipex = i*50*ch+pipeoffset;
        if ((
            birdx+birdwidth > pipex &&
            birdx < pipex+pipewidth && (
            birdy+birdheight > pipey + 35*ch ||
            birdy < pipey
        )) || (
            birdy+birdwidth > 100*ch ||
            birdy < 0
        )) {
            gameover();
            break;
        }
    }
}

// Bird functions

function drawBird(){
    ctx.drawImage(birdimage, birdx, birdy, birdwidth, birdheight);
}

function flapBird(){
    birdVelocity = flapVelocity;
    jumpSfx.play();
}

function updateBird(){
    birdy+=birdVelocity;
    birdVelocity+=g;
}

let birdpassed = false;
function checkBirdPass(){
    if(!birdpassed && birdx+birdwidth/2 > pipeoffset){
        birdpassed = true;
        firstBirdpass = true;
        if (sign) terms[terms.length-1] = signs[parseInt(Math.random()*signs.length)];
        else terms[terms.length-1] += 1;
        updateExpression();
    }
}

//start game function

function startgame(){
    if (isGameover){
        pipeoffset = 100*cw;
        pipespeed = 10*cw/fps;
        pipes = [];
        for(var i=0; i<=2; i++)
            pipes.push(randomPipey());
    
        birdVelocity = 0;
        birdy = 50*ch;
        isGameover = false;
        birdpassed = false;
        firstBirdpass = false;
        startSfx.play();
    }
}

//gameover
function gameover(){
    isGameover = true;
    sign = !sign;
    if (sign){
        terms.push('');
    } else {
        terms.push(0);
    }
    if (!firstBirdpass){
        terms = [0];
        sign = false;
        expressionDiv.innerHTML = "0";
        resultDiv.innerHTML = "0";
        return;
    }
    outSfx.play();
}


// post processings

function postprocessCnv(){
    cnv.parentElement.style.background = cnvbg;
    cnv.style.filter = `brightness(${cnvBrightness}%) hue-rotate(${cnvHue}deg)`;
}

//main loops

function update(){
    if (isGameover || imagesloaded<3) return;
    incrementPipeoffset();
    acceleratePipe();
    updateBird();
    checkBirdPass();
    checkCollision();

    if(raining) updateRain();

}

function updateCnv(){
    if (isGameover || imagesloaded<3) {
        return requestAnimationFrame(updateCnv);
    };
    ctx.clearRect(0,0,100*cw,100*ch);
    drawPipes();
    drawBird();
    postprocessCnv();
    
    if(raining) drawRain();

    requestAnimationFrame(updateCnv);
}



// creating first pipes
let pipeoffset = 100*cw;
let pipeheight = 100*ch;
let pipewidth = Math.round(223*100*cw/1119);
let pipespeed = 10*cw/fps;
let pipeaccn = cw*.01/fps;
let pipes = [];
let pipeupimage = new Image();
let pipedownimage = new Image();
pipeupimage.src = "images/pipe-up.png";
pipedownimage.src = "images/pipe-down.png";

let imagesloaded = 0;

for(var i=0; i<=2; i++)
    pipes.push(randomPipey());


//bird stuff
let birdimage = new Image();
birdimage.src = "images/bird.png";
let g = 2*ch/fps;
let birdVelocity = 0;
let flapVelocity = -40*ch/fps;
let birdx = Math.round(25*cw);
let birdy = 50*ch;
let birdwidth = 10*cw;
let birdheight = 10*cw;
let firstBirdpass = false;

// check images loaded
pipeupimage.onload = pipedownimage.onload = birdimage.onload
    = () => imagesloaded++;


// loops

setInterval(update, 1000/fps);
requestAnimationFrame(updateCnv);
cnv.addEventListener("click", flapBird)
cnv.addEventListener("click", startgame)
document.body.addEventListener("keydown", e=>{
    if(e.key==" "){
        flapBird();
        startgame();
    }
});


// expression update system

let terms = [0];
let sign = false;
let expression_look = "";
let expression_real = "";

function updateExpression(){
    expression_real = "";
    for(var t of terms){
        expression_real+=String(t);
    }
    expression_look = expression_real.replaceAll("(", "&lpar;")
                                    .replaceAll(")", "&rpar;")
                                    .replaceAll("**", "^")
                                    .replaceAll("Math.sqrt", "&Sqrt;")
                                    .replaceAll("*", "x")
    expressionDiv.innerHTML = expression_look;
    setTimeout(()=>expressionDiv.scrollLeft = expressionDiv.scrollWidth, 0);
    try{
        let res = eval(expression_real);
        resultDiv.innerText = String(res);
    } catch {
        resultDiv.innerText = "NaN";
    }
}


// daynight change

let minBrightness = 30;
let weatherDuration = 20;
let weatherChangeDuration = 5*fps;
let currentWeather = 0; // Day-0, Night-1, Pink-2, orange-3
let totalWeathers = 4;

let weatherBgs = [
    [0, 100, 255, 100, 0],
    [10, 0, 110, 20, 0],
    [255, 0, 140, 80, -50],
    [200, 90, 0, 50, -90]
]

let cnvbgr = 0;
let cnvbgg = 100;
let cnvbgb = 255;
let cnvbgd = 100;
let cnvbgh = 0;

function weatherChange(){

    let nextWeather = parseInt(Math.random()*totalWeathers);
    if (nextWeather==currentWeather) {
        if (nextWeather==totalWeathers-1) nextWeather = 0;
        else nextWeather++;
    };
    
    let nextWeatherBgr = weatherBgs[nextWeather][0];
    let nextWeatherBgg = weatherBgs[nextWeather][1];
    let nextWeatherBgb = weatherBgs[nextWeather][2];
    let nextWeatherBgd = weatherBgs[nextWeather][3];
    let nextWeatherBgh = weatherBgs[nextWeather][4];
    
    let bgfacr = (nextWeatherBgr - cnvbgr) / weatherChangeDuration;
    let bgfacg = (nextWeatherBgg - cnvbgg) / weatherChangeDuration;
    let bgfacb = (nextWeatherBgb - cnvbgb) / weatherChangeDuration;
    let bgfacd = (nextWeatherBgd - cnvbgd) / weatherChangeDuration;
    let bgfach = (nextWeatherBgh - cnvbgh) / weatherChangeDuration;
    
    let counter = 0;
    let weatherInterval = setInterval(()=>{
        cnvbgr += bgfacr;
        cnvbgg += bgfacg;
        cnvbgb += bgfacb;
        cnvbgd += bgfacd;
        cnvbgh += bgfach;
        cnvbg = `rgb(${parseInt(cnvbgr)},${parseInt(cnvbgg)},${parseInt(cnvbgb)})`;
        cnvBrightness = parseInt(cnvbgd);
        cnvHue = parseInt(cnvbgh);
        if (counter>=weatherChangeDuration){
            currentWeather = nextWeather;
            setTimeout(weatherChange, weatherDuration*1000);
            clearInterval(weatherInterval);
            counter = 0;

            if(Math.random()<.4){
                raining = true;
                rainSound.play();
            } else {
                raining = false;
                rainSound.pause();
            }
        }
        counter++;
    }, 1000/fps);
}

setTimeout(weatherChange, weatherDuration*1000);

// rain mechanics

let raining = false;

let raindrops = [];
let totalDrops = 200;
let rainAngle = Math.PI/12;

for(let i=0; i<totalDrops; i++){
    raindrops.push({
        x: Math.random()*100*cw,
        y: Math.random()*100*cw,
        l: Math.random() * (15*ch) + (5*ch),
        s: Math.random() * (5*ch) + (2.5*ch)
    });
}

console.log(raindrops)

function drawRain(){
    ctx.strokeStyle = "rgba(172, 216, 230, 0.6)";
    ctx.lineWidth = .5*cw;

    for(let drop of raindrops){
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - (drop.l*Math.tan(rainAngle)), drop.y+drop.l);
        ctx.closePath();
        ctx.stroke();
    }

    if (currentWeather == 1 && Math.random() < 0.01) {
        cnv.parentElement.style.filter = ``;
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fillRect(0, 0, 100*cw, 100*ch);
        let thunderSfx = new Audio(thunderSfxSrc);
        thunderSfx.play();
    }

}

function updateRain(){
    for(let drop of raindrops){
        drop.y+=drop.s;
        drop.x-=drop.s*Math.tan(rainAngle);

        drop.s += (Math.random() - 0.5) * 0.1*ch;
        if(drop.s<.1) drop.s = .1;

        if(drop.y > 100*ch || drop.x < 0){
            drop.y = -drop.l;
            drop.x = Math.random()*(100*cw+100*ch*Math.tan(rainAngle));
        }
    }
}