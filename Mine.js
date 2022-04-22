export class Mine {
  constructor(config, isInit, upgrade, active, x, y) {
    this.type = 'mine';
    this.rad = config.mineRad;
    this.smallRad = Math.floor(0.7 * config.mineRad);
    this.buttonRad = Math.floor(0.35 * config.mineRad);
    this.numOfPike = 6;
    this.upgrade = upgrade || Math.floor(Math.random() * 3 + 1); // 1 - Усиленная мина, иначе - обычная
    this.color = config.mineColor[0];
    this.mainColor = this.upgrade == 1 ? config.mineColor[2] : config.mineColor[1];
    this.damage = 200;
    this.active = active || false;
    this.bigCircleDam = false;
    this.explosionSpeed = 20;
    this.radOfExplosion = 200;
    this.count = 0;

    let distToCenter;

    // Цикл необходим для того, чтобы враги создавались за пределами видимости (не считая начальной инициализации)

    do {
      this.pos = {x: x || config.w / 2 + config.visibilityRange * (Math.random() * 2 - 1), y: y || config.h / 2 + config.visibilityRange * (Math.random() * 2 - 1)};
      distToCenter = Math.hypot(this.pos.x - config.w / 2, this.pos.y - config.h / 2);
    } while (!x && (distToCenter > config.visibilityRange ||
             !isInit &&
             distToCenter < config.screenRange ||
             isInit &&
             (this.pos.x < config.w / 2 + config.bigDotRad + 5 * this.rad && 
             this.pos.x > config.w / 2 - config.bigDotRad - 5 * this.rad && 
             this.pos.y < config.h / 2 + config.bigDotRad + 5 * this.rad && 
             this.pos.y > config.h / 2 - config.bigDotRad - 5 * this.rad)));


    this.angle = Math.random() * 360 / this.numOfPike;
    this.posAnglesX = [];
    this.posAnglesY = [];

    for (let i = 0; i < this.numOfPike; i++) {

      this.posAnglesY.push(this.pos.y + Math.sin((this.angle - 20 + i * 360 / this.numOfPike) * Math.PI / 180) * this.smallRad);
      this.posAnglesY.push(this.pos.y + Math.sin((this.angle + i * 360 / this.numOfPike) * Math.PI / 180) * this.rad);
      this.posAnglesY.push(this.pos.y + Math.sin((this.angle + 20 + i * 360 / this.numOfPike) * Math.PI / 180) * this.smallRad);

      this.posAnglesX.push(this.pos.x + Math.cos((this.angle - 20 + i * 360 / this.numOfPike) * Math.PI / 180) * this.smallRad);
      this.posAnglesX.push(this.pos.x + Math.cos((this.angle + i * 360 / this.numOfPike) * Math.PI / 180) * this.rad);
      this.posAnglesX.push(this.pos.x + Math.cos((this.angle + 20 + i * 360 / this.numOfPike) * Math.PI / 180) * this.smallRad);

    } //   0 [1] 2 3 [4] 5 6 [7] 8 9 [10] 11 12 [13] 14 ...

    this.isInScreen = false;
  }


  createCircle(ctx, x, y, rad, fill) {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, 2 * Math.PI);
    ctx.closePath();
    fill ? ctx.fill() : ctx.stroke();
    ctx.closePath();
  }

  createPolygon(ctx, posAnglesX, posAnglesY) {
    ctx.beginPath();
    ctx.moveTo(Math.floor(posAnglesX[0]), Math.floor(posAnglesY[0]));

    for (let i = 1; i < posAnglesX.length; i++) {
      ctx.lineTo(Math.floor(posAnglesX[i]), Math.floor(posAnglesY[i]));
    }

    ctx.fill();

    ctx.lineTo(Math.floor(this.posAnglesX[0]), Math.floor(this.posAnglesY[0]));
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.closePath();
  }



  drawEnemy(ctx) {

    if (this.upgrade == 1 && this.active) return;

    if (!this.active) {
      ctx.fillStyle = this.color;
      ctx.strokeStyle = "black";
      this.createPolygon(ctx, this.posAnglesX, this.posAnglesY);

      this.createCircle(ctx, Math.floor(this.pos.x), Math.floor(this.pos.y), this.smallRad - 3, true);

      ctx.fillStyle = this.mainColor;
      this.createCircle(ctx, Math.floor(this.pos.x), Math.floor(this.pos.y), this.buttonRad, true);
      this.createCircle(ctx, Math.floor(this.pos.x), Math.floor(this.pos.y), this.buttonRad, false);
    }

    else {
      ctx.fillStyle = this.mainColor;
      this.createCircle(ctx, Math.floor(this.pos.x), Math.floor(this.pos.y), this.rad, true);
    }
  }

  tripleExpl(ctx, config, enemies, index, color) {
    // Тройной взрыв

    if (this.count <= this.radOfExplosion) {
      this.count += this.explosionSpeed;

      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = color;
        this.createCircle(ctx, this.pos.x + this.count * Math.cos((this.angle + 120 * i) * Math.PI / 180), this.pos.y + this.count * Math.sin((this.angle + 120 * i) * Math.PI / 180), this.buttonRad, true);
      }

      return;
    }


    let j = 0;

    for (let i = 0; i < enemies.length; i++) { ////////// сделать взрывы не минами
      if (!enemies[i].isInScreen) {

        if (index == i) continue;

        let x1 = this.pos.x + 0.8 * this.radOfExplosion * Math.cos((this.angle + 120 * j) * Math.PI / 180);
        let y1 = this.pos.y + 0.8 * this.radOfExplosion * Math.sin((this.angle + 120 * j) * Math.PI / 180);
        j++;
        enemies[i] = new Mine(config, false, this.upgrade + 1, true, x1, y1);

        if (j >= 2) break;
      }
    }

    let x3 = this.pos.x + 0.8 * this.radOfExplosion * Math.cos((this.angle + 120 * j) * Math.PI / 180);
    let y3 = this.pos.y + 0.8 * this.radOfExplosion * Math.sin((this.angle + 120 * j) * Math.PI / 180);

    enemies[index] = new Mine(config, false, this.upgrade + 1, true, x3, y3);

  }

  checkPolygRound(polygon, round) { // Мина выкл - круг || Враг - Мина вкл

    // Функция проверки пересечения полигонов и кругов

    let dists = [];
    let minDist = dists[0] = Math.hypot(round.pos.x - polygon.posAnglesX[0], round.pos.y - polygon.posAnglesY[0]);
    let numOfMin = 0;
    let sumOfAngles = polygon.posAnglesX.length;

    for (let j = 1; j < sumOfAngles; j++) {

      dists[j] = Math.hypot(round.pos.x - polygon.posAnglesX[j], round.pos.y - polygon.posAnglesY[j]);

      if (dists[j] < minDist) {
        minDist = dists[j];
        numOfMin = j;
      }

    }

    if (minDist <= round.rad) {
      let option = polygon == this ? polygon.damageExpl(round) : round.damageExpl(polygon);
      return option;
    }

    // Если пересечение не очевидное, просчитываем пересечение с ребрами, разбивая ближайшее ребро на достаточно малые отрезки
    let nextNum = numOfMin < sumOfAngles - 1 ? numOfMin + 1 : 0;
    let prevNum = numOfMin > 0 ? numOfMin - 1 : sumOfAngles - 1;

    let secNum = dists[nextNum] < dists[prevNum] ? nextNum : prevNum;

    let pieces = 1 + Math.round(Math.hypot(polygon.posAnglesX[numOfMin] - polygon.posAnglesX[secNum], polygon.posAnglesY[numOfMin] - polygon.posAnglesY[secNum]) / 10);

    let pieceX = (polygon.posAnglesX[numOfMin] - polygon.posAnglesX[secNum]) / pieces;
    let pieceY = (polygon.posAnglesY[numOfMin] - polygon.posAnglesY[secNum]) / pieces;

    let middleX = [];
    let middleY = [];

    for (let j = 0; j < pieces; j++) {

      middleX[j] = polygon.posAnglesX[secNum] + j * pieceX;
      middleY[j] = polygon.posAnglesY[secNum] + j * pieceY;

      if (Math.hypot(middleX[j] - round.pos.x, middleY[j] - round.pos.y) <= round.rad) {
        let option = polygon == this ? polygon.damageExpl(round) : round.damageExpl(polygon);
        return option;
      }

    }

    return [0, 0, 0, 0];
  }


  checkOfCollision(units, isEnemies, index) { // Вызвать два раза (второй для врагов) если мина активирована

    //Проверка пересечения текущего объекта с остальными и предпринятие соответствующих действий

    let option = [0, 0, 0, 0];

    let markArr = [];
    let chInterf = 0;

    for (let i = 0; i < units.length; i++) {

      if (i == 0 && units[i].type == 'circle' && this.bigCircleDam) continue;

      if (index == i && isEnemies) continue;

      if (Math.abs(this.pos.x - units[i].pos.x) <= this.rad + units[i].rad &&
          Math.abs(this.pos.y - units[i].pos.y) <= this.rad + units[i].rad) {

        if (this.active && (units[i].type == 'circle' || units[i].type == 'tower') &&
            Math.hypot(this.pos.x - units[i].pos.x, this.pos.y - units[i].pos.y) <= this.rad + units[i].rad) {

          option = this.damageExpl(units[i]);

          if (i == 0 && units[i].type == 'circle') {
            this.bigCircleDam = true;
            chInterf = 1;
          }


          if (option[1] == 1) markArr.push(i);
        }

        else if (this.active && isEnemies && units[i].type != 'tower') {
          option = this.checkPolygRound(units[i], this);
          
          if (option[1] == 1) markArr.push(i);
          else if (option[1] == -1) units[i].active = true;
        }
        else if (!this.active && !isEnemies) {
          option = this.checkPolygRound(this, units[i]);

          if (option[3] == -1) return [0, 0, 0, 0];
        }


      }
    }

    markArr.sort((a, b) => b - a);

    option[0] = markArr;
    option[3] = chInterf;
    if (markArr.length >= 1) option[1] == 1;

    return option;

  }


  damageExpl(unit) {
    // Получаем результат взаимодействия мины и объекта
    let unitKilled = 0;
    let output = [];
    let extraValue = 0;

    if (!this.active) this.active = true, extraValue = -1;

    unit.health -= this.damage;

    if (unit.health <= 0) unitKilled = 1;
    else if (unit.type == "mine") unitKilled = -1;

    output = [0, unitKilled, 0, extraValue];

    return output;

  }

}