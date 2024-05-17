import { For, createEffect, createSignal, type Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useInterval, useIntervalFn } from 'solidjs-use';
import ResponseView from './ResponseView';

interface Request {
  sender: string
  seq: number
}

interface Response {
  sender: string,
  respondant: string,
  seq: number,
}

export interface PingData { delay: number, seq: number }

function is_response(data: any): data is Response {
  return 'sender' in data && 'respondant' in data && 'seq' in data
}

function is_request(data: any): data is Request {
  return 'seq' in data && 'sender' in data
}

let realtimeChannel;

let enc = new TextEncoder()
let dec = new TextDecoder()

const App: Component = () => {
  let seq = 0;
  const sendTimes: { [index: number]: number } = {}
  const [devices, setDevices] = createStore<{ [index: string]: PingData[] }>({}) //({ device1: [{ delay: 100, seq: 0 }, { delay: 500, seq: 0 }, { delay: 2000, seq: 0 }] }); // 

  let listener = (data) => {
    let decoded = JSON.parse(dec.decode(data))
    if (is_response(decoded)) {
      console.log("Received Gossip: ", decoded);
      if (decoded.sender !== window.webxdc.selfName) {
        return
      }

      let delay = Date.now() - sendTimes[decoded.seq]
      if (!devices[decoded.respondant]) {
        setDevices(decoded.respondant, [{ delay, seq: decoded.seq }])
        console.log("Setting Devices: ", devices);

      } else {
        setDevices(decoded.respondant, l => [...l, { delay, seq: decoded.seq }])
      }

    } else if (is_request(decoded)) {
      let resp: Response = { respondant: window.webxdc.selfName, seq: decoded.seq, sender: decoded.sender }
      realtimeChannel.send(enc.encode(JSON.stringify(resp)))
    }
  }

  const { pause, resume, isActive } = useIntervalFn(() => {
    console.log("Sending Ping");
    sendTimes[seq] = Date.now()
    let req: Request = { sender: window.webxdc.selfName, seq }
    realtimeChannel.send(enc.encode(JSON.stringify(req)))
    seq += 1
  }, 1000, { immediate: false })

  function leave() {
    console.log("Leaving Realtime");
    realtimeChannel.leave()
    pause()
  }

  createEffect(() => {
    console.log(devices)
  })

  function join() {
    console.log("Joining Realtime");
    realtimeChannel = window.webxdc.joinRealtimeChannel()
    realtimeChannel.setListener(listener)
    resume()
  }

  return (
    <div class="grid justify-center p-5 h-screen">
      <div class="bg-bg-light flex flex-col">
        <h1 class="text-15 text-center font-bold font-primary"> Realtime Ping </h1>
        <button class="margin-auto mt-10 self-center bg-primary text-white p-2 rounded-md" onClick={() => { if (isActive()) { leave() } else { join() } }}> {isActive() ? "Leave Realtime" : "Join Realtime"} </button>

        <div class="flex flex-wrap gap-5 mt-5 justify-center">
          <For each={Object.entries(devices)} fallback={
            < p class="text-center text-gray-600 font-italic"> {isActive() ? "Waiting for pings .." : "You need to join the gossip"}</p>}>
            {([user, data]) => ResponseView({ user, data })}
          </For>
        </div>
      </div>
    </div >
  );
};

export default App;
