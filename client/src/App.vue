<script setup lang="ts">
import { ref, watch } from 'vue'
import Peer from 'simple-peer'
import { NewPeer } from './models/Peer'
import { assert } from '@vue/compiler-core'
import type { Buffer } from 'buffer'
import type SimplePeer from 'simple-peer'
import BaseButton from './components/BaseButton.vue'
import BaseCard from './components/BaseCard.vue'

const ROUND = 64
const ARRAY_BUFFER_CHUNK_SIZE = 1024 * 256
const RECEIVE_MAGIC_STRING = 'GWU8'
const FINISH_MAGIC_STRING = 'tRa4'
const PEER_READY_MAGIC_STRING = 'xtP9'
const NETWORK_POLL_INTERVAL = 600
const NETWORK_WAIT_TIMEOUT_INTERVAL = 120 * 1000
const NETWORK_JOIN_TIMEOUT_INTERVAL = 60 * 1000

interface Response {
  ok: boolean
  id: string
  inviter: string
  invitee: string | null
}

enum ReceiveMode {
  Idle,
  Metadata,
  File,
}

const onReceiveData = (chunk: Buffer) => {
  // console.log('receive', chunk)
  // if (
  //   receiveMode === ReceiveMode.Idle &&
  //   chunk.toString() === RECEIVE_MAGIC_STRING
  // ) {
  //   receiveMode = ReceiveMode.Filename
  // } else if (receiveMode === ReceiveMode.Filename) {
  //   receivedFilename.value = chunk.toString()
  //   receiveMode = ReceiveMode.File
  // } else if (receiveMode === ReceiveMode.File) {
  //   receivedFileUrl.value = URL.createObjectURL(new Blob([chunk]))
  //   receiveMode = ReceiveMode.Idle
  // } else {
  //   console.error('Receive unknown data in wrong mode!')
  //   receiveMode = ReceiveMode.Idle
  // }
  switch (chunk.toString()) {
    case PEER_READY_MAGIC_STRING:
      isPeerReady = true
      return
    case FINISH_MAGIC_STRING:
      isSending.value = false
      break
  }

  switch (receiveMode) {
    case ReceiveMode.Idle:
      if (chunk.toString() === RECEIVE_MAGIC_STRING) {
        // peer.send(PEER_READY_MAGIC_STRING)
        receivedChunks = []
        receivedFilename.value = ''
        receiveLength = 0
        receivedCount = 0
        receiveMode = ReceiveMode.Metadata
      } else {
        console.error('Receive unknown data in wrong mode!')
      }
      break
    case ReceiveMode.Metadata: {
      const message = JSON.parse(chunk.toString())

      switch (message.k) {
        case 'filename':
          assert(typeof message.v === 'string')
          receivedFilename.value = message.v
          break
        case 'length':
          assert(typeof message.v === 'number')
          receiveLength = message.v
          break
      }

      if (receivedFilename.value && receiveLength) {
        // peer.send(PEER_READY_MAGIC_STRING)
        receiveMode = ReceiveMode.File
      }

      break
    }
    case ReceiveMode.File:
      receivedChunks.push(chunk)
      receivedCount++
      if ((receivedCount + 1) % ROUND === 0) {
        peer.send(PEER_READY_MAGIC_STRING)
      }
      // console.log(`remain: ${remainingCount}`)
      if (receivedCount === receiveLength) {
        peer.send(FINISH_MAGIC_STRING)
        receivedFileUrl.value = URL.createObjectURL(new Blob(receivedChunks))
        receiveMode = ReceiveMode.Idle
      }
      receivingProgress.value = receivedCount / receiveLength
      break
  }
}

const initPeer = (peer: Peer.Instance) => {
  peer._debug = console.log
  peer.on('signal', (data) => {
    localDescription.value = JSON.stringify(data)
  })
  peer.on('error', (error) => {
    console.error('simple-peer', error)
    onDisconnectClick()
  })
  peer.on('data', onReceiveData)
  peer.on('connect', () => {
    isJoiningSession.value = false
    isReady.value = true
  })
  peer.on('close', () => {
    isReady.value = false
  })
}

const createPeer = (isInitiator: boolean) => {
  const peer = new Peer({
    initiator: isInitiator,
    trickle: false,
    allowHalfTrickle: true,
    channelConfig: {
      ordered: true,
    },
    // config: {
    //   iceServers: [
    //     {
    //       urls: 'stun:openrelay.metered.ca:80',
    //     },
    //     {
    //       urls: 'turn:openrelay.metered.ca:80',
    //       username: 'openrelayproject',
    //       credential: 'openrelayproject',
    //     },
    //     {
    //       urls: 'turn:openrelay.metered.ca:443',
    //       username: 'openrelayproject',
    //       credential: 'openrelayproject',
    //     },
    //     {
    //       urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    //       username: 'openrelayproject',
    //       credential: 'openrelayproject',
    //     },
    //   ],
    // },
  })
  initPeer(peer)
  return peer
}

const initTricklePeer = (peer: Peer.Instance, isInitiator: boolean) => {
  peer._debug = console.log
  peer.on('signal', async (data) => {
    localDescription.value = JSON.stringify(data)
    neofetch(
      '/trickle/set',
      isInitiator
        ? {
            id: sessionId.value,
            inviter: localDescription.value,
          }
        : {
            id: sessionId.value,
            invitee: localDescription.value,
          }
    )
  })
  peer.on('error', (error) => {
    console.error('simple-peer', error)
    onDisconnectClick()
  })
  peer.on('data', onReceiveData)
  peer.on('connect', () => {
    isJoiningSession.value = false
    isReady.value = true
  })
  peer.on('close', () => {
    isReady.value = false
  })
}
const createTricklePeer = (isInitiator: boolean) => {
  const peer = new Peer({
    initiator: isInitiator,
    trickle: true,
    // allowHalfTrickle: true,
    channelConfig: {
      ordered: true,
    },
    // config: {
    //   iceServers: [
    //     {
    //       urls: 'stun:openrelay.metered.ca:80',
    //     },
    //     {
    //       urls: 'turn:openrelay.metered.ca:80',
    //       username: 'openrelayproject',
    //       credential: 'openrelayproject',
    //     },
    //     {
    //       urls: 'turn:openrelay.metered.ca:443',
    //       username: 'openrelayproject',
    //       credential: 'openrelayproject',
    //     },
    //     {
    //       urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    //       username: 'openrelayproject',
    //       credential: 'openrelayproject',
    //     },
    //   ],
    // },
  })
  initTricklePeer(peer, isInitiator)
  return peer
}

const storedSignalServerUrl = localStorage.getItem('signalServerUrl')

const signalServerUrl = ref(
  storedSignalServerUrl
    ? storedSignalServerUrl
    : 'https://nasu-signal.hopp.top:13773'
)
const sessionId = ref('')
const localDescription = ref('')
const remoteDescription = ref('')
const isConnected = ref(false)
const isReady = ref(false)
const isTrickle = ref(true)
const isSending = ref(false)
const receivedFileUrl = ref<string | null>(null)
const receivedFilename = ref('')
const uploadedFilename = ref('')
const sendingProgress = ref(0)
const receivingProgress = ref(0)
const isJoiningSession = ref(false)
const isCreatingSession = ref(false)

watch(signalServerUrl, (value) => {
  localStorage.setItem('signalServerUrl', value)
})

let peer: SimplePeer.Instance

let receiveMode = ReceiveMode.Idle
let receiveLength = 0
let receivedCount = 0
let receivedChunks: Array<Buffer> = []
let isPeerReady = false

const waitUntil = async (condition: () => boolean, interval = 10) => {
  const poll = (resolve: (value: unknown) => void) => {
    if (condition()) {
      resolve(undefined)
    } else setTimeout(() => poll(resolve), interval)
  }

  return new Promise(poll)
}

const neofetch = async (path: string, body: Record<string, unknown>) => {
  try {
    const response = await fetch(new URL(path, signalServerUrl.value), {
      method: 'POST',
      headers: [['Content-Type', 'application/json']],
      body: JSON.stringify(body),
    })
    const content: Response = await response.json()
    return content
  } catch (error) {
    resetSession()
  }
}

const onConnectClick = () => {
  peer.signal(JSON.parse(remoteDescription.value))
  isConnected.value = true
}
const onDisconnectClick = () => {
  if (!peer.destroyed) {
    peer.destroy()
  }
  peer = createPeer(true)
  initPeer(peer)
  isConnected.value = false
}
const onSendFile = async (event: Event) => {
  isSending.value = true
  const files = (event?.target as HTMLInputElement).files
  if (!files) return
  const file = files[0]
  uploadedFilename.value = file.name
  const fileArray = await file.arrayBuffer()

  const total = Math.ceil(fileArray.byteLength / ARRAY_BUFFER_CHUNK_SIZE)

  peer.send(RECEIVE_MAGIC_STRING)
  peer.send(JSON.stringify({ k: 'filename', v: file.name }))
  peer.send(
    JSON.stringify({
      k: 'length',
      v: total,
    })
  )

  for (
    let i = 0, j = 1;
    i < fileArray.byteLength;
    i += ARRAY_BUFFER_CHUNK_SIZE, j++
  ) {
    const chunk = fileArray.slice(i, i + ARRAY_BUFFER_CHUNK_SIZE)
    if (j % ROUND === 0) {
      await waitUntil(() => isPeerReady, 1)
      isPeerReady = false
    }
    peer.send(chunk)
    sendingProgress.value = j / total
  }
}
// const onSendClick = async () => {
//   if (!uploadedFile.value) return
//   const fileArray = await uploadedFile.value.arrayBuffer()
//   peer.send(RECEIVE_MAGIC_STRING)
//   // await waitPeer()
//   peer.send(JSON.stringify({ k: 'filename', v: uploadedFile.value.name }))
//   peer.send(
//     JSON.stringify({
//       k: 'length',
//       v: Math.ceil(fileArray.byteLength / ARRAY_BUFFER_CHUNK_SIZE),
//     })
//   )
//   // const chunks = []
//   for (
//     let i = 0, j = 1;
//     i < fileArray.byteLength;
//     i += ARRAY_BUFFER_CHUNK_SIZE, j++
//   ) {
//     const chunk = fileArray.slice(i, i + ARRAY_BUFFER_CHUNK_SIZE)
//     if (j % ROUND === 0) {
//       await waitUntil(() => isPeerReady, 1)
//       isPeerReady = false
//     }
//     peer.send(chunk)
//   }
//   // peer.send(
//   //   JSON.stringify({
//   //     k: 'length',
//   //     v: chunks.length,
//   //   })
//   // )
//   // for (const chunk of chunks) {
//   //   peer.send(chunk)
//   // }
//   // const fileBuffer = await uploadedFile.value.arrayBuffer()
//   // peer.send(fileBuffer)
// }
const onBClick = () => {
  peer = createPeer(false)
  initPeer(peer)
}
const resetPeer = () => {
  if (peer) peer.destroy()
  localDescription.value = ''
  remoteDescription.value = ''
}
const resetSession = () => {
  sessionId.value = ''
  isJoiningSession.value = false
  isCreatingSession.value = false
}
const onNewSession = async () => {
  isCreatingSession.value = true
  resetPeer()
  peer = createPeer(true)
  await waitUntil(() => (localDescription.value ? true : false))

  // const response = await fetch(new URL('/new-session', baseUrl.value), {
  //   method: 'POST',
  //   headers: [['Content-Type', 'application/json']],
  //   body: JSON.stringify({
  //     inviter: localDescription.value,
  //   }),
  // })
  // const content: Response = await response.json()
  const content = await neofetch('/new-session', {
    inviter: localDescription.value,
  })

  if (content && content.ok) {
    sessionId.value = content.id
  }
  isCreatingSession.value = false

  let timeoutWaitInvitee = false
  setTimeout(() => {
    timeoutWaitInvitee = true
    resetSession()
  }, NETWORK_WAIT_TIMEOUT_INTERVAL)
  await waitUntil(() => {
    onUpdateSession()
    return isReady.value || timeoutWaitInvitee
  }, NETWORK_POLL_INTERVAL)
}
const onJoinSession = async () => {
  isJoiningSession.value = true
  resetPeer()
  peer = createPeer(false)

  // const response = await fetch(new URL('/get-inviter', baseUrl.value), {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     id: sessionId.value,
  //   }),
  // })
  // const content: Response = await response.json()
  const content = await neofetch('/get-inviter', {
    id: sessionId.value,
  })

  if (content && content.ok) {
    peer.signal(content.inviter)

    // await fetch(new URL('/set-invitee', baseUrl.value), {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     invitee: localDescription.value,
    //   }),
    // })
    await waitUntil(() => (localDescription.value ? true : false))
    await neofetch('/set-invitee', {
      id: sessionId.value,
      invitee: localDescription.value,
    })
  }
}
const onUpdateSession = async () => {
  // const response = await fetch(new URL('/get-invitee', baseUrl.value), {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     id: sessionId.value,
  //   }),
  // })
  // const content: Response = await response.json()
  const content = await neofetch('/get-invitee', {
    id: sessionId.value,
  })

  if (
    content &&
    content.ok &&
    content.invitee &&
    remoteDescription.value !== content.invitee
  ) {
    remoteDescription.value = content.invitee
    peer.signal(content.invitee)
  }
}

const onNewTrickleSession = async () => {
  isCreatingSession.value = true
  resetPeer()

  const content = await neofetch('/trickle/new-session', {})

  if (content && content.ok) {
    sessionId.value = content.id
    isCreatingSession.value = false
    peer = createTricklePeer(true)

    let timeoutWaitInvitee = false
    setTimeout(() => {
      timeoutWaitInvitee = true
      resetSession()
    }, NETWORK_WAIT_TIMEOUT_INTERVAL)
    await waitUntil(() => {
      neofetch('/trickle/get-invitee', {
        id: sessionId.value,
      }).then((content) => {
        if (content && content.ok && content.invitee) {
          peer.signal(content.invitee)
        }
      })
      return isReady.value || timeoutWaitInvitee
    }, NETWORK_POLL_INTERVAL)
  }
}
const onJoinTrickleSession = async () => {
  isJoiningSession.value = true
  resetPeer()

  peer = createTricklePeer(false)

  let timeoutWaitInviter = false
  setTimeout(() => {
    timeoutWaitInviter = true
    resetSession()
  }, NETWORK_JOIN_TIMEOUT_INTERVAL)
  await waitUntil(() => {
    neofetch('/trickle/get-inviter', {
      id: sessionId.value,
    }).then((content) => {
      if (content && content.ok && content.inviter) {
        peer.signal(content.inviter)
      }
    })
    return isReady.value || timeoutWaitInviter
  }, NETWORK_POLL_INTERVAL)
}
const onDiscardSession = async () => {
  await neofetch(
    isTrickle.value ? '/trickle/delete-session' : '/delete-session',
    {
      id: sessionId.value,
    }
  )
}
</script>

<template>
  <nav
    class="flex px-8 py-3 justify-between align-middle w-full text-center shadow mb-2"
  >
    <h1 class="text-2xl font-medium tracking-widest">Nasu</h1>
    <div class="flex">
      <button
        :class="{ 'text-blue-500': isTrickle, 'text-slate-400': !isTrickle }"
        class="font-light ease-in-out duration-200"
        @click="isTrickle = !isTrickle"
      >
        Fast Mode {{ isTrickle ? 'ON' : 'OFF' }}
      </button>
    </div>
  </nav>
  <main class="mx-auto max-w-screen-lg py-6 space-y-6">
    <section class="flex flex-wrap justify-center gap-4">
      <BaseCard label="Signal Server">
        <input
          v-model="signalServerUrl"
          type="text"
          class="text-lg focus:outline-none focus:ring border-b-2 border-slate-200 hover:border-green-300 focus:border-green-300 ease-in-out duration-200"
        />
      </BaseCard>
      <BaseCard label="Session PIN">
        <input
          v-model="sessionId"
          type="text"
          maxlength="4"
          class="text-3xl focus:outline-none focus:ring w-32 tracking-widest font-mono border-b-2 border-slate-200 hover:border-green-300 focus:border-green-300 ease-in-out duration-200"
        />
      </BaseCard>
      <div class="flex flex-col justify-between">
        <BaseButton
          @click="isTrickle ? onNewTrickleSession() : onNewSession()"
          :disabled="isCreatingSession"
          class="py-3 px-6 shadow rounded-xl font-light"
        >
          {{ isCreatingSession ? 'Creating' : 'New Session' }}
        </BaseButton>
        <BaseButton
          @click="isTrickle ? onJoinTrickleSession() : onJoinSession()"
          :disabled="
            (sessionId ? sessionId.length !== 4 : true) || isJoiningSession
          "
          class="py-3 px-6 shadow rounded-xl font-light"
        >
          {{ isJoiningSession ? 'Joining' : 'Join Session' }}
        </BaseButton>
      </div>
    </section>
    <section class="flex m-2 flex-wrap justify-center hidden">
      <BaseButton @click="onUpdateSession"> Update Session </BaseButton>
      <BaseButton @click="onNewTrickleSession">New Trickle Session</BaseButton>
      <BaseButton @click="onJoinTrickleSession"
        >Join Trickle Session
      </BaseButton>
      <BaseButton @click="onBClick">Passive</BaseButton>
      <textarea
        v-model="localDescription"
        cols="40"
        rows="4"
        placeholder="Local Description"
      ></textarea>
      <textarea
        v-model="remoteDescription"
        cols="40"
        rows="4"
        placeholder="Remote Description"
      ></textarea>
      <BaseButton @click="isConnected ? onDisconnectClick() : onConnectClick()"
        >{{ isConnected ? 'Disconnect' : 'Connect' }}
      </BaseButton>
      <BaseButton @click="onDiscardSession">Discard Session</BaseButton>
    </section>
    <section
      v-if="isReady"
      class="flex m-2 flex-wrap justify-center gap-x-4 gap-y-4"
    >
      <BaseButton :disabled="isSending">
        <label class="cursor-pointer">
          <input type="file" @change="onSendFile" class="hidden" />
          Send File
        </label>
      </BaseButton>
      <a
        :href="receivedFileUrl ? receivedFileUrl : ''"
        :download="receivedFilename"
        ><BaseButton :disabled="!receivedFileUrl">Download File</BaseButton>
      </a>
    </section>
    <section class="mx-10">
      <p>
        Sending {{ uploadedFilename }} at
        {{ (sendingProgress * 100).toFixed(2) }}%
      </p>
      <p>
        Receiving {{ receivedFilename }} at
        {{ (receivingProgress * 100).toFixed(2) }}%
      </p>
    </section>
    <footer class="pt-36 text-center font-light text-slate-400 text-sm">
      <p>Nasu · v0.0.1 alpha · All rights reserved</p>
    </footer>
  </main>
</template>

<style></style>
