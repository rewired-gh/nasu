# Nasu - P2P File Transfer on Web

A simplistic way for peer-to-peer file transfer.

Feel free to suggest new features or report bugs in ['Issues'](https://github.com/h0gan1ee/nasu/issues).

> Currently this project is under active development, and it hasn't reach stable state.

## Overview

Nasu uses WebRTC on client side to establish peer-to-peer connection and transfer file through the built-in data channel. Nasu works with its own signal server out of the box. Meanwhile, it could also work without a signal server, but without [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice) and requires to enable some hidden UI elements.

Up to now, Nasu client has been built with [simple-peer](https://github.com/feross/simple-peer), and was **not** intended for high speed or highly reliable transfer, due to its design and browser limitation.
