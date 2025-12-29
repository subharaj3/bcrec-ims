// Cloudinary Config
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;

// UPLOAD IMAGE FUNCTION
export const uploadEvidence = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Image upload failed");

        const data = await response.json();
        return data.secure_url; // Returns the HTTPs URL of the uploaded image
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
};