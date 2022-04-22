export class LightTower {
  constructor(config) {
    this.type = 'tower';
    this.rad = 32;
    this.smallRad = 6;
    this.color = config.lightTowColor[0];
    this.mainColor = config.lightTowColor[1];
    this.backgrColor = config.lightTowColor[2];
    this.health = 100;
    this.damage = 20;
    this.stepLength = 2;
    this.maxLength = 0.4 * config.screenRange;
    this.maxOffset = 6;

    this.level = Math.floor(Math.random() * 3 + 1); // Чем выше уровень, тем больше молний одновременно испускает башня

    let distToCenter;

    // Цикл необходим для того, чтобы враги создавались за пределами видимости (не считая начальной инициализации)

    do {
      this.pos = {x: config.w / 2 + config.visibilityRange * (Math.random() * 2 - 1), y: config.h / 2 + config.visibilityRange * (Math.random() * 2 - 1)};
      distToCenter = Math.hypot(this.pos.x - config.w / 2, this.pos.y - config.h / 2);
    } while (distToCenter > config.visibilityRange || distToCenter < config.screenRange + this.maxLength);

    this.isInScreen = false;
  }

  createCircle(ctx, x, y, rad, fill) {
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, 2 * Math.PI);
    ctx.closePath();
    fill ? ctx.fill() : ctx.stroke();
    ctx.closePath();
  }

  drawEnemy(ctx) {
    ctx.fillStyle = this.backgrColor;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 5;

    this.createCircle(ctx, this.pos.x, this.pos.y, this.maxLength, true);

    ctx.fillStyle = this.mainColor;
    this.createCircle(ctx, this.pos.x, this.pos.y, this.rad, false);
    
    this.createCircle(ctx, this.pos.x, this.pos.y, this.smallRad, true);

    ctx.strokeStyle = this.mainColor;

    for (let i = 2; i <= this.level; i++) {
      this.createCircle(ctx, this.pos.x, this.pos.y, this.smallRad * i, false);
    }

    ctx.lineWidth = 1;
  }


  chooseToAttack(ctx, playerUnits) {
    // Выбор цели для атаки
    let chooseOfAttack = 0, chElem = Math.hypot(this.pos.x - playerUnits[0].pos.x, this.pos.y - playerUnits[0].pos.y);
    let nowElem, isKilled = 0;
    let optionDamByTower = [0, 0, 0];
    let playerDamaged = 0;

    for (let j = 0; j < playerUnits.length; j++) {
      nowElem = Math.hypot(this.pos.x - playerUnits[j].pos.x, this.pos.y - playerUnits[j].pos.y);
      if (nowElem < chElem) chElem = nowElem, chooseOfAttack = j;
    }

    if (Math.hypot(this.pos.x - playerUnits[chooseOfAttack].pos.x, this.pos.y - playerUnits[chooseOfAttack].pos.y) <= this.maxLength) {

      isKilled = this.attack(ctx, playerUnits[chooseOfAttack]);
      
      if (chooseOfAttack == 0 && isKilled != -1) {
        playerDamaged = 1;
      }

      if (isKilled == -1) isKilled++;

      optionDamByTower = [chooseOfAttack, isKilled, playerDamaged];
    }


    for (let j = 1; j < this.level; j++) {
      chooseOfAttack = Math.floor(Math.random() * playerUnits.length);
      isKilled = 0, playerDamaged = 0;

      if (Math.hypot(this.pos.x - playerUnits[chooseOfAttack].pos.x, this.pos.y - playerUnits[chooseOfAttack].pos.y) <= this.maxLength) {
        isKilled = this.attack(ctx, playerUnits[chooseOfAttack]);

        if (chooseOfAttack == 0 && isKilled != -1) {
          playerDamaged = 1;
        }

        if (isKilled == -1) isKilled++;

        optionDamByTower[j * 3] = chooseOfAttack;
        optionDamByTower[j * 3 + 1] = isKilled;
        optionDamByTower[j * 3 + 2] = playerDamaged;
      }
    }

    return optionDamByTower;
  }

  attack(ctx, element) {
    // Процесс атаки и отрисовка
    let isKilled = 0;

    let  dist = Math.hypot(this.pos.x - element.pos.x, this.pos.y - element.pos.y);
    let chance = dist / this.maxLength;

    let sx = this.pos.x, sy = this.pos.y;

    if (chance > Math.random()) return -1;

    let otherColor = chance * 255;

    let stepsCount = dist / this.stepLength;

    ctx.lineWidth = 5;
    ctx.strokeStyle = `rgb(255, ${otherColor}, ${otherColor})`;

    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    for (let j = stepsCount; j > 1; j--) {
      let pathLength = Math.hypot(this.pos.x - sx, this.pos.y - sy);
      let offset = Math.sin(pathLength / dist * Math.PI) * this.maxOffset;

      sx += (element.pos.x - sx) / j + Math.random() * offset * 2 - offset;
      sy += (element.pos.y - sy) / j + Math.random() * offset * 2 - offset; 

      ctx.lineTo(sx, sy);
    }

    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth = 1;


    element.health -= this.damage;

    if (element.health <= 0) isKilled = 1;

    return isKilled;
  }


  damageL(plUnit) {
    // Расчет наносимого урона
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


  checkOfCollision(playerUnits) {
    // Пересечение башни и юнитов
    let option = [];

    for (let i = 0; i < playerUnits.length; i++) {

      if (Math.hypot(this.pos.x - playerUnits[i].pos.x, this.pos.y - playerUnits[i].pos.y) <= this.rad + playerUnits[i].rad) {
        option = this.damageL(playerUnits[i]);

        option[0] = i;
        if (i == 0) {
          option[3] = 1;
        }

        return option;
      }

    }

    return [0, 0, 0, 0]; // Ничего не произошло
  }

}