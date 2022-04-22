export class Stalker {
  constructor (config, level, upgrade, xx, yy) {
    this.type = 'stalker';
    this.active = false;
    this.vel = 4; // Скорость юнита
    this.visionRad = 0.7 * config.screenRange;

    this.level = level; // Отвечает за размеры сталкера
    this.upgrade = upgrade; // Отвечает за наличие/отсутствие свойства телепортации
    this.teleCooldown = 4;
    this.teleCount = 0;
    this.rad = 1.5 ** (this.level - 1) * config.stalkerRad;

    let distToCenter;

    // Цикл необходим для того, чтобы враги создавались за пределами видимости (не считая начальной инициализации)

    do {
      this.pos = {x: xx || config.w / 2 + config.visibilityRange * (Math.random() * 2 - 1), y: yy || config.h / 2 + config.visibilityRange * (Math.random() * 2 - 1)};
      distToCenter = Math.hypot(this.pos.x - config.w / 2, this.pos.y - config.h / 2);
    } while (!xx && (distToCenter > config.visibilityRange || distToCenter < config.screenRange));

    this.angle = Math.random() * 180;
    this.color = this.upgrade == 1 ? config.stalkerColor[1] : config.stalkerColor[0];
    this.health = 100 * this.level;

    this.posAnglesX = [];
    this.posAnglesY = [];


    this.posAnglesY.push(this.pos.y + Math.sin((this.angle) * Math.PI / 180) * this.rad);
    this.posAnglesX.push(this.pos.x + Math.cos((this.angle) * Math.PI / 180) * this.rad);

    this.posAnglesY.push(this.pos.y + Math.sin((this.angle + 140) * Math.PI / 180) * this.rad);
    this.posAnglesX.push(this.pos.x + Math.cos((this.angle + 140) * Math.PI / 180) * this.rad);

    this.posAnglesY.push(this.pos.y + Math.sin((this.angle + 180) * Math.PI / 180) * 0.4 * this.rad);
    this.posAnglesX.push(this.pos.x + Math.cos((this.angle + 180) * Math.PI / 180) * 0.4 * this.rad);

    this.posAnglesY.push(this.pos.y + Math.sin((this.angle + 220) * Math.PI / 180) * this.rad);
    this.posAnglesX.push(this.pos.x + Math.cos((this.angle + 220) * Math.PI / 180) * this.rad);


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

  move(corrAngle) {

    this.active = true;
    this.angle = corrAngle;

    this.pos.x += this.vel * Math.cos(this.angle);
    this.pos.y += this.vel * Math.sin(this.angle);

    this.posAnglesY[0] = this.pos.y + Math.sin(this.angle) * this.rad;
    this.posAnglesX[0] = this.pos.x + Math.cos(this.angle) * this.rad;

    this.posAnglesY[1] = this.pos.y + Math.sin(this.angle + 140 * Math.PI / 180) * this.rad;
    this.posAnglesX[1] = this.pos.x + Math.cos(this.angle + 140 * Math.PI / 180) * this.rad;

    this.posAnglesY[2] = this.pos.y + Math.sin(this.angle + 180 * Math.PI / 180) * 0.4 * this.rad;
    this.posAnglesX[2] = this.pos.x + Math.cos(this.angle + 180 * Math.PI / 180) * 0.4 * this.rad;

    this.posAnglesY[3] = this.pos.y + Math.sin(this.angle + 220 * Math.PI / 180) * this.rad;
    this.posAnglesX[3] = this.pos.x + Math.cos(this.angle + 220 * Math.PI / 180) * this.rad;

  }

  divide(config, enemies, index) {
    //Разделение крупного сталкера надвое
    this.level--;

    for (let i = 0; i < enemies.length; i++) {
      if (!enemies[i].isInScreen) {

        if (index == i) continue;

        let x1 = this.pos.x + this.rad * Math.cos((this.angle + 90) * Math.PI / 180);
        let y1 = this.pos.y + this.rad * Math.sin((this.angle + 90) * Math.PI / 180);

        enemies[i] = new Stalker(config, this.level, this.upgrade, x1, y1);
        break;
      }
    }

    let x2 = this.pos.x + this.rad * Math.cos((this.angle - 90) * Math.PI / 180);
    let y2 = this.pos.y + this.rad * Math.sin((this.angle - 90) * Math.PI / 180);

    enemies[index] = new Stalker(config, this.level, this.upgrade, x2, y2);

  }

  teleport(centerX, centerY) {
    // Телепортация
    if (this.teleCount < this.teleCooldown) {
      this.teleCount++;
      return;
    }

    this.teleCount = 0;

    let dist = Math.hypot(this.pos.x - centerX, this.pos.y - centerY);
    let newAngle = Math.random() * Math.PI * 2;

    this.pos.x = centerX + (50 + dist) * Math.cos(newAngle);
    this.pos.y = centerY + (50 + dist) * Math.sin(newAngle);
  }

  checkOfCollision(playerUnits) {
    //Проверка пересечения текущего объекта с остальными и предпринятие соответствующих действий

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
          option = this.damage(playerUnits[i], playerUnits[0].pos.x, playerUnits[0].pos.y);

          option[0] = i;
          if (i == 0) option[3] = 1;

          return option;
        }


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
            option = this.damage(playerUnits[i], playerUnits[0].pos.x, playerUnits[0].pos.y);

            option[0] = i;
            if (i == 0) option[3] = 1;

            return option;
          }

        }

      }
    }

    return [0, 0, 0, 0, 0]; // Ничего не произошло

  }


  damage(plUnit, w0, h0) {
    // Расчет наносимого урона
    let unitKilled = 0;
    let thisKilled = 0;
    let output = [];
    let isDivide = 0;


    if (plUnit.health < this.health) {
      this.health -= plUnit.health;
      unitKilled = 1;
      
      if (this.upgrade == 1) this.teleport(w0, h0);
    }

    else if (plUnit.health > this.health) {
      plUnit.health -= this.health;
      thisKilled = 1;

      
      if (this.level > 1) isDivide = 1;

    }

    else if (plUnit.health == this.health) {
      unitKilled = 1;
      thisKilled = 1;
      if (this.level > 1) isDivide = 1;
    }

    output = [0, unitKilled, thisKilled, 0, isDivide];

    return output;
  }



}