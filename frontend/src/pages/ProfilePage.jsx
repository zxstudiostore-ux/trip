import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link, useParams } from "react-router-dom";
import API_BASE_URL from "../config/api";
import {
  MapPin,
  Calendar,
  Users,
  Heart,
  Plane,
  Edit3,
  Mail,
  Briefcase,
  Star,
  X,
  Loader2,
  UserPlus,
  UserMinus,
  MessageSquare,
} from "lucide-react";
import Navbar from "../components/Navbar";

import { UserContext } from "../context/userContext";
import toast from "react-hot-toast";

const defaultAvatar =
  "https://ui-avatars.com/api/?name=User&background=f43f5e&color=fff&size=256";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] },
  },
};

const ProfilePage = () => {
  const { user: currentUser, setUser: setCurrentUser } = useContext(UserContext);
  const { username } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    bio: "",
    age: "",
    gender: "",
  });
  const [isTravelEditModalOpen, setIsTravelEditModalOpen] = useState(false);
  const [travelStyles, setTravelStyles] = useState([]);
  const [travelInterests, setTravelInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef(null);

  const isOwnProfile = !username || username === currentUser?.username;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const url = username 
          ? `${API_BASE_URL}/api/user-profile/get-user-profile/${username}`
          : `${API_BASE_URL}/api/user-profile/get-my-profile`;
        
        const res = await axios.get(url, { withCredentials: true });
        const fetchedUser = res.data.user || res.data;
        setProfileData(fetchedUser);
        
        if (isOwnProfile) {
          setCurrentUser(fetchedUser);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err.response?.data || err.message);
        toast.error("Could not load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, currentUser?.username]);

  if (loading) {
    return (
      <div className="min-height-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-500" size={48} />
      </div>
    );
  }

  // Fallback data matching the Mongoose schema structure
  const currentProfile = profileData || {
    _id: "mock-user-id",
    username: "wanderlust_alex",
    email: "alex@example.com",
    fullName: "Alex Traveler",
    bio: "Adventure seeker and food lover. Always planning the next escape! 🌍✈️",
    age: 28,
    gender: "other",
    location: {
      city: "New York",
      country: "USA",
    },
    travelInterests: [
      "Hiking",
      "Photography",
      "Street Food",
      "Hidden Gems",
      "Backpacking",
    ],
    travelStyles: ["Budget Friendly", "Off the Beaten Path"],
    profilePic: defaultAvatar,
    followers: [],
    following: [],
    trips: [],
    createdAt: new Date(),
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently joined";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const getTravelStyleColor = (style) => {
    switch (style) {
      case "Budget":
      case "budget":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Luxury":
      case "luxury":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    }
  };

  const handleEditClick = () => {
    setEditFormData({
      fullName: profileData.fullName || "",
      bio: profileData.bio || "",
      age: profileData.age || "",
      gender: profileData.gender || "",
    });
    setIsEditModalOpen(true);
  };

  const handleTravelEditClick = () => {
    setTravelStyles(profileData.travelStyle || []);
    setTravelInterests(profileData.travelInterests || []);
    setCustomInterest("");
    setIsTravelEditModalOpen(true);
  };

  const toggleTravelStyle = (style) => {
    setTravelStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
  };

  const toggleInterest = (interest) => {
    setTravelInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (
      trimmed &&
      !travelInterests.includes(trimmed) &&
      travelInterests.length < 10
    ) {
      setTravelInterests((prev) => [...prev, trimmed]);
      setCustomInterest("");
    }
  };

  const handleTravelEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {};
      if (travelInterests.length > 0) payload.travelInterests = travelInterests;
      if (travelStyles.length > 0) payload.travelStyles = travelStyles;

      await axios.post(
        `${API_BASE_URL}/api/user-profile/add-interests`,
        payload,
        { withCredentials: true },
      );

      // Refetch profile to get updated data
      const res = await axios.get(
        `${API_BASE_URL}/api/user-profile/get-my-profile`,
        { withCredentials: true },
      );
      setUser(res.data.user || res.data);
      setIsTravelEditModalOpen(false);
      toast.success("Travel preferences updated!", {
        style: { background: "#321B22", color: "#fff", borderRadius: "12px" },
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update preferences.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {};
      if (editFormData.fullName) payload.fullName = editFormData.fullName;
      if (editFormData.bio) payload.bio = editFormData.bio;
      if (editFormData.age) payload.age = Number(editFormData.age);
      if (editFormData.gender) payload.gender = editFormData.gender;

      const res = await axios.post(
        `${API_BASE_URL}/api/user-profile/edit-profile`,
        payload,
        { withCredentials: true },
      );
      setUser(res.data.user || res.data);
      setIsEditModalOpen(false);
      toast.success("Profile updated successfully!", {
        style: { background: "#321B22", color: "#fff", borderRadius: "12px" },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("profilePic", file);
      try {
        const res = await axios.put(
          `${API_BASE_URL}/api/user-profile/update-profile-pic`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        setUser(res.data.user || res.data);
        toast.success("Profile picture updated!", {
          style: {
            background: "#321B22",
            color: "#fff",
            borderRadius: "12px",
          },
        });
      } catch (err) {
        toast.error("Failed to upload image.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/user-profile/logout`,
        {},
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setCurrentUser(null);
      toast.success("Logged out successfully!", {
        style: { background: "#321B22", color: "#fff", borderRadius: "12px" },
      });
      navigate("/");
    }
  };

  const handleToggleFollow = async () => {
    if (!profileData) return;
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user-profile/follow-user`,
        { targetUserId: profileData._id },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const isNowFollowing = response.data.isFollowing;
        
        // Update local profile data to reflect new follower count
        setProfileData(prev => {
          const updatedFollowers = isNowFollowing 
            ? [...(prev.followers || []), currentUser._id]
            : (prev.followers || []).filter(id => id !== currentUser._id);
          return { ...prev, followers: updatedFollowers };
        });

        // Update global context
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const updatedFollowing = isNowFollowing 
            ? [...(prevUser.following || []), profileData._id]
            : (prevUser.following || []).filter(id => id !== profileData._id);
            
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



  return (
    <div className="bg-[#0f172a] min-h-screen flex flex-col text-gray-200 font-sans overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 z-10 max-w-7xl mx-auto w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column: Profile Card */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {/* Main Profile Card */}
              <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center text-center">
                <motion.div
                  className={`relative mb-6 group ${isOwnProfile ? 'cursor-pointer' : ''}`}
                  whileHover={isOwnProfile ? { scale: 1.05 } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => isOwnProfile && fileInputRef.current?.click()}
                >
                  <img
                    src={currentProfile.profilePic || defaultAvatar}
                    alt={currentProfile.fullName}
                    className="w-36 h-36 rounded-full object-cover border-4 border-white/10 shadow-xl group-hover:border-rose-500/50 transition-colors duration-300"
                  />
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <Edit3 size={24} className="text-white" />
                    </div>
                  )}
                </motion.div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                />

                <h2 className="text-2xl font-bold text-white mb-1">
                  {currentProfile.fullName}
                </h2>
                <p className="text-rose-400 font-medium mb-3">
                  @{currentProfile.username}
                </p>

                {currentProfile.bio && (
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 px-2">
                    {currentProfile.bio}
                  </p>
                )}

                <div className="w-full space-y-4 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <MapPin size={16} /> Location
                    </span>
                    <span className="text-gray-300 font-medium">
                      {currentProfile.location?.city
                        ? `${currentProfile.location.city}, ${currentProfile.location.country}`
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar size={16} /> Joined
                    </span>
                    <span className="text-gray-300 font-medium">
                      {formatDate(currentProfile.createdAt)}
                    </span>
                  </div>
                  {isOwnProfile && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Mail size={16} /> Email
                      </span>
                      <span className="text-gray-300 font-medium">
                        {currentProfile.email}
                      </span>
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <motion.button
                    onClick={handleEditClick}
                    className="w-full py-3 mt-6 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all duration-300 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Edit3 size={18} />
                    <span>Edit Profile</span>
                  </motion.button>
                )}
                {isOwnProfile && (
                  <motion.button
                    onClick={handleLogout}
                    className="w-full py-3 mt-3 border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </motion.button>
                )}

                {!isOwnProfile && (
                  <motion.button
                    onClick={handleToggleFollow}
                    className={`w-full py-3 mt-6 font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      currentUser?.following?.includes(currentProfile._id)
                        ? "bg-white/10 text-gray-400 border border-white/10 hover:bg-white/20"
                        : "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/25"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {currentUser?.following?.includes(currentProfile._id) ? (
                      <>
                        <UserMinus size={18} />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Follow</span>
                      </>
                    )}
                  </motion.button>
                )}

                {!isOwnProfile && (
                  <motion.button
                    onClick={() => navigate("/chat")}
                    className="w-full py-3 mt-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <MessageSquare size={18} />
                    <span>Message</span>
                  </motion.button>
                )}
              </div>

              {/* Stats Card */}
              <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden relative">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <Link to={isOwnProfile ? "/followers" : `/profile/${currentProfile.username}/followers`}>
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="space-y-1 cursor-pointer transition-colors hover:text-rose-400 group"
                    >
                      <p className="text-2xl font-bold text-white group-hover:text-rose-400">
                        {currentProfile.followers?.length || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold group-hover:text-rose-300">
                        Followers
                      </p>
                    </motion.div>
                  </Link>

                  <Link to={isOwnProfile ? "/following" : `/profile/${currentProfile.username}/following`}>
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="space-y-1 border-x border-white/10 cursor-pointer transition-colors hover:text-rose-400 group"
                    >
                      <p className="text-2xl font-bold text-white group-hover:text-rose-400">
                        {currentProfile.following?.length || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold group-hover:text-rose-300">
                        Following
                      </p>
                    </motion.div>
                  </Link>
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="space-y-1 cursor-pointer transition-colors hover:text-blue-400 group"
                  >
                    <p className="text-2xl font-bold text-white group-hover:text-blue-400">
                      {currentProfile.trips?.length || 0}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold group-hover:text-blue-300">
                      Trips
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Details & Interests */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 space-y-8"
          >
            {/* Personal Details */}
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users size={20} className="text-rose-400" />
                Personal Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-gray-200 font-medium">
                    {currentProfile.fullName}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="text-gray-200 font-medium">
                    @{currentProfile.username}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="text-gray-200 font-medium">
                    {currentProfile.age || "Not specified"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="text-gray-200 font-medium capitalize">
                    {currentProfile.gender || "Not specified"}
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-gray-200 font-medium">
                    {currentProfile.location?.city
                      ? `${currentProfile.location.city}, ${currentProfile.location.country}`
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Travel Preferences */}
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plane size={20} className="text-rose-400" />
                  Travel Preferences
                </h3>
                {isOwnProfile && (
                  <motion.button
                    onClick={handleTravelEditClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit3 size={14} />
                    Edit
                  </motion.button>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Travel Style</p>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.travelStyles?.length > 0 ? (
                      currentProfile.travelStyles.map((style, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium capitalize ${getTravelStyleColor(
                            style,
                          )}`}
                        >
                          <Star size={14} />
                          {style}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Not specified</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Travel Interests</p>
                  <div className="flex flex-wrap gap-3">
                    {currentProfile.travelInterests?.length > 0 ? (
                      currentProfile.travelInterests.map((interest, idx) => (
                        <motion.span
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-gray-300 text-sm hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-300 transition-all duration-300 cursor-default"
                        >
                          {interest}
                        </motion.span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No interests added yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/saved-trips">
                  <motion.div
                    className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 hover:border-rose-500/30 transition-all duration-300 group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                      <Heart size={24} />
                    </div>
                    <span className="text-white font-bold">Saved Trips</span>
                  </motion.div>
                </Link>
                <Link to="/my-journeys">
                  <motion.div
                    className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                      <Plane size={24} />
                    </div>
                    <span className="text-white font-bold">My Journeys</span>
                  </motion.div>
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl p-6 relative"
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold text-white mb-6">
                Edit Profile
              </h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={editFormData.bio}
                    onChange={handleEditChange}
                    rows="3"
                    maxLength="300"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={editFormData.age}
                    onChange={handleEditChange}
                    min="1"
                    max="120"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all appearance-none"
                  >
                    <option value="" className="bg-[#1e293b]">
                      Select Gender
                    </option>
                    <option value="Male" className="bg-[#1e293b]">
                      Male
                    </option>
                    <option value="Female" className="bg-[#1e293b]">
                      Female
                    </option>
                    <option value="Other" className="bg-[#1e293b]">
                      Other
                    </option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Travel Preferences Edit Modal */}
      <AnimatePresence>
        {isTravelEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsTravelEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsTravelEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold text-white mb-6">
                Edit Travel Preferences
              </h2>
              <form onSubmit={handleTravelEditSubmit} className="space-y-6">
                {/* Travel Style Multi-Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Travel Style (Select one or more)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {["Budget", "Mid-Range", "Luxury"].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleTravelStyle(style)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          travelStyles.includes(style)
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Travel Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Travel Interests (Select or add your own)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      "Hiking",
                      "Photography",
                      "Street Food",
                      "Beach Vibes",
                      "Cultural Heritage",
                    ].map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          travelInterests.includes(interest)
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>

                  {/* Custom Interest Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInterest}
                      onChange={(e) => {
                        if (e.target.value.length <= 15) {
                          setCustomInterest(e.target.value);
                        }
                      }}
                      placeholder="Add custom interest (max 15 chars)"
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-sm"
                      maxLength={15}
                    />
                    <button
                      type="button"
                      onClick={addCustomInterest}
                      disabled={!customInterest.trim()}
                      className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>

                  {/* Selected Interests */}
                  {travelInterests.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {travelInterests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className="ml-1 text-gray-500 hover:text-rose-400 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTravelEditModalOpen(false)}
                    className="flex-1 py-3 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
