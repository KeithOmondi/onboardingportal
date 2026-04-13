import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import { createEvent, updateEvent } from "../../redux/slices/eventsSlice";
import type { IJudicialEvent } from "../../interfaces/events.interface";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: IJudicialEvent | null;
}

const EventModal = ({ isOpen, onClose, selectedEvent }: EventModalProps) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  // Direct initialization: State is set once when the component mounts.
  // The 'key' prop on the parent will handle resetting this state.
  const [formData, setFormData] = useState<Partial<IJudicialEvent>>(
    selectedEvent || {
      title: "",
      description: "",
      location: "",
      organizer: "",
      start_time: "",
      end_time: "",
      is_virtual: false,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedEvent?.id) {
        await dispatch(updateEvent(formData)).unwrap();
      } else {
        await dispatch(createEvent(formData)).unwrap();
      }
      onClose();
    } catch (error) {
      console.error("Failed to save event:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h2 className="text-xl font-bold font-serif text-[#1a3a2a]">
            {selectedEvent ? "Edit Judicial Event" : "Create New Event"}
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-black uppercase text-stone-400 mb-1">Event Title</label>
              <input 
                required
                type="text" 
                className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#1a3a2a]/10 outline-none"
                placeholder="e.g., Supreme Court Bench Briefing"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-stone-400 mb-1">Organizer</label>
              <input 
                required
                type="text" 
                className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#1a3a2a]/10 outline-none"
                placeholder="Office of the Registrar"
                value={formData.organizer}
                onChange={(e) => setFormData({...formData, organizer: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-stone-400 mb-1">Location</label>
              <input 
                required
                type="text" 
                className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#1a3a2a]/10 outline-none"
                placeholder={formData.is_virtual ? "Link (Teams/Zoom)" : "Courtroom/Chamber"}
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-stone-400 mb-1">Start Date & Time</label>
              <input 
                required
                type="datetime-local" 
                className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#1a3a2a]/10 outline-none"
                value={formData.start_time ? formData.start_time.toString().slice(0, 16) : ""}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-stone-400 mb-1">End Date & Time</label>
              <input 
                required
                type="datetime-local" 
                className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#1a3a2a]/10 outline-none"
                value={formData.end_time ? formData.end_time.toString().slice(0, 16) : ""}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-stone-400 mb-1">Description</label>
            <textarea 
              rows={3}
              className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#1a3a2a]/10 outline-none resize-none"
              placeholder="Provide details about the judicial session..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
            <input 
              type="checkbox" 
              id="is_virtual"
              className="w-5 h-5 accent-[#1a3a2a]"
              checked={formData.is_virtual}
              onChange={(e) => setFormData({...formData, is_virtual: e.target.checked})}
            />
            <label htmlFor="is_virtual" className="text-sm font-bold text-stone-600 cursor-pointer">
              This is a Virtual Session (Microsoft Teams / Zoom)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#1a3a2a] text-[#C9922A] px-8 py-2.5 rounded-xl font-bold hover:bg-[#244d38] transition-all shadow-lg min-w-[140px] disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Save Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;