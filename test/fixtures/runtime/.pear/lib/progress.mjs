import { encode } from './utils'

export class Progress {
  constructor(app, stages = [1]) {
    this.app = app
    this.stages = stages // e.g. [0.5, 0.3, 0.2]
    this.values = Array(stages.length).fill(0)
    this.speed = ''
    this.peers = 0
    this.total = 0
  }

  _broadcast() {
    this.app.broadcast(
      encode({
        type: 'download',
        data: {
          speed: this.speed,
          peers: this.peers,
          progress: this.total
        }
      })
    )
  }

  _compute() {
    const v = this.stages.reduce((sum, per, i) => sum + per * this.values[i], 0)
    this.total = Math.round(v * 100)
  }

  update(u, stage = 0) {
    if (u.speed !== undefined) this.speed = u.speed
    if (u.peers !== undefined) this.peers = u.peers
    if (u.progress !== undefined) this.stage(stage, u.progress)
  }

  stage(i, value) {
    if (i < 0 || i >= this.values.length) return
    this.values[i] = Math.min(1, Math.max(0, value))
    this._compute()
    this._broadcast()
  }

  complete() {
    this.values = this.values.map(() => 1)
    this._compute()
    this._broadcast()
  }
}
