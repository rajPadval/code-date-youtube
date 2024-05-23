import axios from "axios";
import { useContext, useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { AppContext } from "../context/AppContext";
import { io } from "socket.io-client";

const Chats = () => {
  const socket = useMemo(() => io(import.meta.env.VITE_BACKEND_URL), []);

  const { user } = useContext(AppContext);

  const [friends, setFriends] = useState([]);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const getFromFav = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getFromFav`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const { data } = await res.data;
      setFriends(data);
    } catch (error) {
      console.log("Error fetching friends : ", error);
    }
  };

  useEffect(() => {
    getFromFav();
  }, []);

  useEffect(() => {
    const onConnect = () => console.log("Connected to: ", socket.id);
    const onDisconnect = () => console.log("Disconnected from: ", socket.id);
    const onReceiveMessage = (message) =>
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...message, senderEmail: message.senderEmail || user.email },
      ]);

    const onRecipientOffline = (recipientEmail) =>
      toast.error(`${recipientEmail} is offline`);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receive-message", onReceiveMessage);
    socket.on("recipient-offline", onRecipientOffline);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive-message", onReceiveMessage);
      socket.off("recipient-offline", onRecipientOffline);
    };
  }, [socket, user.email]);

  const handleSendMessage = () => {
    socket.emit("send-message", {
      senderEmail: user.email,
      recipientEmail: recipientEmail,
      message: inputMessage,
    });
    setMessages((prevMessages) => [
      ...prevMessages,
      { message: inputMessage, senderEmail: user.email },
    ]);
    setInputMessage("");
  };

  const initiateChat = (email) => {
    setRecipientEmail(email);
    toast.success("Chatting with " + email);
    socket.emit("initiate-chat", {
      senderEmail: user.email,
      recipientEmail: email,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-evenly items-center">
      <div className="w-screen overflow-x-hidden sm:overflow-x-hidden sm:w-[20vw] my-6 p-3">
        <h1 className="text-3xl font-bold mb-4 text-white">Chats</h1>
        <div className="flex sm:flex-wrap gap-4 overflow-x-scroll sm:overflow-x-hidden">
          {friends?.map((friend) => {
            return (
              <div
                key={friend?._id}
                onClick={() => initiateChat(friend?.email)}
                className={`bg-white p-4 rounded-lg ${
                  recipientEmail === friend?.email &&
                  "shadow-primary shadow-inner"
                }`}
              >
                <img
                  src={friend?.profile}
                  alt={friend?.name}
                  className="w-20 h-20 rounded-full mx-auto"
                />
                <p className="text-center font-bold mt-2 font-ropaSans">
                  {friend?.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      {/* chat screen */}
      <div className="w-[90vw] sm:w-[60vw] h-[80vh] shadow-primary shadow-inner my-6 rounded-lg relative">
        <h1 className="text-xl font-bold p-4 text-white bg-primary rounded-tl-md rounded-tr-md font-ropaSans ">
          {recipientEmail}
        </h1>
        <div className="h-[80%] overflow-y-scroll p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.senderEmail === user.email
                  ? "justify-end"
                  : "justify-start"
              } mb-4`}
            >
              <div
                className={`bg-${
                  message.senderEmail === user.email ? "primary" : "white"
                } text-${
                  message.senderEmail === user.email ? "white" : "black"
                } p-2 w-fit rounded-lg ${
                  message.senderEmail === user.email
                    ? "rounded-tr-none ml-auto"
                    : "rounded-tl-none"
                }`}
              >
                <span>{message.senderEmail}</span>
                <p>{message.message}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
          <input
            type="text"
            name="message"
            placeholder="Type a message"
            className="w-[90%] py-2 rounded-md px-4 outline-none"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button
            className="bg-primary text-white py-2 px-5 rounded-md font-ropaSans"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chats;
