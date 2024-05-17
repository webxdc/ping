import type { Component } from 'solid-js';
interface ChatProps {
    user: string;
    pings: [number];
}

const Chats: Component<ChatProps> = ({user, pings}) => {
  return (
    <div>
      <h1> User: {user} </h1>
      <div id="output"></div>
    </div>
  );
};

export default Chats;
