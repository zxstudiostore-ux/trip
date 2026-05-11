import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { UserMinus, ArrowLeft, Search, Plane, UserPlus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { UserContext } from "../context/userContext";
import toast from "react-hot-toast";
import "../styles/FollowingPage.css";
import API_BASE_URL from "../config/api";

const FollowingPage = () => {
  const { user: currentUser, setUser } = useContext(UserContext);
  const { username } = useParams();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const isOwnList = !username || username === currentUser?.username;

  useEffect(() => {
    fetchFollowing();
  }, [username]);

  const fetchFollowing = async () => {
    try {
      const url = username 
        ? `${API_BASE_URL}/api/user-profile/get-following/${username}`
        : `${API_BASE_URL}/api/user-profile/get-following`;

      const response = await axios.get(url, { withCredentials: true });
      if (response.data.success) {
        setFollowing(response.data.following);
      }
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setLoading(false);
    }
  };

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

        if (isOwnList && !isNowFollowing) {
          // Remove from local list only if it's my own following list and I unfollowed
          setFollowing(prev => prev.filter(user => user._id !== userId));
        }
        
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

  const filteredFollowing = following.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="following-container">
      <div className="following-bg-blob blob-1"></div>
      <div className="following-bg-blob blob-2"></div>
      
      <Navbar />

      <main className="following-content">
        <motion.button 
          onClick={() => navigate(-1)}
          className="mb-2 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Profile</span>
        </motion.button>

        <header className="following-header">
          <motion.h1 
            className="following-title"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            Following
          </motion.h1>
          <motion.div 
            className="following-search-container relative max-w-md mx-auto mt-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text"
              placeholder="Search your friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="following-search-input w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </motion.div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredFollowing.length > 0 ? (
          <div className="following-list">
            <AnimatePresence mode="popLayout">
              {filteredFollowing.map((user) => (
                <motion.div 
                  key={user._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  className="following-card"
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <div className="following-avatar-wrapper">
                    <img 
                      src={user.profilePic || "https://i.pravatar.cc/300"} 
                      alt={user.fullName} 
                      className="following-avatar"
                    />
                  </div>
                  <div className="following-info">
                    <h3 className="following-name">{user.fullName}</h3>
                    <p className="following-username">@{user.username}</p>
                  </div>
                  {isOwnList ? (
                    <button 
                      className="unfollow-btn flex items-center gap-2"
                      onClick={(e) => handleToggleFollow(e, user._id)}
                    >
                      <UserMinus size={16} />
                      <span>Unfollow</span>
                    </button>
                  ) : (
                    currentUser?._id !== user._id && (
                      <button 
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all duration-300 text-sm ${
                          currentUser?.following?.includes(user._id)
                            ? "bg-white/10 text-gray-400 border border-white/10 hover:bg-white/20"
                            : "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25"
                        }`}
                        onClick={(e) => handleToggleFollow(e, user._id)}
                      >
                        {currentUser?.following?.includes(user._id) ? (
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
                    )
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="p-4 bg-blue-500/10 rounded-full w-fit mx-auto mb-4">
              <Search size={32} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {searchTerm ? "No results found" : "Not following anyone yet"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm ? "Try searching for someone else" : "Adventure is better with friends!"}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => navigate("/mates")}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 mx-auto"
              >
                <Plane size={18} />
                Explore Travelers
              </button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default FollowingPage;
