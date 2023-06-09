import TWEEN from '@tweenjs/tween.js'
import { splitStringBySize } from '@/utils/common'
import { getRandomColors, presetColors } from '@/utils/gencolors'
import { angleToRadian, getPointOnCircle } from '@/utils/calculation'

export class Turntable {
  private dpr = 1
  private handColor = 'red'
  private options: string[] = []
  colors: string[] = []
  private currentAngle = 0
  private duration = 3000

  constructor(
    private readonly canvas: HTMLCanvasElement,
  ) {}

  private get ctx() {
    return this.canvas.getContext('2d')!
  }

  private get center() {
    return { x: this.canvas.width / this.dpr / 2, y: this.canvas.height / this.dpr / 2 }
  }

  private get turntableRadius() {
    return Math.min(this.canvas.width / this.dpr * 0.4, this.canvas.height / this.dpr * 0.4)
  }

  private get handRadius() {
    return this.turntableRadius * 0.35
  }

  private get handProp() {
    return {
      startAngle: 290,
      endAngle: 250,
      radius: this.handRadius * 0.3,
    }
  }

  private get baseAngle() {
    return 360 / this.options.length
  }

  private keepDraw(fn: () => void) {
    this.ctx.save()
    this.ctx.beginPath()
    fn()
    this.ctx.restore()
  }

  setSize(width: number, height: number, dpr = 1) {
    this.dpr = dpr
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.ctx.scale(dpr, dpr)
  }

  setOptions(options: string[]) {
    this.options = [...new Set(options)]
  }

  updateColors() {
    this.colors = getRandomColors(presetColors, this.options.length + 1)
  }

  draw() {
    if (this.options.length === 0) return
    if (this.colors.length === 0) this.updateColors()
    this.keepDraw(() => {
      this.ctx.translate(this.center.x, this.center.y)
      this.drawTurntableBg()
      this.keepDraw(() => {
        this.ctx.rotate(angleToRadian(this.currentAngle))
        this.drawTurntable()
      })
      this.drawHand()
    })
  }

  async start(duration = 0): Promise<number> {
    if (this.options.length === 0) return -1
    if (duration > 0) this.duration = duration
    const rotationAngle = this.currentAngle + Math.floor(Math.random() * (3600 - 360 + 1)) + 360 * 5
    const index = this.calcFinalIndex(rotationAngle)
    if (index === false) return await this.start(duration)
    await this.animate(rotationAngle)
    return index
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private calcFinalIndex(rotationAngle: number) {
    const finalAngle = rotationAngle % 360
    const currentAngle = (270 - finalAngle + 360) % 360
    if (currentAngle % this.baseAngle === 0) return false
    return Math.floor(currentAngle / this.baseAngle)
  }

  private animate(targetAngle: number): Promise<void> {
    let startTime: number | null = null

    const animate = new TWEEN.Tween([this.currentAngle])
      .to([targetAngle], this.duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(([value]) => {
        // console.log(value)
        this.currentAngle = value % 360
      })
    animate.start()
    return new Promise((resolve) => {
      const frame = (currentTime: number) => {
        TWEEN.update()
        if (startTime === null) {
          startTime = currentTime
        }

        const elapsedTime = currentTime - startTime

        if (elapsedTime >= this.duration) {
          animate.stop()
          resolve()
          return
        }

        this.drawFrame()
        // @ts-expect-error test
        this.canvas.requestAnimationFrame(frame)
      }

      // @ts-expect-error test
      this.canvas.requestAnimationFrame(frame)
    })
  }

  private drawFrame() {
    this.clearCanvas()

    // 绘制旋转的图形
    this.keepDraw(() => {
      this.ctx.translate(this.center.x, this.center.y)
      this.drawTurntableBg()
      this.keepDraw(() => {
        this.ctx.rotate(angleToRadian(this.currentAngle))
        this.drawTurntable()
      })
      this.drawHand()
    })
  }

  private drawTurntableBg() {
    const [bgColor] = this.colors.slice(-1)
    this.keepDraw(() => {
      this.ctx.beginPath()
      this.ctx.strokeStyle = bgColor
      this.ctx.fillStyle = bgColor
      this.ctx.lineWidth = 1
      this.ctx.moveTo(0, 0)
      this.ctx.arc(0, 0, this.turntableRadius + 10, 0, 2 * Math.PI)
      this.ctx.closePath()
      this.ctx.fill()
      this.ctx.stroke()
    })
  }

  private drawHand() {
    const { startAngle, endAngle, radius } = this.handProp
    const calcPoint = getPointOnCircle.bind(null, 0, 0, radius)
    const startPoint = calcPoint(startAngle)
    const endPoint = calcPoint(endAngle)
    const startRad = angleToRadian(startAngle)

    // draw circle shadow
    this.keepDraw(() => {
      // 设置阴影
      this.ctx.shadowOffsetX = 5
      this.ctx.shadowOffsetY = 10
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = 'rgba(0,0,0,0.5)'
      this.ctx.arc(0, 0, radius, 0, 2 * Math.PI)
      this.ctx.fill()
    })

    // draw circle
    this.keepDraw(() => {
      this.ctx.beginPath()
      this.ctx.strokeStyle = this.handColor
      this.ctx.fillStyle = this.handColor
      this.ctx.lineWidth = 1
      this.ctx.moveTo(0, 0)
      this.ctx.arc(0, 0, radius, startRad, endAngle)
      this.ctx.closePath()
      this.ctx.fill()
      this.ctx.stroke()
    })

    // draw arrow shadow
    this.keepDraw(() => {
      this.ctx.beginPath()
      this.ctx.strokeStyle = this.handColor
      this.ctx.fillStyle = this.handColor
      this.ctx.lineWidth = 1
      this.ctx.shadowOffsetX = 5
      this.ctx.shadowOffsetY = 5
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = 'rgba(0,0,0,0.5)'
      this.ctx.moveTo(startPoint.x, startPoint.y)
      this.ctx.lineTo(0, 0 - radius * 2.5)
      this.ctx.lineTo(endPoint.x, endPoint.y)
      this.ctx.fill()
      this.ctx.stroke()
    })

    // draw arrow
    this.keepDraw(() => {
      this.ctx.beginPath()
      this.ctx.strokeStyle = this.handColor
      this.ctx.fillStyle = this.handColor
      this.ctx.moveTo(startPoint.x, startPoint.y)
      this.ctx.lineTo(0, 0 - radius * 2)
      this.ctx.lineTo(endPoint.x, endPoint.y)
      this.ctx.fill()
      this.ctx.stroke()
    })

    // draw patch
    this.keepDraw(() => {
      this.ctx.strokeStyle = this.handColor
      this.ctx.fillStyle = this.handColor
      this.ctx.moveTo(0, 0)
      this.ctx.arc(0, 0, radius, 0, 2 * Math.PI)
      this.ctx.fill()
      this.ctx.stroke()
    })
  }

  private drawTurntable() {
    const arcs: Array<() => void> = []
    const texts: Array<() => void> = []
    Array.from(this.options).forEach((text, index) => {
      const startAngle = index * this.baseAngle
      const endAngle = startAngle + this.baseAngle
      const startRad = angleToRadian(startAngle)
      const endRad = angleToRadian(endAngle)
      const color = this.colors[index]

      arcs.push(() => {
        this.keepDraw(() => {
          this.ctx.beginPath()
          this.ctx.moveTo(0, 0)
          this.ctx.arc(0, 0, this.turntableRadius, startRad, endRad)
          this.ctx.closePath()
          this.ctx.fillStyle = color
          this.ctx.fill()
        })
      })

      texts.push(() => {
        this.drawText(text, (startAngle + endAngle) / 2)
      })
    })

    arcs.forEach(draw => draw())
    texts.forEach(draw => draw())
  }

  private drawText(text: string, angle: number) {
    this.keepDraw(() => {
      const fontSize = 14
      this.ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", STHeiti, "Microsoft Yahei", Tahoma, Simsun, sans-serif`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillStyle = 'rgba(0,0,0,0.2)'
      // 行间距
      const lineHeight = 2
      // 扇形中间的宽度
      const maxTextWidth = this.turntableRadius / 2 * angleToRadian(this.baseAngle) * 0.8

      const textWidth = this.ctx.measureText(text).width

      // 文字高度加上行间距
      const unitHeight = fontSize + lineHeight
      const unitWidth = textWidth / text.length
      const groupNum = Math.floor(maxTextWidth / unitWidth)

      let texts = splitStringBySize(text, groupNum)
      // 计算总文字高度
      let totalTextHeight = texts.length * unitHeight

      this.ctx.translate(0, 0)
      this.ctx.rotate(angleToRadian(270 + angle))

      const calcY = (index: number) => {
        const textHeight = unitHeight * (index + 1)
        return this.turntableRadius / 2 + textHeight - totalTextHeight / 2 + 10
      }

      const overflow = texts.reduce((pre, _, index) => {
        const y = calcY(index)
        if (y > this.turntableRadius || y <= unitHeight * 3) {
          return pre + 1
        }
        else {
          return pre
        }
      }, 0)

      texts = texts.slice(0, texts.length - overflow)
      totalTextHeight = texts.length * unitHeight

      texts.concat(overflow > 0 ? ['......'] : []).forEach((text, index) => {
        const y = calcY(index)
        this.ctx.fillText(text, 0, text === '......' ? y - 8 : y)
      })
    })
  }
}
