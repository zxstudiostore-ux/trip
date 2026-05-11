import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSocketContext } from "./SocketContext";
import { UserContext } from "./userContext";
import VoiceCallModal from "../components/VoiceCallModal";
import VideoCallModal from "../components/VideoCallModal";
import axios from "axios";
import API_BASE_URL from "../config/api";

const CallContext = createContext();

export const useCallContext = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const { user } = useContext(UserContext);

  const [callStatus, setCallStatus] = useState("idle"); // idle, incoming, outgoing, connected
  const [callType, setCallType] = useState("audio"); // audio or video
  const [callData, setCallData] = useState(null); // { peerId, peerName, peerImage, offer }
  
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const remoteAudioRef = useRef(new Audio());
  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const outgoingRingRef = useRef(new Audio("https://www.soundjay.com/phone/phone-calling-1.mp3"));
  const callTimeoutRef = useRef(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    ringtoneRef.current.loop = true;
    outgoingRingRef.current.loop = true;
  }, []);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const initPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection(iceServers);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", { 
          to: callData?.peerId, 
          candidate: event.candidate 
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      remoteStream.current = event.streams[0];
      if (callType === "audio") {
        remoteAudioRef.current.srcObject = remoteStream.current;
        remoteAudioRef.current.play();
      }
    };
  };

  const startCall = async (receiverId, receiverName, receiverImage, type = "audio") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: type === "video" 
      });
      localStream.current = stream;
      
      setCallType(type);
      setCallData({ 
        peerId: receiverId, 
        peerName: receiverName, 
        peerImage: receiverImage 
      });
      setCallStatus("outgoing");
      outgoingRingRef.current.play().catch(e => console.log("Audio play blocked:", e));

      // Missed call timeout (45 seconds)
      callTimeoutRef.current = setTimeout(() => {
        if (callStatus === "outgoing") {
          saveCallHistory("missed");
          endCall();
        }
      }, 45000);

      initPeerConnection();
      
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call-user", {
        to: receiverId,
        offer,
        fromName: user?.fullName || "Traveler",
        fromImage: user?.profilePic || "",
        callType: type
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      if (err.name === "NotAllowedError") {
        alert("Permission denied. Please allow microphone and camera access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        if (type === "video") {
          const tryVoice = window.confirm("No camera found. Would you like to start a voice call instead?");
          if (tryVoice) {
            startCall(receiverId, receiverName, receiverImage, "audio");
          }
        } else {
          alert("No microphone found on this device.");
        }
      } else {
        alert("Could not access media devices. Please check your settings.");
      }
    }
  };

  const acceptCall = async () => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: callType === "video" 
        });
      } catch (videoErr) {
        if (callType === "video") {
          console.log("Video access failed, falling back to audio-only");
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setCallType("audio"); // Change call type to audio if video fails
        } else {
          throw videoErr;
        }
      }
      localStream.current = stream;

      initPeerConnection();

      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(callData.offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer-call", { to: callData.peerId, answer });
      setCallStatus("connected");
    } catch (err) {
      console.error("Failed to accept call:", err);
      if (err.name === "NotAllowedError") {
        alert("Permission denied. Please allow microphone and camera access to join the call.");
      } else {
        alert("Could not access media devices.");
      }
    }
  };

  const rejectCall = () => {
    socket.emit("reject-call", { to: callData.peerId });
    setCallStatus("idle");
    setCallData(null);
  };

  const endCall = () => {
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
    
    saveCallHistory("ended", formatDuration(duration));
    socket.emit("end-call", { to: callData?.peerId });
    cleanup();
  };

  const saveCallHistory = async (status, duration = "0:00") => {
    const targetId = callData?.peerId;
    if (!targetId) return;

    try {
      const logMessage = status === "missed" 
        ? `Missed ${callType} call` 
        : `${callType === 'video' ? 'Video' : 'Voice'} call ended (${duration})`;

      await axios.post(`${API_BASE_URL}/api/chat/call-log/${targetId}`, {
        message: logMessage,
        callStatus: status,
        callDuration: duration
      }, { withCredentials: true });
    } catch (err) {
      console.error("Failed to save call log:", err);
    }
  };

  const cleanup = () => {
    console.log("Cleaning up call...");
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    if (outgoingRingRef.current) {
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
    }
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setCallStatus("idle");
    setCallData(null);
    setStartTime(null);
    remoteAudioRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", (data) => {
      setCallData({
        peerId: data.from,
        peerName: data.fromName,
        peerImage: data.fromImage,
        offer: data.offer
      });
      setCallType(data.callType || "audio");
      setCallStatus("incoming");
      ringtoneRef.current.play().catch(e => console.log("Audio play blocked:", e));
    });

    socket.on("call-answered", async ({ answer }) => {
      ringtoneRef.current.pause();
      outgoingRingRef.current.pause();
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);

      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("connected");
        setStartTime(Date.now());
      }
    });

    socket.on("call-rejected", () => {
      saveCallHistory("rejected");
      cleanup();
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call-ended", () => {
      cleanup();
    });

    socket.on("stop-ringing", () => {
      console.log("Stopping ringing from another tab...");
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
      if (outgoingRingRef.current) {
        outgoingRingRef.current.pause();
        outgoingRingRef.current.currentTime = 0;
      }
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("call-rejected");
      socket.off("ice-candidate");
      socket.off("call-ended");
      socket.off("stop-ringing");
    };
  }, [socket, callData]);

  return (
    <CallContext.Provider value={{ startCall, acceptCall, rejectCall, endCall, callStatus, callData, callType }}>
      {children}
      {callType === "audio" ? (
        <VoiceCallModal 
          callData={callData}
          callStatus={callStatus}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
        />
      ) : (
        <VideoCallModal 
          callData={callData}
          callStatus={callStatus}
          localStream={localStream.current}
          remoteStream={remoteStream.current}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
        />
      )}
    </CallContext.Provider>
  );
};
