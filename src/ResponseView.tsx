import { Accessor, For, createEffect, type Component } from 'solid-js';
import { PingData } from './App';
import { format } from 'date-fns';
interface ChatProps {
  name: string;
  data: PingData[];
  color: string
  active: Accessor<boolean>
}

const Chats: Component<ChatProps> = ({ name, data, color, active }) => {

  let element;
  let looking = true;
  createEffect(() => {
    data.length;
    if (looking) {
      element.scrollTop = element.scrollHeight;
    }
  })

  function scroll_handler() {
    console.log(element.scrollTop, element.scrollHeight);

    if (element.scrollTop > element.scrollHeight - 420) {
      looking = true;
    } else {
      looking = false;
    }
  }

  return (
    <div style={`width: 300px`}>
      <h1 style={`color: ${color}`} class="ml-1 font-bold font-mono case-capital text-xl"> {name} </h1>
      <div ref={element} onScroll={scroll_handler} style={`border-color: ${color}; max-height: 400px`} class="font-mono border-2 rounded-md p-4 py-1 overflow-y-auto">
        <For each={data}>
          {ping => (
            <div class="flex gap-2">
              <span> <span class="font-bold text-gray-700 tracking-wider">ping</span> #{ping.seq}:</span>
              <span class="font-bold" style={`color: ${active() ? `hsl(${Math.max(124 - ping.delay * 0.1, 0)}, 80%, 50%)` : "gray"};`}> {format(ping.delay, "TT")}ms </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default Chats;
