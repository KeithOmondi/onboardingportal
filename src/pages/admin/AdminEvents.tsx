import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchEvents } from "../../redux/slices/eventsSlice";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit3, 
  Calendar,
  CheckCircle2,
  Clock,
  Filter
} from "lucide-react";
import type { IJudicialEvent } from "../../interfaces/events.interface";
import EventModal from "../superadmin/EventModal";

const AdminEvents = () => {
  const dispatch = useAppDispatch();
  const { events, loading } = useAppSelector((state) => state.events);
  
  // Modal & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<IJudicialEvent | null>(null);

  useEffect(() => {
    dispatch(fetchEvents("ALL"));
  }, [dispatch]);

  // Handlers
  const handleCreate = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: IJudicialEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#1a3a2a]">Event Management</h1>
          <p className="text-sm text-stone-500">Create, monitor, and update the official judicial calendar.</p>
        </div>
        <button 
          className="flex items-center justify-center gap-2 bg-[#1a3a2a] text-[#C9922A] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#244d38] transition-all shadow-md active:scale-95"
          onClick={handleCreate}
        >
          <Plus size={18} />
          Create New Event
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Events", value: events.length, icon: <Calendar className="text-blue-600" /> },
          { label: "Ongoing Today", value: events.filter(e => new Date(e.start_time) <= new Date() && new Date(e.end_time) >= new Date()).length, icon: <Clock className="text-[#C9922A]" /> },
          { label: "Completed", value: events.filter(e => new Date(e.end_time) < new Date()).length, icon: <CheckCircle2 className="text-green-600" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-stone-200 flex items-center gap-4">
            <div className="p-3 bg-stone-50 rounded-xl">{stat.icon}</div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-stone-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-stone-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text"
              placeholder="Search by title or organizer..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Management Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 text-[11px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">
                <th className="px-6 py-4 font-black">Event Details</th>
                <th className="px-6 py-4 font-black">Schedule</th>
                <th className="px-6 py-4 font-black">Location</th>
                <th className="px-6 py-4 font-black">Status</th>
                <th className="px-6 py-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredEvents.map((event) => {
                const isPast = new Date(event.end_time) < new Date();
                const isOngoing = new Date(event.start_time) <= new Date() && new Date(event.end_time) >= new Date();

                return (
                  <tr key={event.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#1a3a2a] group-hover:text-[#C9922A] transition-colors">{event.title}</span>
                        <span className="text-[11px] text-stone-400 font-medium italic">{event.organizer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs font-semibold text-stone-600">
                        <span>{new Date(event.start_time).toLocaleDateString()}</span>
                        <span className="text-stone-400 font-normal">
                          {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-stone-600">
                      <div className="flex items-center gap-1.5">
                        {event.is_virtual ? <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold">VIRTUAL</span> : <span className="truncate max-w-[120px]">{event.location}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${
                        isOngoing ? "bg-green-100 text-green-700" : isPast ? "bg-stone-100 text-stone-500" : "bg-blue-100 text-blue-700"
                      }`}>
                        {isOngoing ? "Live" : isPast ? "Ended" : "Scheduled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          className="p-2 text-stone-400 hover:text-[#1a3a2a] hover:bg-white rounded-lg transition-all"
                          title="Edit Event"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit3 size={16} />
                        </button>
                        <div className="w-px h-4 bg-stone-200 mx-1" />
                        <button className="p-2 text-stone-400 hover:text-stone-600">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredEvents.length === 0 && !loading && (
            <div className="py-20 text-center flex flex-col items-center gap-2">
              <div className="p-4 bg-stone-50 rounded-full text-stone-300">
                <Calendar size={48} />
              </div>
              <p className="text-stone-500 font-medium">No events found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <EventModal   
        key={selectedEvent?.id || "new-event"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedEvent={selectedEvent} 
      />
    </div>
  );
};

export default AdminEvents;