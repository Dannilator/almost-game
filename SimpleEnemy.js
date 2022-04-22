export class SimpleEnemy {
  constructor (config, numOfSides, isInit) {
    this.type = 'simple';
    this.rad = 10 * numOfSides;

    let distToCenter;

    // Цикл необходим для того, чтобы враги создавались за пределами видимости (не считая начальной инициализации)

    do {
      this.pos = {x: config.w / 2 + config.visibilityRange * (Math.random() * 2 - 1), y: config.h / 2 + config.visibilityRange * (Math.random() * 2 - 1)};
      distToCenter = Math.hypot(this.pos.x - config.w / 2, this.pos.y - config.h / 2);
    } while (distToCenter > config.visibilityRange ||
             !isInit &&
             distToCenter < config.screenRange ||
             isInit &&
             (this.pos.x < config.w / 2 + config.bigDotRad + 5 * this.rad && 
             this.pos.x > config.w / 2 - config.bigDotRad - 5 * this.rad && 
             this.pos.y < config.h / 2 + config.bigDotRad + 5 * this.rad && 
             this.pos.y > config.h / 2 - config.bigDotRad - 5 * this.rad));

    this.angle = Math.random() * 180;
    this.color = config.simpENColor[numOfSides - 3];
    this.health = 20 * Math.floor(1.5 ** numOfSides);

    this.posAnglesX = [];
    this.posAnglesY = [];

    for (let i = 0; i < numOfSides; i++) {
      this.posAnglesY.push(this.pos.y + Math.sin((this.angle + i * 360 / numOfSides) * Math.PI / 180) * this.rad);
      this.posAnglesX.push(this.pos.x + Math.cos((this.angle + i * 360 / numOfSides) * Math.PI / 180) * this.rad);
    }

    this.isInScreen = false;
  }
  
  drawEnemy(ctx) {
    ctx.fillStyle = this.color;
      
    ctx.beginPath();
    ctx.moveTo(Math.floor(this.posAnglesX[0]), Math.floor(this.posAnglesY[0]));

    for (let i = 1; i < this.posAnglesX.length; i++) {
      ctx.lineTo(Math.floor(this.posAnglesX[i]), Math.floor(this.posAnglesY[i]));
    }
    ctx.fill();


    ctx.lineTo(Math.floor(this.posAnglesX[0]), Math.floor(this.posAnglesY[0]));
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.closePath();
  }


  checkOfCollision(playerUnits) {
    // взаимодействие иных объектов и текущего
    let option = [];

    for (let i = 0; i < playerUnits.length; i++) {

      if (Math.abs(this.pos.x - playerUnits[i].pos.x) <= this.rad + playerUnits[i].rad &&
          Math.abs(this.pos.y - playerUnits[i].pos.y) <= this.rad + playerUnits[i].rad) {

        let dists = [];
        let minDist = dists[0] = Math.hypot(playerUnits[i].pos.x - this.posAnglesX[0], playerUnits[i].pos.y - this.posAnglesY[0]);
        let numOfMin = 0;
        let sumOfAngles = this.posAnglesX.length;

        for (let j = 1; j < sumOfAngles; j++) {

          dists[j] = Math.hypot(playerUnits[i].pos.x - this.posAnglesX[j], playerUnits[i].pos.y - this.posAnglesY[j]);

          if (dists[j] < minDist) {
            minDist = dists[j];
            numOfMin = j;
          }

        }

        if (minDist <= playerUnits[i].rad) {
          option = this.damage(playerUnits[i]);
          option[0] = i;

          if (i == 0) option[3] = 1;

          return option;
        }

        //////// Расчет и разбиение частей стоит провести еще во время инициализации

        let nextNum = numOfMin < sumOfAngles - 1 ? numOfMin + 1 : 0;
        let prevNum = numOfMin > 0 ? numOfMin - 1 : sumOfAngles - 1;

        let secNum = dists[nextNum] < dists[prevNum] ? nextNum : prevNum;

        let pieces = 1 + Math.round(Math.hypot(this.posAnglesX[numOfMin] - this.posAnglesX[secNum], this.posAnglesY[numOfMin] - this.posAnglesY[secNum]) / 10);

        let pieceX = (this.posAnglesX[numOfMin] - this.posAnglesX[secNum]) / pieces;
        let pieceY = (this.posAnglesY[numOfMin] - this.posAnglesY[secNum]) / pieces;

        let middleX = [];
        let middleY = [];

        for (let j = 0; j < pieces; j++) {

          middleX[j] = this.posAnglesX[secNum] + j * pieceX;
          middleY[j] = this.posAnglesY[secNum] + j * pieceY;

          if (Math.hypot(middleX[j] - playerUnits[i].pos.x, middleY[j] - playerUnits[i].pos.y) <= playerUnits[i].rad) {
            option = this.damage(playerUnits[i]);
            option[0] = i;
            if (i == 0) option[3] = 1;

            return option;
          }

        }

      }
    }

    return [0, 0, 0, 0]; // Ничего не произошло

  }


  damage(plUnit) {
    //Расчет наносимого урона
    let unitKilled = 0;
    let thisKilled = 0;
    let output = [];


    if (plUnit.health < this.health) {
      this.health -= plUnit.health;
      unitKilled = 1;
    }

    else if (plUnit.health > this.health) {
      plUnit.health -= this.health;
      thisKilled = 1;
    }

    else if (plUnit.health == this.health) {
      unitKilled = 1;
      thisKilled = 1;
    }

    output = [0, unitKilled, thisKilled, 0];

    return output;
  }

}