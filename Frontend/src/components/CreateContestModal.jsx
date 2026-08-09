import { useState } from "react";
import { createContest } from "../api/contestApi";
import toast from "react-hot-toast";

export default function CreateContestModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    visibility: "PUBLIC",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Clean up payload
    const payload = { ...formData };
    if (payload.visibility === "PUBLIC") {
      delete payload.password;
    }

    try {
      await createContest(payload);
      toast.success("Contest created successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create contest");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight">Create Contest</h2>
          <button
            onClick={onClose}
            className="text-black hover:bg-gray-200 p-1 border-2 border-transparent hover:border-black transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm">Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm">End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm">Visibility</label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black font-bold"
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
          </div>

          {formData.visibility === "PRIVATE" && (
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm">Room Password</label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-black bg-white px-4 py-2 font-bold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="border-2 border-black bg-black text-white px-4 py-2 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
