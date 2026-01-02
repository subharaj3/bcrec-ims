import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, BookOpen, GraduationCap, Hash, Loader2, AlertCircle } from "lucide-react"; // Added AlertCircle

const ProfileSetup = () => {
    const { user, completeProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(""); // State for error message

    // Form State
    const [rollNumber, setRollNumber] = useState("");
    const [course, setCourse] = useState("B.Tech");
    const [stream, setStream] = useState("CSE");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rollNumber.trim()) return alert("Roll Number is required");

        setIsLoading(true);
        setErrorMsg(""); // Clear previous errors

        try {
            await completeProfile({
                rollNumber: rollNumber.trim(), // Trim whitespace
                course,
                stream,
            });
        } catch (error) {
            console.error("Profile update failed", error);

            // Handle the specific error we threw in AuthContext
            if (error.message === "ROLL_NUMBER_TAKEN") {
                setErrorMsg("This Roll Number is already registered by another student.");
            } else {
                setErrorMsg("Failed to save profile. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white text-center">
                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                        <User size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Welcome, {user?.displayName.split(" ")[0]}!</h2>
                    <p className="text-blue-100 text-sm mt-1">Please complete your profile to continue.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2 border border-red-200 animate-pulse">
                            <AlertCircle size={16} />
                            {errorMsg}
                        </div>
                    )}

                    {/* Roll Number */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                            <Hash size={16} className="text-blue-500" /> College Roll Number
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. 12000119056"
                            className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all font-mono
                ${
                    errorMsg.includes("Roll Number")
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-500"
                }
              `}
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Course */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                <GraduationCap size={16} className="text-blue-500" /> Course
                            </label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                            >
                                <option>B.Tech</option>
                                <option>M.Tech</option>
                                <option>BCA</option>
                                <option>MCA</option>
                                <option>BBA</option>
                            </select>
                        </div>

                        {/* Stream */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                <BookOpen size={16} className="text-blue-500" /> Stream
                            </label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={stream}
                                onChange={(e) => setStream(e.target.value)}
                            >
                                <option>CSE</option>
                                <option>IT</option>
                                <option>CSD</option>
                                <option>CSDS</option>
                                <option>AIML</option>
                                <option>ECE</option>
                                <option>EE</option>
                                <option>ME</option>
                                <option>CE</option>
                            </select>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Save & Continue"}
                    </button>

                    <p className="text-xs text-center text-gray-400 mt-2">
                        These details help admins verify your complaints.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
