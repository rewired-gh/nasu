// @ts-nocheck

import SimplePeer from 'simple-peer'

const BUFFER_FULL_THRESHOLD = 64 * 1024

class NewPeer extends SimplePeer {
  constructor(opts) {
    super(opts)

    this.webRTCPaused = false
    this.webRTCMessageQueue = []
  }

  sendMessageQueued() {
    this.webRTCPaused = false

    let message = this.webRTCMessageQueue.shift()

    while (message) {
      if (
        this._channel.bufferedAmount &&
        this._channel.bufferedAmount > BUFFER_FULL_THRESHOLD
      ) {
        this.webRTCPaused = true
        this.webRTCMessageQueue.unshift(message)

        const listener = () => {
          this._channel.removeEventListener('bufferedamountlow', listener)
          this.sendMessageQueued()
        }

        this._channel.addEventListener('bufferedamountlow', listener)
        return
      }

      try {
        super.send(message)
        message = this.webRTCMessageQueue.shift()
      } catch (error) {
        throw new Error(
          `Error send message, reason: ${error.name} - ${error.message}`
        )
      }
    }
  }

  send(chunk) {
    this.webRTCMessageQueue.push(chunk)

    if (this.webRTCPaused) {
      return
    }

    this.sendMessageQueued()
  }
}

export { NewPeer }
