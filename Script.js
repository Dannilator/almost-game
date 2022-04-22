'use strict';

import {config} from './Config.js';
import {Dot} from './Dot.js';
import {SimpleEnemy} from './SimpleEnemy.js';
import {LightTower} from './LightTower.js';
import {Stalker} from './Stalker.js';
import {Mine} from './Mine.js';

// При работе с импортируемыми модулями использовался локальный сервер (в частости, я использовал Live Server в VS Code)
// Если хотите запустить игру без этого, перенесите все классы из других файлов сюда и уберите в HTML файле type="module"
(() => {

  // Примечание: Игра сделана полностью самостоятельно за исключением механики притяжения шаров,
  // которую я взял из туториала https://www.youtube.com/watch?v=KEQsm2yL6Lg&t=16s и создания молний на этом же канале

  // В этом и других файлах используется массив options и его аналоги. Он создан для упрощения реализации взаимодействия объектов.
  // Подробнее о нем в options.txt файле


  const TWO_PI = 2 * Math.PI;
  const canvas = document.getElementById("action");
  const ctx = canvas.getContext("2d");

  const canvasInterf = document.getElementById("interface");
  const ctxInt = canvasInterf.getContext("2d");

  const times = []; // Эти строчки для высчитывания fps
  let fps = 0;
  let fpstxt = document.getElementById("fps1");

  let pause = 0;
  let isPauseMenu = 0;
  let menu = document.getElementById("menu");


  // Массив клавиш передвижения
  const codes = ["KeyW", "KeyD", "KeyS", "KeyA"];

  let moves = [0, 0, 0, 0];

  // Для передвижения большого круга
  let moveX, moveY;
  
  let bigCircle, mouse, dots = [];
  let gravity = 0, haveTarget = false;


  let enemies = [];



  function updateDots() {
    // Просчитывается гравитационное взаимодействие юнитов

    for (let i = 1; i < dots.length; i++) {
      let acc = {x: 0, y: 0};
  
      for (let j = 0; j < dots.length; j++) {
        if (j == i) continue;
        let [a, b] = [dots[i], dots[j]];

        let delta = {x: b.pos.x - a.pos.x, y: b.pos.y - a.pos.y};
  
        let dist = Math.hypot(delta.x, delta.y) || 1;
        let force = (dist - config.sphereRad) / dist * b.mass;


        if (j == 0) {
          let alpha = config.mouseSize / dist;
          a.color = `rgba(250, 10, 30, ${alpha})`;
          dist < config.mouseSize ? force = (dist - config.mouseSize) * b.mass : force = a.mass;
        }
  
        acc.x += delta.x * force;
        acc.y += delta.y * force;
      }


      dots[i].vel.x = dots[i].vel.x * config.smooth + acc.x * dots[i].mass;
      dots[i].vel.y = dots[i].vel.y * config.smooth + acc.y * dots[i].mass;


      //////////

      let distToMouseX = 0, distToMouseY = 0;
      let distToMouse = 1;
      let sinM = 0, cosM = 0;

      // Притяжение при зажатой кнопке мыши
      if (haveTarget) {
        distToMouseX = dots[i].pos.x - mouse.x, distToMouseY = dots[i].pos.y - mouse.y;
        distToMouse = Math.hypot(distToMouseX, distToMouseY);
        sinM = distToMouseY / distToMouse;
        cosM = distToMouseX / distToMouse;
      }

      // Просчитывание притяжения при наличии отталкивания
      if (gravity) {
        let distToBigCX = dots[i].pos.x  - dots[0].pos.x, distToBigCY = dots[i].pos.y - dots[0].pos.y;
        let distToBigC = Math.hypot(distToBigCX, distToBigCY);

        let sinBC = distToBigCY / distToBigC, cosBC = distToBigCX / distToBigC;

        dots[i].vel.x = moveX + 0.5 * cosM * config.velToMouse + cosBC * 80 * dots[0].mass;
        dots[i].vel.y = moveY + 0.5 * sinM * config.velToMouse + sinBC * 80 * dots[0].mass;
      }
      else {
        dots[i].vel.x = moveX + dots[i].vel.x * config.smooth + acc.x * dots[i].mass - cosM * config.velToMouse;
        dots[i].vel.y = moveY + dots[i].vel.y * config.smooth + acc.y * dots[i].mass - sinM * config.velToMouse;
      }

      if (Math.hypot(dots[i].pos.x - bigCircle.x, dots[i].pos.y - bigCircle.y) > config.visibilityRange) dots.splice(i, 1);
    }


    // [bigCircle.x, bigCircle.y] = [moveX, moveY];

    ctx.strokeStyle = config.defColor;

    dots.map(e => e == dots[0] ? e.draw(ctx, config.w, config.h, bigCircle.x, bigCircle.y) : e.draw(ctx, config.w, config.h));

    //dots.forEach((e, index) => checkOfCollision(e, index));
  }



  function movingCircle() {
    // Перемещение игрока, когда зажаты клавиши движения

    let diag = moves[1] - moves[3] != 0 && moves[2] - moves[0] != 0 ? 0.707 : 1;

    moveX = diag * config.vehicleBigCircle * (moves[3] - moves[1]);
    moveY = diag * config.vehicleBigCircle * (moves[0] - moves[2]);
  }


  function updateEnemies() {

    if (moveX != 0 || moveY != 0) {
      // Перемещение врагов относительно игрока
      enemies.map(e => {
        e.pos.x += moveX;
        e.pos.y += moveY;

        if (e.type != 'tower') {
          e.posAnglesX = e.posAnglesX.map(a => a += moveX);
          e.posAnglesY = e.posAnglesY.map(a => a += moveY);
        }

      });
    }

    let changeInterf = 0;

    // Проверяются взаимодействия между врагами и юнитами игрока, а также между минами и врагами
    for (let i = 0; i < enemies.length; i++) {

      enemies[i].isInScreen = funInScreen(enemies[i], enemies[i].maxLength || enemies[i].rad);

      let options = [], optionsEn = [];

      if (enemies[i].type == "mine" && enemies[i].active) {
        // Взаимодействие активированной мины с юнитами игрока и врагами

        if (enemies[i].upgrade == 1) {
          enemies[i].tripleExpl(ctx, config, enemies, i, config.mineColor[1]);
          continue;
        }

        optionsEn = enemies[i].checkOfCollision(enemies, 1, i);
        options = enemies[i].checkOfCollision(dots, 0, i);

        enemies[i].rad += enemies[i].explosionSpeed;
        if (enemies[i].rad >= enemies[i].radOfExplosion) options[2] = 1;

        if (optionsEn[1] == 1) {
          for(let k = 0; k < optionsEn[0].length; k++) {
            createEnemy(typeEnemy(), optionsEn[0][k], false);
          }
        }
      }
      // Взаимодействие игрока и врагов в остальных случаях
      else options = enemies[i].checkOfCollision(dots);


      let optionDamByTower = [];

      if (options[1] == 1) {

        if (options[0] == 0) {
          dots[0].health = 0;
          dots[0].rad /= 2;
        }
        else if (enemies[i].type == "mine") {

          if (options[0].length != 0) {

            for(let k = 0; k < options[0].length; k++) {
              if (options[0][k] == 0) {
                dots[0].health = 0;
                dots[0].rad /= 2;
              }

              dots.splice(options[0][k], 1);
            }
          }
        }
        else dots.splice(options[0], 1);
      }

      if (options[3] == 1) changeInterf++;

      if (options[4] == 1 && enemies[i].type == 'stalker') enemies[i].divide(config, enemies, i);

      /////////////////////// Взаимодействие электробашни и юнитов игрока
      if (enemies[i].type == 'tower') {
        optionDamByTower = enemies[i].chooseToAttack(ctx, dots);

        for (let j = 0; j < optionDamByTower.length / 3; j++) {
          if (optionDamByTower[j * 3 + 1] == 1) {

            if (optionDamByTower[j * 3] != 0) dots.splice(optionDamByTower[j * 3], 1);
            else {
              dots[0].health = 0;
              dots[0].rad /= 2;
            }

          if (optionDamByTower[j * 3 + 2] == 1) changeInterf++;
          }
        }
      }

      

      if (enemies[i].type == 'stalker' && (Math.hypot(enemies[i].pos.x - bigCircle.x, enemies[i].pos.y - bigCircle.y) <= enemies[i].visionRad || enemies.active)) {
        enemies[i].move(directionToCenter(enemies[i].pos.x, enemies[i].pos.y));
        //Движение сталкера к игроку
      }

      if (options[2] == 1 && options[4] != 1) createEnemy(typeEnemy(), i, false);

      ////////////////////////

      Math.hypot(enemies[i].pos.x - bigCircle.x, enemies[i].pos.y - bigCircle.y) <= config.visibilityRange ? enemies[i].isInScreen ? enemies[i].drawEnemy(ctx) : {} : createEnemy(typeEnemy(), i, false);

      // Изменение интерфейса (полосы здоровья) в случае потери здоровья
      if (changeInterf > 0) makeInterface();

    }

  }


  function typeEnemy() {
    // Выбор типа случайных врагов
    let chOfEnemy = Math.random();

    // 1 : 2 : 2 : 3 : 4 : 5 : 6

    if (chOfEnemy <= 0.261) return 3;
    else if (chOfEnemy <= 0.478) return 4;
    else if (chOfEnemy <= 0.652) return 5;
    else if (chOfEnemy <= 0.783) return 6;
    else if (chOfEnemy <= 0.87) return 1;   // Мина
    else if (chOfEnemy <= 0.957) return 2;   // Преследователь
    else if (chOfEnemy <= 1) return 7;   // Турель
  }


  function createEnemy(type, index, isInit) {

    switch (type) {
      case 1:
        enemies[index] = new Mine(config, isInit);
        break;

      case 2:
        enemies[index] = new Stalker(config, Math.floor(random(1, 3.1)), Math.floor(random(1, 5)));
        break;

      case 7:
        enemies[index] = new LightTower(config);
        break;

      default:
        enemies[index] = new SimpleEnemy(config, type, isInit);
        break;
    }
  }


  function funInScreen(element, rad) {
    // Проверка наличия объектов в пределах экрана, чтобы не отрисовывать то, что не нужно и для некоторых других механик
    return element.pos.x + rad > 0 && element.pos.x - rad < config.w && element.pos.y + rad > 0 && element.pos.y - rad < config.h;
  } 

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }


  /////////////////////
  function makeInterface() {
    // Отрисовка полосы здоровья

    ctxInt.clearRect(0, 0, config.w, config.h);
    ctxInt.fillStyle = "rgba(22, 135, 14, 0.8)";
    ctxInt.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctxInt.lineWidth = 4;

    ctxInt.stroke();

    ctxInt.fillRect(config.w / 2 - 35, config.h / 2 + 50, 70 * (dots[0].health / config.healthBigDot), 16);
    ctxInt.strokeRect(config.w / 2 - 35, config.h / 2 + 50, 70, 16);

  }
  ////////////////////////////

  function init() {
    // Инициализация игры
    config.w = canvas.width = canvasInterf.width = innerWidth;
    config.h = canvas.height = canvasInterf.height = innerHeight;

    config.screenRange = Math.hypot(config.w / 2, config.h / 2);
    config.visibilityRange = 2 * config.screenRange;

    mouse = {x: 0, y: 0};

    bigCircle = {x: config.w / 2, y: config.h / 2, down: false};


    dots.push(new Dot(config, config.bigDotRad));

    for (let i = 0; i < config.maxCountEnemies; i++) {
      createEnemy(typeEnemy(), i, true);
    }

    makeInterface();
  }

  function loop() {

    if (pause != 1) {
      isPauseMenu = 0;
      ///////////////////// FPS
      const now = performance.now();
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }
      times.push(now);
      fps = times.length;
      fpstxt.innerHTML = fps;
      /////////////////////////


      ctx.clearRect(0, 0, config.w, config.h);

      if (bigCircle.down && dots.length <= config.maxCount) dots.push(new Dot(config));

      movingCircle();

      updateDots();

      updateEnemies();
    }
    else if (!isPauseMenu) {
      menu.style.display = "block";
      
      ctx.lineWidth = 12;
      ctx.strokeStyle = "white";

      ctx.beginPath();
      ctx.arc(bigCircle.x, bigCircle.y, 100, 0, 2 * Math.PI);

      ctx.moveTo(bigCircle.x - 30, bigCircle.y + 50);
      ctx.lineTo(bigCircle.x - 30, bigCircle.y - 50);
      
      ctx.moveTo(bigCircle.x + 30, bigCircle.y + 50);
      ctx.lineTo(bigCircle.x + 30, bigCircle.y - 50);

      ctx.stroke();
      ctx.closePath();

      isPauseMenu = 1;
    }
    
    window.requestAnimationFrame(loop);
  }

  init();
  loop();



  function directionToCenter(posX, posY) {

    let cosEl = -(posX - bigCircle.x) / Math.hypot(posX - bigCircle.x, posY - bigCircle.y);
    let arcCos;

    arcCos = Math.acos(cosEl);

    if (posY > bigCircle.y) arcCos *= -1;

    return arcCos;
  }

  function keys(event) {

    if (event.code == "Space") {
      bigCircle.down = event.type == "keydown" ? true : false;
    }

    if (event.code == "KeyX") {
      gravity = event.type == "keydown" ? 1 : 0;
    }

    if (event.code == "Enter") {
      pause = event.type == "keyup" ? !pause : pause;
      menu.style.display = "none";

    }

    else {
      for (let i = 0; i < codes.length; i++) {
        if (event.code == codes[i]) {
          moves[i] = +(event.type == "keydown");
        }
      }
    }

  }


  function setPos({layerX, layerY}) {
    [mouse.x, mouse.y] = [layerX, layerY];
  }

  function target({layerX, layerY}) {

    haveTarget = true;

    [mouse.x, mouse.y] = [layerX, layerY];

    dots[0].mass = 0;

    canvasInterf.addEventListener("mousemove", setPos);
    canvasInterf.removeEventListener("mousedown", target);
  }

  function afterTarget() {

    haveTarget = false;

    dots[0].mass = dots[0].rad * config.massFactor;


    canvasInterf.removeEventListener("mousemove", setPos);
    canvasInterf.addEventListener("mousedown", target);
  }


  window.addEventListener("keydown", keys);
  window.addEventListener("keyup", keys);

  canvasInterf.addEventListener("mousedown", target);
  canvasInterf.addEventListener("mouseup", afterTarget);


})();