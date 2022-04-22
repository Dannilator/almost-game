export const config = {
  // Основополагающие данные
  w: 0,
  h: 0,
  bigDotRad: 35,
  defColor: 'rgba(250, 10, 30, 0.9)',
  dotMinRad: 6,
  dotMaxRad: 20,
  healthBigDot: 1000,
  massFactor: 0.002,
  maxCount: 150,
  maxCountEnemies: 100,
  mineRad: 30,
  stalkerRad: 30,
  mouseSize: 120,
  screenRange: 0,
  smooth: 0.65,
  sphereRad: 300,
  simpENColor: ["rgba(158, 143, 7, 0.9)",   // simple enemy
                "rgba(222, 11, 11, 0.9)",   // simple enemy
                "rgba(20, 30, 179, 0.9)",   // simple enemy
                "rgba(3, 87, 7, 0.9)"],     // simple enemy

  mineColor: ["rgba(128, 115, 4, 0.9)",     // mine
              "rgba(20, 30, 179, 0.9)",
              "darkgreen"],     // mine

  stalkerColor: ["rgba(177, 11, 155, 0.9)",
                 "rgba(103, 53, 202, 0.9)"],  // stalker

  lightTowColor: ["white",                  // lightning tower
                  "red",
                  "rgba(255, 255, 255, 0.03)"],                   // lightning tower

  enemyColor: ["rgba(158, 143, 7, 0.9)",  // simple enemy
                "rgba(222, 11, 11, 0.9)",  // simple enemy
                "rgba(20, 30, 179, 0.9)",  // simple enemy
                "rgba(3, 87, 7, 0.9)",  // simple enemy
                "rgba(128, 115, 4, 0.9)", // mine
                "rgba(20, 30, 179, 0.9)", // mine
                "rgba(177, 11, 155, 0.9)", // stalker
                "white",                // lightning tower
                "red"],                  // lightning tower
  vehicleBigCircle: 5,
  velToMouse: 7,
  visibilityRange: 0, // Значение определяется в init()
}