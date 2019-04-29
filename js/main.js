import Player     from './player/index'
import Enemy      from './npc/enemy'
import BackGround from './runtime/background'
import GameInfo   from './runtime/gameinfo'
import Music      from './runtime/music'
import DataBus    from './databus'

let ctx   = canvas.getContext('2d')
let databus = new DataBus()
let mechineStatus = '';
//自定义数据，暂存
let challengeItem = {
  movement: ['up', 'down', 'left', 'right', 'left-rotation', 'right-rotation'],   //动作
  timeDuration: [2, 3, 4, 3, 5, 4] //持续时间，单位：秒，需大于1s，在0.5秒前提醒下一个动作，第一个动作需要大于1s
}
let movementIndex = 0;
//初始状态与正北方向夹角
let angleToNorth
/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    //游戏主入口
    this.getReady();

    // 维护当前requestAnimationFrame的id
    this.aniId    = 0

    //this.restart()
  }

  restart() {
    databus.reset()

    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )

    this.bg       = new BackGround(ctx)
    this.player   = new Player(ctx)
    this.gameinfo = new GameInfo()
    this.music    = new Music()

    this.bindLoop     = this.loop.bind(this)
    this.hasEventBind = false

    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId);

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  /**
   * 随着帧数变化的敌机生成逻辑
   * 帧数取模定义成生成的频率
   */
  enemyGenerate() {
    if ( databus.frame % 30 === 0 ) {
      let enemy = databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(6)
      databus.enemys.push(enemy)
    }
  }

  // 全局碰撞检测
  collisionDetection() {
    let that = this

    databus.bullets.forEach((bullet) => {
      for ( let i = 0, il = databus.enemys.length; i < il;i++ ) {
        let enemy = databus.enemys[i]

        if ( !enemy.isPlaying && enemy.isCollideWith(bullet) ) {
          enemy.playAnimation()
          that.music.playExplosion()

          bullet.visible = false
          databus.score  += 1

          break
        }
      }
    })

    for ( let i = 0, il = databus.enemys.length; i < il;i++ ) {
      let enemy = databus.enemys[i]

      if ( this.player.isCollideWith(enemy) ) {
        databus.gameOver = true

        break
      }
    }
  }

  // 游戏结束后的触摸事件处理逻辑
  touchEventHandler(e) {
     e.preventDefault()

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    let area = this.gameinfo.btnArea

    if (   x >= area.startX
        && x <= area.endX
        && y >= area.startY
        && y <= area.endY  )
      this.restart()
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.bg.render(ctx)

    databus.bullets
          .concat(databus.enemys)
          .forEach((item) => {
              item.drawToCanvas(ctx)
            })

    this.player.drawToCanvas(ctx)

    databus.animations.forEach((ani) => {
      if ( ani.isPlaying ) {
        ani.aniRender(ctx)
      }
    })

    this.gameinfo.renderGameScore(ctx, databus.score)

    // 游戏结束停止帧循环
    if ( databus.gameOver ) {
      this.gameinfo.renderGameOver(ctx, databus.score)

      if ( !this.hasEventBind ) {
        this.hasEventBind = true
        this.touchHandler = this.touchEventHandler.bind(this)
        canvas.addEventListener('touchstart', this.touchHandler)
      }
    }
  }

  // 游戏逻辑更新主函数
  update() {
    if ( databus.gameOver )
      return;

    this.bg.update()

    databus.bullets
           .concat(databus.enemys)
           .forEach((item) => {
              item.update()
            })

    this.enemyGenerate()

    this.collisionDetection()

    if ( databus.frame % 20 === 0 ) {
      this.player.shoot()
      this.music.playShoot()
    }
  }

  // 实现游戏帧循环
  loop() {
    databus.frame++

    this.update()
    this.render()

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  /**
   * 提示用户调整设备状态直到设备水平
   */
  getReady() {
    var that = this
    // that.ff4().then(function(va){
    //   console.log(va)
    //   wx.showModal({
    //     title:'title',
    //     content:'try again',
    //     success(res){
    //       if(res.confirm){
    //         that.getReady()
    //       }else if(res.cancel){
    //         console.log('exit')
    //       }
    //     }
    //   })
    // })
    //test
    let timeStart = new Date().getTime();
    that.ff5().then(function(va){
      console.log(va)

      wx.showModal({
        title: 'success',
        content: 'try again',
        success(res){
          if(res.confirm){
            that.getReady()
          }else if(res.cancel){
            console.log('cancel')
          }
        }
      })
    },
    function(re){
      console.log(re)
      // that.getReady()
      wx.showModal({
        title: 'error',
        content: 'try again',
        success(res){
          if(res.confirm){
            that.getReady()
          }else if(res.cancel){
            console.log('cancel')
          }
        }
      })
    })

    //that.ff3()
    //setTimeout(that.ff3, 15000);

    //*/

    /*
    let timeStart = new Date().getTime();
    console.log('getReady function')
    that.devicePositionAdjust(timeStart, 0).then(
      function (value) {
        console.log('value is ', value)
        console.log("ready to play")
        //生成随机动作列表
        wx.showModal({
          title: '提示',
          content: '开始游戏',
          success(res){
            if(res.confirm){
              challengeItem = that.getMovementList(8)
              console.log('challengeItem is ', challengeItem)
              that.startMyGame()
            }else if(res.cancel){
              console.log('cancel')
              //TODO: 返回游戏主界面
            }
          }
        })
      },
      function (reason) {
        //TODO: 用户选择重新调整设备或退出游戏返回主界面
        console.log('reason is ', reason)
        //that.getReady()
        wx.showModal({
          title: "提示",
          content: "请重新调整状态",
          success(res) {
            if (res.confirm) {
              console.log('adjust device again')
              that.getReady()
            } else if (res.cancel) {
              console.log('cancel')
              //TODO: 返回游戏主界面
            }
          }
        })
      }
    )//*/
  }

  // test function
  ff3(){
    let showNum = 0           //总检测次数
    let posiResult;
    console.log('begin, showNum is ', showNum)
    //let p1 = new Promise(function(resolve, reject){
      if(wx.startDeviceMotionListening){
        wx.startDeviceMotionListening({
          interval: 'normal',
          success: function(res){
            console.log('start motion')
            console.log(res);

            let changeItem = 0;
            console.log('at beginning changeItem is ', changeItem)
            wx.onDeviceMotionChange(function(res){
              changeItem++
              console.log(changeItem)

              if(changeItem >= 100){   //  如果连续两次状态合适或时间大于maxNum*2，则结束调整

                wx.stopDeviceMotionListening({
                  fail: function(res){
                    console.log('stop function failed ', res)
                  },
                  success: function(res){
                    console.log("stop device motion listening")
                    console.log("changeItem is " + changeItem)
                    //手机调整时间不能超过10秒
                    //return false
                    showNum = 0
                    posiResult = false
                    console.log('error, changeItem is ', changeItem)
                    //reject(posiResult)
                    
                  }
                })
              }
            })
          },
          fail: function(res){
            console.log('can\'t use deviceMotion')
            posiResult = false
            showNum++
            console.log('fail, showNum is ', showNum)
            //reject(posiResult)
          }
        })
      }
    //})
    //return p1
  }
  ff4(){
    let pp = new Promise(function(resolve, reject){
      let te = 8
      while(te<15){
        te++
        
      }
      console.log('te:' ,te)
      resolve(te)
    })
    return pp
  }

  ff(){
    let pp = new Promise(function(resolve, reject){
      let te = 8
      setTimeout(function(){
        console.log('settimeout')
        let aa = Math.random()
        if(aa<0.5){
          te = te-1
          resolve(te)
        }else{
          te = te+1
          reject(te)
        }
        //resolve('success')
      }, 2000)
    })
    return pp
  }


  ff2(timeStart){
    let showNum = 0           //总检测次数
    let readyNum = 0          //连续两次检测状态正确
    let angleToNorthTemp = 0.0    //与正北方向夹角
    let maxNum = 4            //总检测次数不超过5次，每次检测时间间隔在下面定义
    let posiResult;
    //let changeNum = 0         //记录状态改变次数
    console.log('begin, showNum is ', showNum)
    let p1 = new Promise(function(resolve, reject){
      if(wx.startDeviceMotionListening){
        wx.startDeviceMotionListening({
          interval: 'normal',
          success: function(res){
            console.log('start motion')
            console.log(res);
            //let showNum = 0
            let changeItem = 0;
            console.log('at beginning changeItem is ', changeItem)
            wx.onDeviceMotionChange(function(res){
              changeItem++
              console.log(changeItem)
              //console.log('heeh  showNum is ', showNum)
              //changeNum++;
              //console.log(changeNum)
              //每两秒输出一次坐标状态

                if(changeItem >= 100){   //  如果连续两次状态合适或时间大于maxNum*2，则结束调整
                  //TODO : 需要记录水平角度，即与正北方向夹角
                  //console.log("readyNum is " +readyNum)
                  //20190424 put the judge of showNum into stopDeviceMotionListening's callback function
                  //20190424 the stopDeviceMotionListen() always fail in IOS, whether it will success or
                  //not on Android is not clear
                  wx.stopDeviceMotionListening({
                    fail: function(res){
                      console.log('stop function failed ', res)
                    },
                    success: function(res){
                      console.log("stop device motion listening")
                      console.log("changeItem is " + changeItem)
                      //手机调整时间不能超过10秒
                      //return false
                      showNum = 0
                      changeItem=0
                      posiResult = false
                      console.log('error, changeItem is ', changeItem)
                      reject(posiResult)
                      
                    }
                  })
                  
                }
              
            })
          },
          fail: function(res){
            console.log('can\'t use deviceMotion')
            posiResult = false
            showNum++
            console.log('fail, showNum is ', showNum)
            reject(posiResult)
          }
        })
      }
    })
    return p1
  }

  ff5(){
    let showNum = 0           //总检测次数
    let readyNum = 0          //连续两次检测状态正确
    let angleToNorthTemp = 0.0    //与正北方向夹角
    let maxNum = 4            //总检测次数不超过5次，每次检测时间间隔在下面定义
    let posiResult;
    //let changeNum = 0         //记录状态改变次数
    console.log('begin, showNum is ', showNum)
    let p1 = new Promise(function(resolve, reject){
      if(wx.startDeviceMotionListening){
        wx.startDeviceMotionListening({
          interval: 'normal',
          success: function(res){
            console.log('start motion')
            console.log(res);
            //let showNum = 0
            let changeItem = 0;
            console.log('at beginning changeItem is ', changeItem)
            let temp = Math.random()
            if(temp>0.001){
              wx.stopDeviceMotionListening({
                fail: function(res){
                  console.log(res)
                  reject(temp)
                },
                success: function(res){
                  console.log(res)
                  reject(temp)
                }
              })
            }

          },
          fail: function(res){
            console.log('can\'t use deviceMotion')
            posiResult = false
            showNum++
            console.log('fail, showNum is ', showNum)
            reject(posiResult)
          }
        })
      }
    })
    return p1
  }

  /**
   * 游戏开始函数
   */
  startMyGame = () => {
    console.log('game start')
    var that = this;
    let timeStart = new Date().getTime();
    that.showNextMovement(challengeItem.movement[movementIndex]);
    //第一个动作0.5s后检测，以后的动作因为是提前0.5s显示，所以1s后检测状态
    if (movementIndex == 0) {
      setTimeout(that.getMechineStatus, 500);
      timeStart = new Date().getTime();
      //that.getDecivePosi(timeStart) //test line
    } else {
      setTimeout(that.getMechineStatus, 1000);
    }
  }

  /**
   * 获取设备当前状态，返回状态值
   */
  getMechineStatus = () => {
    //console.log(this)
    //console.log(this.fun)
    //
    /*
    if (wx.startGyroscope) {      //判断api是否可用
      wx.startGyroscope({
        interval: 'game',
        success: function (res) {
          console.info('success' + res);
          wx.onGyroscopeChange(function (res) {
            console.log(res);
          })
        },
        fail: function (res) {
          console.log('fail to call gyroscope');
        }
      })
    } else {
      console.log('can\'t use gyroscope')
    }*/
    var status_record = []
    var temp_i = 0
    if(wx.startDeviceMotionListening){
      wx.startDeviceMotionListening({
        interval: 'normal',
        success: function(res){
          console.log(res);
          //TODO: 收集三次状态，求平均值，normal模式0.2s输出一次，因此持续收集0.6s状态
          if(temp_i<3){
            status_record.push(res)
            temp_i++
          }else{
            wx.stopDeviceMotionListening
          }
          //wx.onDeviceMotionChange(function(res){
            //每两秒输出一次坐标状态
            //if()
            //console.log(res);
          //})
          //wx.stopDeviceMotionListening();
        },
        fail: function(res){
          console.log('can\'t use deviceMotion')
        }
      })
    }else{
      console.log('don\'t have device Motion')
    }

    //TODO: 如何获取设备状态？
    let temp = ['up', 'don', 'left', 'right', 'left-down', 'right-dow'];
    //console.log(temp);
    //mechineStatus = temp[movementIndex];
    
    //test
    status_record = [[90, -89, 90],[89, -91,91],[91,-90,89]]
    angleToNorth = 30;

    let status_res = this.meanAngle(status_record)
    mechineStatus = this.angleToStatus(challengeItem.movement[movementIndex], status_res, angleToNorth)
    console.log('status_res is ', status_res)
    console.log('mechineStatus is ', mechineStatus)

    //if (mechineStatus == challengeItem.movement[movementIndex]) {
    if (mechineStatus) {
      console.log('well done ' + movementIndex);
      if (movementIndex == challengeItem.movement.length - 1) {
        console.log('Congratulations! You win!');
        return;
      }
      //console.log(this.startMyGame)
      setTimeout(this.startMyGame, (challengeItem.timeDuration[movementIndex] - 1) * 1000);//每个动作0.5s后检测状态，又提前0.5s显示下一个动作
      movementIndex = movementIndex + 1;    //指向下一个动作
    } else {
      console.log('game over! ' , challengeItem.timeDuration.length - movementIndex, 'movements left');
      return;
    }


    //return 'up';
  }

  /**
   * 页面显示下一个动作
   * @param {string} movement 需要显示的动作
   */
  showNextMovement(movement) {
    console.log('next movement is ' + movement);
    this.showMsg('next is ' + movement)
    //this.timeInverval();
  }

  timeSleep() {
    console.log('time sleep');
  }

  timeInverval(){
    let dat = new Date().getTime()
    console.log(dat)
  }

  /**
   * 获取手机姿势--test function
   * @param {number} timeStart 游戏开始时间
   */
  getDecivePosi(timeStart){
    //let a = 0.3244;
    //console.log('a is ' ,a.toFixed(2))
    if(wx.startDeviceMotionListening){
      wx.startDeviceMotionListening({
        interval: 'normal',
        success: function(res){
          console.log(res);
          wx.onDeviceMotionChange(function(res){
            //每两秒输出一次坐标状态
            let dateNow = new Date().getTime()
            if(dateNow - timeStart > 2 * 1000){
              timeStart = dateNow;
              console.log(res.alpha.toFixed(2), res.beta.toFixed(2), res.gamma.toFixed(2));
            }
            //console.log(res);
          })
          //wx.stopDeviceMotionListening();
        },
        fail: function(res){
          console.log('can\'t use deviceMotion')
        }
      })
    }else{
      console.log('don\'t have device Motion')
    }
  }

/**
   * 游戏开始前调整手机姿势
   * @param {number} timeStart 游戏开始时的时间
   * @returns true 10秒内调整成功
   * @returns false 10秒内调整失败
   */
  devicePositionAdjust(timeStart, showNumber){
    console.log("请调整手机姿势至平放") //不需要指北
    let showNum = showNumber           //总检测次数
    let readyNum = 0          //连续两次检测状态正确
    let angleToNorthTemp = 0.0    //与正北方向夹角
    let maxNum = 5            //总检测次数不超过5次，每次检测时间间隔在下面定义
    let posiResult;
    //let changeNum = 0         //记录状态改变次数
    console.log('begin, showNum is ', showNum)
    let p1 = new Promise(function(resolve, reject){
      if(wx.startDeviceMotionListening){
        wx.startDeviceMotionListening({
          interval: 'normal',
          success: function(res){
            console.log('start motion')
            console.log(res);
            showNum = 0
            let changeItem = 0;
            wx.onDeviceMotionChange(function(res){
              //changeItem++
              //console.log(changeItem)
              //console.log('heeh  showNum is ', showNum)
              //changeNum++;
              //console.log(changeNum)
              //每两秒输出一次坐标状态
              let dateNow = new Date().getTime()
              if(dateNow - timeStart > 2 * 1000){   //每2秒检测一次
                timeStart = dateNow;
                showNum = showNum+1
                console.log('++ showNum is ', showNum)
                console.log(res.alpha.toFixed(2), res.beta.toFixed(2), res.gamma.toFixed(2));
                // console.log(Math.abs(res.gamma.toFixed(2)))
                // console.log(Math.abs(res.beta.toFixed(2)))
                if(Math.abs(res.gamma.toFixed(2)) <10 && Math.abs(res.beta.toFixed(2))<10){ //左右和俯仰状态正常
                  console.log("now position is ok")
                  readyNum++
                  angleToNorthTemp+=res.alpha;
                }  
                
                //如果以下判断写在wx.onDeviceMotionChange()以外，可能会多执行一次，造成错误
                //而且这个函数是异步的，在函数外不能得到改变的参数，如showNum，readNum等
                if(readyNum>1 || showNum >= maxNum){   //  如果连续两次状态合适或时间大于maxNum*2，则结束调整
                  //TODO : 需要记录水平角度，即与正北方向夹角
                  //console.log("readyNum is " +readyNum)
                  //20190424 put the judge of showNum into stopDeviceMotionListening's callback function
                  //20190424 the stopDeviceMotionListen() always fail in IOS, whether it will success or
                  //not on Android is not clear
                  wx.stopDeviceMotionListening({
                    fail: function(res){
                      console.log('stop function failed ', res)
                    },
                    success: function(res){
                      console.log("stop device motion listening")
                      console.log("showNum is " + showNum)
                      //手机调整时间不能超过10秒
                      if(showNum<5){
                        console.log("请保持此状态")
                        angleToNorth = angleToNorthTemp / readyNum
                        console.log("readyNum is " + readyNum)
                        console.log("device position OK and angleToNorth is " + angleToNorth)
                        //return true   //！！！此处return没有意义，因为这是一个嵌套的函数，并不是devicePositionAdjust
                        posiResult = true
                        resolve(posiResult)
                      }else if(showNum >= maxNum){
                        //return false
                        posiResult = false
                        console.log('error, showNum is ', showNum)
                        reject(posiResult)
                      }
                    }
                  })
                  
                }
              }
              //console.log(res);
            })
            //wx.stopDeviceMotionListening();
          },
          fail: function(res){
            console.log('can\'t use deviceMotion')
            posiResult = false
            showNum++
            console.log('fail, showNum is ', showNum)
            reject(posiResult)
          }
        })
      }else{
        console.log('don\'t have device Motion')    //微信版本低，不存在此API
        posiResult = false
        reject(posiResult)
        //TODO: 要区分是因为超时，还是因为设备不支持，还是因为微信版本低。
      }
    })
    console.log('end of adjust')
    return p1
  }

  /**
   * 游戏开始前调整手机姿势
   * @param {number} timeStart 游戏开始时的时间
   * @returns true 10秒内调整成功
   * @returns false 10秒内调整失败
   */
  devicePositionAdjust_20190423(timeStart){
    console.log("请调整手机姿势至平放") //不需要指北
    let showNum = 0           //总检测次数
    let readyNum = 0          //连续两次检测状态正确
    let angleToNorthTemp = 0.0    //与正北方向夹角
    let maxNum = 5            //总检测次数不超过5次，每次检测时间间隔在下面定义
    let posiResult;
    //let changeNum = 0         //记录状态改变次数
    console.log('begin, showNum is ', showNum)
    let p1 = new Promise(function(resolve, reject){
      if(wx.startDeviceMotionListening){
        wx.startDeviceMotionListening({
          interval: 'normal',
          success: function(res){
            console.log(res);
            let showNum = 0
            let changeItem = 0;
            wx.onDeviceMotionChange(function(res){
              changeItem++
              console.log(changeItem)
              console.log('heeh  showNum is ', showNum)
              //changeNum++;
              //console.log(changeNum)
              //每两秒输出一次坐标状态
              let dateNow = new Date().getTime()
              if(dateNow - timeStart > 2 * 1000){   //每2秒检测一次
                timeStart = dateNow;
                showNum++
                console.log('++ showNum is ', showNum)
                console.log(res.alpha.toFixed(2), res.beta.toFixed(2), res.gamma.toFixed(2));
                // console.log(Math.abs(res.gamma.toFixed(2)))
                // console.log(Math.abs(res.beta.toFixed(2)))
                if(Math.abs(res.gamma.toFixed(2)) <10 && Math.abs(res.beta.toFixed(2))<10){ //左右和俯仰状态正常
                  console.log("now position is ok")
                  readyNum++
                  angleToNorthTemp+=res.alpha;
                }  
                
                //如果以下判断写在wx.onDeviceMotionChange()以外，可能会多执行一次，造成错误
                //而且这个函数是异步的，在函数外不能得到改变的参数，如showNum，readNum等
                if(readyNum>1 || showNum >= maxNum){   //  如果连续两次状态合适或时间大于maxNum*2，则结束调整
                  //TODO : 需要记录水平角度，即与正北方向夹角
                  //console.log("readyNum is " +readyNum)
                  wx.stopDeviceMotionListening()
                  console.log("stop device motion listening")
                  console.log("showNum is " + showNum)
                  //手机调整时间不能超过10秒
                  if(showNum<5){
                    console.log("请保持此状态")
                    angleToNorth = angleToNorthTemp / readyNum
                    console.log("readyNum is " + readyNum)
                    console.log("device position OK and angleToNorth is " + angleToNorth)
                    //return true   //！！！此处return没有意义，因为这是一个嵌套的函数，并不是devicePositionAdjust
                    posiResult = true
                    resolve(posiResult)
                  }else if(showNum >= maxNum){
                    //return false
                    posiResult = false
                    console.log('error, showNum is ', showNum)
                    reject(posiResult)
                  }
                }
              }
              //console.log(res);
            })
            //wx.stopDeviceMotionListening();
          },
          fail: function(res){
            console.log('can\'t use deviceMotion')
            posiResult = false
            showNum++
            console.log('fail, showNum is ', showNum)
            reject(posiResult)
          }
        })
      }else{
        console.log('don\'t have device Motion')    //微信版本低，不存在此API
        posiResult = false
        reject(posiResult)
        //TODO: 要区分是因为超时，还是因为设备不支持，还是因为微信版本低。
      }
    })
    return p1
  }

  /**
   * 判断设备状态是否正确
   * @param {*} movement 当前动作
   * @param {*} angle 当前设备状态
   * @param {*} angleToNorth 设备初始状态与正北方向夹角
   * @returns true 状态正确
   * @returns false 状态错误，结束游戏
   */
  angleToStatus(movement, angle, angleToNorth){
    if(movement == "left" && Math.Math.abs(angle[2]-90) < 10){  
      return true
    }else if(movement == "right" && Math.abs(angle[2]+90) < 10){
      return true
    }else if(movement == "up" && Math.abs(angle[1] + 90 ) < 10){
      return true
    }else if(movement == "down" && Math.abs(angle[1] - 90) < 10){
      return true
    }else if(movement == "left_rotation" && (Math.abs(angle[0] - angleToNorth +90)<10 ||Math.abs(angle[0]-angleToNorth-270)<10)){
      return true
    }else if(movement == "right_rotation"&&(Math.abs(angle[0]-angleToNorth-90)<10 || Math.abs(angle[0]-angleToNorth+270)<10)){
      return true
    }else{
      return false
    }
  }

  /**
   * 显示交互信息
   * @param {*} msg 显示信息
   */
  showMsg(msg){
    wx.showToast({
      title: msg,
      icon: "none",
      duration: 1000
    })
  }

  /**
   * 计算状态均值
   * @param {*} angleBox 状态记录
   * @returns {*} res 均值
   */
  meanAngle(angleBox){
    let res = []
    for(let i = 0; i< 3; i++){
      let temp = 0.0
      for(let j = 0; j< angleBox.length; j++){
        temp+=angleBox[j][i]
      }
      temp= temp/angleBox.length
      res.push(temp)
    }
    return res
  }

  /**
   * 生成指定长度的随机动作列表
   * @param {number} num 包含动作个数
   * @returns {list} movementList, timeDurationList 动作列表及相应的持续时间列表
   */
  getMovementList(num){
    let movementSet = ['up', 'down', 'left', 'right', 'left-rotation', 'right-rotation']
    let movementList = []
    let timeDurationList = []

    //动作不超过10，时间最短2s，且不超过6s
    let max_movement = 10;
    let max_timeDuration = 6;

    for(let i = 0; i < num; i++){
      //得到一个0-5之间的随机数，整数，且包含0和5
      let moveRandom = Math.floor(Math.random() * 6)
      let timeRandom = Math.floor(Math.random() * 5) + 2 //时间在2-6s
      movementList.push(movementSet[moveRandom])
      timeDurationList.push(timeRandom)
    }
    
    let challengeItem = {
      movement: movementList,
      timeDuration: timeDurationList
    }
    console.log(movementList)
    console.log(timeDurationList)
    return challengeItem
  }

  // function f1(){
  //   this.f2().then(
  //     function(value){
  //           console.log(value)	
  // },function(reason){
  // console.log(reason)
  // this.f1()
  // })
  // }
  
  // function f2(){
  //   let a = 0
  //   console.log(a)
  //   let p1 = new Promise(function(resolve, reject){
  //     a++
  //     console.log(a)
  //     resolve(a)
      
  // })
  // return p1
  // } 
}
