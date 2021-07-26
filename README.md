<h1 align="center">
  Monolingo
</h1>
<p align="center">
  A simple video conferencing web application with (almost) real-time translation.
</p>
<p align="center">
  https://monolingo.herokuapp.com/
</p>

**Note: The project currently supports Chrome only due to limitations of Web Speech API; please see [Web Speech API compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API#browser_compatibility) for more details.**

The design of this project mainly consists of 3 parts:
* Peer-to-peer media stream connection with [Peer.js](https://peerjs.com/) (Webrtc)
* Speech-to-text & text-to-speech using [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
* Text translation with [translate](https://www.npmjs.com/package/translate) package (currently using Libre engine because it's FREE).

## Preview

![preview][img]

[img]: https://github.com/Mohanito/Monolingo-v1/blob/main/public/images/chatroom-preview.png
