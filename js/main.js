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
  movement: ['up', 'down', 'left', 'right', 'left-down', 'right-down'],   //动作
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
    this.startMyGame();

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
   * 游戏开始函数
   */
  startMyGame = () => {
    var that = this;
    //console.log(this)
    let timeStart = new Date().getTime();
    let devicePosition = this.devicePositionAdjust(timeStart)
    console.log(devicePosition)
    // if(this.devicePositionAdjust(timeStart)){
    //   console.log("ready to play")
    //   this.showNextMovement(challengeItem.movement[movementIndex]);
    //   //第一个动作0.5s后检测，以后的动作因为是提前0.5s显示，所以1s后检测状态
    //   if (movementIndex == 0) {
    //     setTimeout(this.getMechineStatus, 500);
    //     timeStart = new Date().getTime();
    //     this.getDecivePosi(timeStart)
    //   } else {
    //     setTimeout(this.getMechineStatus, 1000);
    //   }
    // }else{
    //   wx.showToast({
    //     title:"请重新调整设备",
    //     icon: "none",
    //     duration: 2000
    //   })
    // }
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

    let angleStatus = this.meanAngle(status_record)
    this.angleToStatus(challengeItem.movement[movementIndex], angleStatus, )
    //TODO : 如何获取设备状态？
    let temp = ['up', 'don', 'left', 'right', 'left-down', 'right-dow'];
    //console.log(temp);
    mechineStatus = temp[movementIndex];
    

    if (mechineStatus == challengeItem.movement[movementIndex]) {
      console.log('well done ' + movementIndex);
      if (movementIndex == challengeItem.movement.length - 1) {
        console.log('Congratulations! You win!');
        return;
      }
      //console.log(this.startMyGame)
      setTimeout(this.startMyGame, (challengeItem.timeDuration[movementIndex] - 1) * 1000);//每个动作0.5s后检测状态，又提前0.5s显示下一个动作
      movementIndex = movementIndex + 1;    //指向下一个动作
    } else {
      console.log('game over! %d movements left', challengeItem.timeDuration.length - 1 - movementIndex);
      return;
    }


    //return 'up';
  }

  /**
   * 页面显示下一个动作
   * @param {需要显示的动作} movement 
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
   * @param {*} timeStart 游戏开始时间
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
   * @param timeStart 游戏开始时的时间
   * @returns true 10秒内调整成功
   * @returns false 10秒内调整失败
   */
  devicePositionAdjust(timeStart){
    console.log("请调整手机姿势至平放") //不需要指北
    var showNum = 0           //总检测次数
    var readyNum = 0          //连续两次检测状态正确
    let angleToNorth = 0.0    //与正北方向夹角
    let maxNum = 5            //总检测次数不超过5次，即10s
    //let changeNum = 0         //记录状态改变次数
    if(wx.startDeviceMotionListening){
      wx.startDeviceMotionListening({
        interval: 'normal',
        success: function(res){
          console.log(res);
          wx.onDeviceMotionChange(function(res){
            //changeNum++;
            //console.log(changeNum)
            //每两秒输出一次坐标状态
            let dateNow = new Date().getTime()
            if(dateNow - timeStart > 3 * 1000){   //每3秒检测一次
              timeStart = dateNow;
              showNum++
              console.log(res.alpha.toFixed(2), res.beta.toFixed(2), res.gamma.toFixed(2));
              // console.log(Math.abs(res.gamma.toFixed(2)))
              // console.log(Math.abs(res.beta.toFixed(2)))
              if(Math.abs(res.gamma.toFixed(2)) <10 && Math.abs(res.beta.toFixed(2))<10){ //左右和俯仰状态正常
                console.log("now position is ok")
                readyNum++
                angleToNorth+=res.alpha;
              }  
            
              if(readyNum>1 || showNum >= maxNum){   //  如果连续两秒状态合适或时间大于10s，则结束调整
                //TODO : 需要记录水平角度，即与正北方向夹角
                //console.log("readyNum is " +readyNum)
                wx.stopDeviceMotionListening()
                console.log("stop device motion listening")
                console.log("showNum is " + showNum)
                //手机调整时间不能超过10秒
                if(showNum<5){
                  console.log("请保持此状态")
                  angleToNorth /= readyNum
                  console.log("readyNum is " + readyNum)
                  console.log("device position OK and angleToNorth is " + angleToNorth)
                  return true
                }else if(showNum >= maxNum){
                  return false
                }
              }
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
    //手机调整时间不能超过10秒
    // if(showNum<5){
    //   console.log("请保持此状态")
    //   angleToNorth /= readyNum
    //   console.log("readyNum is " + readyNum)
    //   console.log("device position OK and angleToNorth is " + angleToNorth)
    //   return true
    // }else if(showNum>=5){
    //   return false
    // }
  }

  /**
   * 判断设备状态是否正确
   * @param {*} movement 当前动作
   * @param {*} angle 当前设备状态
   * @param {*} angleToNorth 设备初始状态与正北方向夹角
   */
  angleToStatus(movement, angle, angleToNorth){
    let statusSet = ["left", "right", "up", "down", "left_rotate", "right_rotate"]
    if(movement == "left" && Math.Math.abs(angle[2]-90) < 10){  
      return true
    }else if(movement == "right" && Math.abs(angle[2]+90) < 10){
      return true
    }else if(movement == "up" && Math.abs(angle[1] + 90 ) < 10){
      return true
    }else if(movement == "down" && Math.abs(angle[1] - 90) < 10){
      return true
    }else if(movement == "left_rotate" && (Math.abs(angle[0] - angleToNorth +90)<10 ||Math.abs(angle[0]-angleToNorth-270)<10)){
      return true
    }else if(movement == "right_rotate"&&(Math.abs(angle[0]-angleToNorth-90)<10 || Math.abs(angle[0]-angleToNorth+270)<10)){
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
}
