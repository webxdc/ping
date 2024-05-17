import type { Component } from 'solid-js';

const App: Component = () => {

  const realtimeChannel = window.webxdc.joinRealtimeChannel();


  let enc = new TextEncoder()
  let dec = new TextDecoder()
  realtimeChannel.setListener((data) => {
      console.log("Received Gossip: ", data);
      var output = document.getElementById('output');
      output.appendChild(El('span', "GOSSIP: " + dec.decode(data)));
  })

  window.webxdc.setUpdateListener(function (update) {
      console.log("Received SMTP: ", update.payload);
      var output = document.getElementById('output');
      output.appendChild(El('span', "SMTP(" + update.payload.name + "): " + update.payload.msg));
  });

  function sendGossip() {
      let msg = document.getElementById('message').value;
      console.log("New Gossip message: ", enc.encode(msg));
      realtimeChannel.send(enc.encode(msg));
  }

  function sendMsg() {
      let msg = document.getElementById('message').value;
      console.log("New SMTP message: ", msg);

      window.webxdc.sendUpdate({
          payload: {
              name: window.webxdc.selfName,
              msg,
          },
      }, "");
  }

  function leave() {
      realtimeChannel.leave()
  }

  return (
    <div>
      <h1> Gossip Testing </h1>
      <div class="wrapper">
          <div class="ui">
              <label style="margin-bottom: 2px"> Message </label>
              <input id="message" placeholder="Message" style="margin-bottom: 1em"></input>
              <button id="sendGossip" onclick="sendGossip()" style="margin-bottom: 0.5em"> Send GOSSIP
              </button>
              <button onclick="sendMsg()" style="margin-bottom: 0.5em"> Send SMTP </button>
              <h1> Output </h1>
              <div>

                  <div id="output"></div>
              </div>
              <button onclick="leave()" style="margin-top: 0.5em; background: #BEA8A7;"> Leave GOSSIP </button>
          </div>
      </div>
    </div>
  );
};

export default App;
