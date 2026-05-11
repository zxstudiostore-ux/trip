import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { UserContext } from "../context/userContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plane,
  Heart,
  UserPlus,
  Search,
  Filter,
  MessageSquare,
  Star,
  Users,
  Loader2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] },
  },
};

const FindMatesPage = () => {
  const { user, setUser } = useContext(UserContext); // Get 'user' to check current user ID
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const navigate = useNavigate();

  const observer = useRef();
  const lastUserElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchUsers = useCallback(async (pageNum, query) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/user-profile/get-profiles-from-username`,
        {
          params: {
            username: query,
            page: pageNum,
            limit: 10,
          },
          withCredentials: true,
        }
      );

      const data = response.data;
      if (data.users) {
        // Update users list
        if (pageNum === 1) {
          setUsers(data.users);
        } else {
          setUsers((prev) => [...prev, ...data.users]);
        }
        setHasMore(data.hasMore);

        // Sync follow status: Check which of these users are followed by the logged-in user
        if (user && user._id) {
          const currentlyFollowed = new Set();
          data.users.forEach((u) => {
            if (u.followers && u.followers.includes(user._id)) {
              currentlyFollowed.add(u._id);
            }
          });
          
          setFollowedUsers((prev) => {
            const next = new Set(prev);
            currentlyFollowed.forEach(id => next.add(id));
            return next;
          });
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Fetch users error details:", error.response || error);
      toast.error(error.response?.data?.message || "Failed to fetch travelers");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user]); // Add 'user' as dependency to re-check when user context is ready

  // Reset and fetch when search query changes
  useEffect(() => {
    setPage(1);
    fetchUsers(1, searchQuery);
  }, [searchQuery, fetchUsers]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchUsers(page, searchQuery);
    }
  }, [page, searchQuery, fetchUsers]);

  const handleFollow = async (userId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user-profile/follow-user`,
        { targetUserId: userId },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update local UI state
        setFollowedUsers((prev) => {
          const newSet = new Set(prev);
          const isFollowing = newSet.has(userId);
          if (isFollowing) {
            newSet.delete(userId);
            toast.success("Unfollowed successfully", {
              style: {
                background: "#321B22",
                color: "#fff",
                borderRadius: "12px",
                fontSize: "12px",
              },
            });
          } else {
            newSet.add(userId);
            toast.success("Started following!", {
              style: {
                background: "#321B22",
                color: "#fff",
                borderRadius: "12px",
                fontSize: "12px",
              },
            });
          }

          // Update global UserContext to sync Profile page
          setUser((prevUser) => {
            if (!prevUser) return null;
            const updatedFollowing = isFollowing
              ? prevUser.following.filter((id) => id !== userId)
              : [...prevUser.following, userId];
            return { ...prevUser, following: updatedFollowing };
          });

          return newSet;
        });
      }
    } catch (error) {
      console.error("Follow error:", error);
      toast.error(
        error.response?.data?.message || "Failed to update follow status"
      );
    }
  };

  return (
    <div className="bg-[#0f172a] min-h-screen flex flex-col text-gray-200 font-sans overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 z-10 max-w-7xl mx-auto w-full">
        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-8 space-y-4"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3.5 rounded-xl border transition-all flex items-center gap-2 ${
                showFilters
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              }`}
            >
              <Filter size={20} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex flex-wrap gap-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">
                    Travel Style
                  </label>
                  <div className="flex gap-2">
                    {["all", "budget", "mid-range", "luxury"].map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                          selectedStyle === style
                            ? "bg-rose-500 text-white"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {style === "all" ? "All" : style}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">
                    Gender
                  </label>
                  <div className="flex gap-2">
                    {["all", "male", "female", "other"].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setSelectedGender(gender)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                          selectedGender === gender
                            ? "bg-rose-500 text-white"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {gender === "all" ? "All" : gender}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* User Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {users.map((user, index) => {
            if (users.length === index + 1) {
              return (
                <motion.div ref={lastUserElementRef} key={user._id} variants={itemVariants}>
                  <UserCard user={user} handleFollow={handleFollow} followedUsers={followedUsers} navigate={navigate} />
                </motion.div>
              );
            } else {
              return (
                <motion.div key={user._id} variants={itemVariants}>
                  <UserCard user={user} handleFollow={handleFollow} followedUsers={followedUsers} navigate={navigate} />
                </motion.div>
              );
            }
          })}
        </motion.div>

        {loading && (
          <div className="flex justify-center mt-10">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        )}



        {!loading && users.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Search size={32} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No travelers found</h3>
            <p className="text-gray-500 mb-6">Try searching for another username.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

const UserCard = ({ user, handleFollow, followedUsers, navigate }) => (
  <div 
    onClick={() => navigate(`/profile/${user.username}`)}
    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:border-rose-500/30 hover:bg-white/[0.07] transition-all duration-300 group relative overflow-hidden cursor-pointer"
  >
    {/* Profile Pic */}
    <div className="relative shrink-0">
      <img
        src={user.profilePic || "https://i.pravatar.cc/300"}
        alt={user.fullName}
        className="w-10 h-10 rounded-full object-cover border border-white/20 group-hover:border-rose-500 transition-colors"
      />
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#0f172a]" />
    </div>

    {/* Info & Bio */}
    <div className="flex-1 min-w-0 pr-2">
      <div className="flex items-baseline gap-1.5">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
          {user.fullName}
        </h3>
        <span className="text-[10px] text-gray-500 truncate">@{user.username}</span>
      </div>
      <p className="text-[10px] text-gray-400 line-clamp-1">
        {user.bio || "Active traveler"}
      </p>
    </div>

    {/* Actions */}
    <div className="flex gap-1.5 shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleFollow(user._id);
        }}
        className={`p-2 rounded-lg transition-all flex items-center justify-center ${
          followedUsers.has(user._id)
            ? "bg-rose-500/20 text-rose-400 border border-rose-500/20"
            : "bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
        }`}
        title={followedUsers.has(user._id) ? "Unfollow" : "Follow"}
      >
        <UserPlus size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate("/chat");
        }}
        className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all shadow-sm"
      >
        <MessageSquare size={14} />
      </button>
    </div>
  </div>
);

export default FindMatesPage;
