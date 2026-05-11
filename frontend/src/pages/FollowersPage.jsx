import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Users, ArrowLeft, UserPlus, UserMinus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { UserContext } from "../context/userContext";
import toast from "react-hot-toast";
import "../styles/FollowersPage.css";
import API_BASE_URL from "../config/api";

const FollowersPage = () => {
  const { user: currentUser, setUser } = useContext(UserContext);
  const { username } = useParams();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isOwnList = !username || username === currentUser?.username;

  const handleToggleFollow = async (e, userId) => {
    e.stopPropagation(); // Don't navigate to profile
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user-profile/follow-user`,
        { targetUserId: userId },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const isNowFollowing = response.data.isFollowing;
        
        // Update global context
        setUser(prevUser => {
          if (!prevUser) return null;
          const updatedFollowing = isNowFollowing 
            ? [...prevUser.following, userId]
            : prevUser.following.filter(id => id !== userId);
            
          return {
            ...prevUser,
            following: updatedFollowing
          };
        });

        toast.success(response.data.message, {
          style: { background: "#1e293b", color: "#fff", borderRadius: "12px" }
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Action failed");
    }
  };

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const url = username 
          ? `${API_BASE_URL}/api/user-profile/get-followers/${username}`
          : `${API_BASE_URL}/api/user-profile/get-followers`;
          
        const response = await axios.get(url, { withCredentials: true });
        if (response.data.success) {
          setFollowers(response.data.followers);
        }
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [username]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="followers-container">
      <div className="followers-bg-blob blob-1"></div>
      <div className="followers-bg-blob blob-2"></div>
      
      <Navbar />

      <main className="followers-content">
        <motion.button 
          onClick={() => navigate(-1)}
          className="mb-2 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Profile</span>
        </motion.button>

        <header className="followers-header">
          <motion.h1 
            className="followers-title"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            Followers
          </motion.h1>
          <motion.p 
            className="followers-subtitle"
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            People who follow this traveler
          </motion.p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        ) : followers.length > 0 ? (
          <motion.div 
            className="followers-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {followers.map((follower) => (
              <motion.div 
                key={follower._id}
                variants={itemVariants}
                className="follower-card cursor-pointer"
                onClick={() => navigate(`/profile/${follower.username}`)}
              >
                <img 
                  src={follower.profilePic || "https://i.pravatar.cc/300"} 
                  alt={follower.fullName} 
                  className="follower-avatar"
                />
                <div className="follower-info">
                  <h3 className="follower-name">{follower.fullName}</h3>
                  <p className="follower-username">@{follower.username}</p>
                  {follower.bio && <p className="follower-bio">{follower.bio}</p>}
                </div>
                {currentUser?._id !== follower._id && (
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all duration-300 text-sm ${
                      currentUser?.following?.includes(follower._id)
                        ? "bg-white/10 text-gray-400 border border-white/10 hover:bg-white/20"
                        : "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25"
                    }`}
                    onClick={(e) => handleToggleFollow(e, follower._id)}
                  >
                    {currentUser?.following?.includes(follower._id) ? (
                      <>
                        <UserMinus size={14} />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="empty-state"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="p-4 bg-rose-500/10 rounded-full w-fit mx-auto mb-4">
              <Users size={32} className="text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No followers yet</h3>
            <p className="text-sm text-gray-500 mb-6">Keep sharing your travels to attract fellow explorers!</p>
            <button 
              onClick={() => navigate("/mates")}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 mx-auto"
            >
              <UserPlus size={18} />
              Find People to Follow
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default FollowersPage;
