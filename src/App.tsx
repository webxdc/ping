import { For, type Component } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { useIntervalFn } from 'solidjs-use';
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

const colors = ['#3b82f6', '#4ade80', '#facc15', '#fb923c', '#f87171', '#9f1239', '#a21caf']

let realtimeChannel;

let enc = new TextEncoder()
let dec = new TextDecoder()

const App: Component = () => {
  let seq = 0;
  const sendTimes: { [index: number]: number } = {}
  const [devices, setDevices] = createStore<{ [index: string]: { name: string, data: PingData[] } }>({}) //({ device1: [{ delay: 100, seq: 0 }, { delay: 500, seq: 0 }, { delay: 2000, seq: 0 }] }); // 

  let listener = (data) => {
    let decoded = JSON.parse(dec.decode(data))
    if (is_response(decoded)) {
      if (decoded.sender !== window.webxdc.selfName) {
        return
      }

      let delay = Date.now() - sendTimes[decoded.seq]
      if (!devices[decoded.respondant]) {
        setDevices(decoded.respondant, { name: decoded.respondant, data: [{ delay, seq: decoded.seq }] })
      } else {
        setDevices(decoded.respondant, 'data', reconcile([...devices[decoded.respondant].data, { delay, seq: decoded.seq }]))
      }

    } else if (is_request(decoded)) {
      let resp: Response = { respondant: window.webxdc.selfName, seq: decoded.seq, sender: decoded.sender }
      realtimeChannel.send(enc.encode(JSON.stringify(resp)))
    }
  }

  const { pause, resume, isActive } = useIntervalFn(() => {
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

  function join() {
    console.log("Joining Realtime");
    //reset state
    setDevices(reconcile({}))
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
          <For each={Object.values(devices)} fallback={
            <p class="text-center text-gray-600 font-italic"> {isActive() ? "Waiting for pings .." : "You need to join the gossip"}</p>}>
            {(data, index) => ResponseView({ ...data, active: isActive, color: colors[index() % colors.length] })}
          </For>
        </div>
      </div>
    </div >
  );
};

export default App;
