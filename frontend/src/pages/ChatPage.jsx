import React, { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Image as ImageIcon, MoreVertical, MessageSquare, User, Phone, Video } from "lucide-react";
import axios from "axios";
import { UserContext } from "../context/userContext";
import { useSocketContext } from "../context/SocketContext";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { useCallContext } from "../context/CallContext";
import API_BASE_URL from "../config/api";

const ChatPage = () => {
  const { user: currentUser } = useContext(UserContext);
  const { socket, onlineUsers } = useSocketContext();
  const { startCall } = useCallContext();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversations (following list for now)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/user-profile/get-following`, { withCredentials: true });
        if (response.data.success) {
          setConversations(response.data.following);
        }
      } catch (error) {
        console.error("Error fetching following:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/chat/${selectedConversation._id}`, { withCredentials: true });
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [selectedConversation]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (msg) => {
      if (selectedConversation && (msg.senderId === selectedConversation._id || msg.receiverId === selectedConversation._id)) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("newMessage");
  }, [socket, selectedConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const msgData = {
      message: newMessage,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat/send/${selectedConversation._id}`, msgData, { withCredentials: true });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Message failed to send");
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    conv.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans overflow-hidden">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-6 px-4 max-w-7xl mx-auto w-full flex gap-4 h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="w-full md:w-80 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="text-rose-500" size={20} />
              Messages
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search travelers..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-rose-500/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500"></div>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map(conv => (
                <div 
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 mb-1 ${selectedConversation?._id === conv._id ? 'bg-white/10 border border-white/10' : 'border border-transparent'}`}
                >
                  <div className="relative">
                    <img 
                      src={conv.profilePic || "https://i.pravatar.cc/300"} 
                      alt={conv.fullName} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                    />
                    {onlineUsers.includes(conv._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f172a]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{conv.fullName}</h3>
                    <p className="text-xs text-gray-500 truncate">@{conv.username}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 text-sm">
                No conversations found.
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedConversation.profilePic || "https://i.pravatar.cc/300"} 
                    alt={selectedConversation.fullName} 
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <h3 className="font-bold text-sm">{selectedConversation.fullName}</h3>
                    <p className="text-[10px] text-emerald-400">
                      {onlineUsers.includes(selectedConversation._id) ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                <button 
                  onClick={() => startCall(selectedConversation._id, selectedConversation.fullName, selectedConversation.profilePic)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"
                >
                  <Phone size={20} />
                </button>
                <button 
                  onClick={() => startCall(selectedConversation._id, selectedConversation.fullName, selectedConversation.profilePic, "video")}
                  className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"
                >
                  <Video size={20} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white">
                  <MoreVertical size={20} />
                </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messagesLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-rose-500"></div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`flex ${msg.senderId === currentUser?._id ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                        msg.messageType === "call"
                        ? "bg-white/5 border border-white/10 text-gray-400 italic"
                        : msg.senderId === currentUser?._id 
                          ? "bg-rose-500 text-white rounded-tr-none shadow-lg shadow-rose-500/20" 
                          : "bg-white/10 text-gray-200 rounded-tl-none border border-white/5"
                      }`}>
                        {msg.messageType === "call" && (
                          <div className="flex items-center gap-2 mb-1">
                            <Phone size={14} className={msg.callStatus === 'missed' ? 'text-red-400' : 'text-rose-500'} />
                            <span className="font-bold not-italic text-xs uppercase tracking-wider">
                              {msg.callStatus === 'missed' ? 'Missed Call' : 'Voice Call'}
                            </span>
                          </div>
                        )}
                        {msg.message}
                        <p className="text-[10px] opacity-50 mt-1 text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <MessageSquare size={32} />
                    </div>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5 flex items-center gap-3">
                <button type="button" className="text-gray-400 hover:text-white transition-colors">
                  <ImageIcon size={20} />
                </button>
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-grow bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-all"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-rose-500/20"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center">
                <MessageSquare size={48} className="text-rose-500" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">Your Chatroom</h3>
                <p className="text-sm max-w-xs mx-auto">Select a traveler from the list to start chatting about your next journey.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
