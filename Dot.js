export class Dot {
  constructor(config, r) {
    this.type = 'circle';
    this.pos = {x: config.w / 2 + (Math.random() * 2 - 1) * + (!r), y: config.h / 2 + (Math.random() * 2 - 1) * + (!r)};
    this.vel = {x: 0, y: 0};
    this.rad = r || Math.round(Math.random() * (config.dotMaxRad - config.dotMinRad) + config.dotMinRad);
    this.mass = this.rad * config.massFactor;
    this.color = config.defColor;
    this.health = r ? config.healthBigDot : this.rad - config.dotMinRad + 2;
    this.isInScreen = true;
  }

  isInScreenFun(rad, w, h) {
    //Проверка наличия объекта в пределах экрана
    return this.pos.x + rad > 0 && this.pos.x - rad < w && this.pos.y + rad > 0 && this.pos.y - rad < h;
  }


  createCircle(ctx, x, y, rad, fill) {
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, 2 * Math.PI);
    ctx.closePath();
    fill ? ctx.fill() : ctx.stroke();
    ctx.closePath();
  }
  
  draw(ctx, w, h, x, y) {
    this.pos.x = x || this.pos.x + this.vel.x;
    this.pos.y = y || this.pos.y + this.vel.y;

    let xDr = Math.floor(this.pos.x), yDr = Math.floor(this.pos.y);

    this.isInScreen = this.isInScreenFun(this.rad, w, h);
    if (!this.isInScreen) return;

    ctx.fillStyle = this.color;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    this.createCircle(ctx, xDr, yDr, this.rad, true);
    this.createCircle(ctx, xDr, yDr, this.rad, false);
  }
}