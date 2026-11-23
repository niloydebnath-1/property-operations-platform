"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
  X,
  ExternalLink,
  Layers,
  CalendarDays,
  ListFilter,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toLocalDateKey(d: Date | string): string {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar Navigation State - Dynamic current date based on local system date
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateKey(new Date()));
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">("month");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const todayKey = useMemo(() => toLocalDateKey(new Date()), []);

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string>("");

  // Schedule Appointment Form
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("WORK_ORDER");
  const [newDate, setNewDate] = useState<string>(() => toLocalDateKey(new Date()));
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("11:00");
  const [newLocation, setNewLocation] = useState("Grand View Heights - Suite 204");
  const [newAssignee, setNewAssignee] = useState("Field Technician");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  function loadEvents() {
    setLoading(true);
    api("/calendar")
      .then((d) => {
        setEvents(d.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  function prevMonth() {
    const nextDate = new Date(year, month - 1, 1);
    setCurrentDate(nextDate);
    setSelectedDate(toLocalDateKey(nextDate));
  }

  function nextMonth() {
    const nextDate = new Date(year, month + 1, 1);
    setCurrentDate(nextDate);
    setSelectedDate(toLocalDateKey(nextDate));
  }

  function jumpToToday() {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(toLocalDateKey(now));
  }

  // Filtered Events - Sorted DESCENDING (newest / most recently appointed first at the top)
  const filteredEvents = useMemo(() => {
    let list = events;
    if (typeFilter !== "ALL") {
      list = events.filter((e) => e.eventType === typeFilter);
    }
    return [...list].sort((a, b) => {
      const timeB = new Date(b.startAt).getTime();
      const timeA = new Date(a.startAt).getTime();
      if (timeB !== timeA) return timeB - timeA;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return createdB - createdA;
    });
  }, [events, typeFilter]);

  // Generate Month Grid (42 cells: 6 weeks x 7 days)
  const monthGrid = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // 1. Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateObj = new Date(year, month - 1, d);
      cells.push({
        dateObj,
        dayNum: d,
        isCurrentMonth: false,
        dateKey: toLocalDateKey(dateObj),
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      cells.push({
        dateObj,
        dayNum: d,
        isCurrentMonth: true,
        dateKey: toLocalDateKey(dateObj),
      });
    }

    // 3. Next month padding days to complete 35 or 42 cells
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      cells.push({
        dateObj,
        dayNum: d,
        isCurrentMonth: false,
        dateKey: toLocalDateKey(dateObj),
      });
    }

    return cells;
  }, [year, month]);

  // Map events to dateKey (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const ev of filteredEvents) {
      if (!ev.startAt) continue;
      const key = toLocalDateKey(ev.startAt);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [filteredEvents]);

  // Week View Days (7 days of selected date's week)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateKey = toLocalDateKey(d);
      days.push({
        dateObj: d,
        dayNum: d.getDate(),
        dayName: DAY_NAMES[d.getDay()],
        dateKey,
        isToday: dateKey === todayKey,
      });
    }
    return days;
  }, [currentDate]);

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const startAt = new Date(`${newDate}T${newStartTime}:00`).toISOString();
      const endAt = new Date(`${newDate}T${newEndTime}:00`).toISOString();

      await api("/calendar", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          eventType: newType,
          startAt,
          endAt,
          location: newLocation,
          assignee: newAssignee,
          description: newDescription,
        }),
      });

      setCreating(false);
      setShowScheduleModal(false);
      setNewTitle("");
      setNewDescription("");
      loadEvents();
    } catch (err: any) {
      setCreating(false);
      alert(err.message || "Failed to schedule appointment");
    }
  }

  function getBadgeColor(type: string, priority?: string) {
    if (priority === "EMERGENCY") return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
    if (priority === "HIGH") return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
    switch (type) {
      case "WORK_ORDER":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "INSPECTION":
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
      case "PREVENTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "APPOINTMENT":
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-blue-600 font-extrabold bg-blue-50 px-2.5 py-0.5 rounded-full">
              Field Dispatch & Scheduling
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Synchronized with Work Orders, Site Visits & Preventive Plans
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Master Operations Calendar</h1>
          <p className="text-xs text-slate-500">
            Coordinate field appointments, emergency work order dispatches, quality inspections, and vendor maintenance windows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setNewDate(selectedDate || toLocalDateKey(new Date(year, month, 1)));
              setShowScheduleModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus size={15} /> Schedule Appointment
          </button>
        </div>
      </div>

      {/* Calendar Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={jumpToToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {MONTH_NAMES[month]} {year}
          </h2>

          <span className="text-[11px] font-semibold text-slate-400 border-l border-slate-200 pl-3 hidden sm:inline-block">
            {filteredEvents.length} scheduled operations
          </span>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                typeFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("WORK_ORDER")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                typeFilter === "WORK_ORDER" ? "bg-blue-600 text-white shadow-2xs" : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Work Orders
            </button>
            <button
              onClick={() => setTypeFilter("INSPECTION")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                typeFilter === "INSPECTION" ? "bg-purple-600 text-white shadow-2xs" : "text-purple-600 hover:bg-purple-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Inspections
            </button>
            <button
              onClick={() => setTypeFilter("PREVENTIVE")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                typeFilter === "PREVENTIVE" ? "bg-emerald-600 text-white shadow-2xs" : "text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Preventive
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "month" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "week" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "agenda" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MONTH GRID CALENDAR VIEW                                               */}
      {/* ========================================================================= */}
      {viewMode === "month" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Day of Week Header - Sleek Dark Bezel with Clean Typography */}
          <div className="grid grid-cols-7 bg-slate-800 text-center py-3.5 border-b border-slate-700">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="text-xs font-black uppercase tracking-widest text-slate-200"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 42 Calendar Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/30">
            {monthGrid.map((cell, idx) => {
              const dayEvents = eventsByDate[cell.dateKey] || [];
              const isToday = cell.dateKey === todayKey;
              const isSelected = selectedDate === cell.dateKey;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(cell.dateKey)}
                  className={`min-h-[110px] md:min-h-[130px] p-2 bg-white flex flex-col justify-between transition-all hover:bg-blue-50/20 group relative cursor-pointer ${
                    isSelected ? "ring-2 ring-inset ring-blue-500 bg-blue-50/20" : ""
                  } ${!cell.isCurrentMonth ? "bg-slate-50/50 text-slate-300" : ""}`}
                >
                  {/* Cell Header: Day Number & Today indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isToday
                          ? "bg-blue-600 text-white shadow-xs"
                          : cell.isCurrentMonth
                          ? "text-slate-800 group-hover:text-blue-600"
                          : "text-slate-300"
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Quick Add on hover */}
                    <button
                      onClick={() => {
                        setNewDate(cell.dateKey);
                        setShowScheduleModal(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded-md transition-opacity cursor-pointer"
                      title={`Schedule visit on ${cell.dateKey}`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Event Badges List */}
                  <div className="space-y-1 my-1 overflow-hidden flex-1">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const colorClass = getBadgeColor(ev.eventType, ev.priority);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold truncate cursor-pointer transition-all ${colorClass}`}
                          title={`${ev.title} (${ev.eventType})`}
                        >
                          <span className="truncate block">{ev.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <button
                        onClick={() => {
                          setSelectedDateForModal(cell.dateKey);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 px-1 block truncate"
                      >
                        +{dayEvents.length - 3} more visits
                      </button>
                    )}
                  </div>

                  {/* Footer hint */}
                  {isToday && (
                    <div className="text-[9px] font-black uppercase tracking-wider text-blue-600 mt-0.5">
                      • Today
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEK TIMELINE VIEW                                                     */}
      {/* ========================================================================= */}
      {viewMode === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayEvents = eventsByDate[day.dateKey] || [];
            const isSelected = selectedDate === day.dateKey;
            return (
              <div
                key={day.dateKey}
                onClick={() => setSelectedDate(day.dateKey)}
                className={`p-4 rounded-3xl border flex flex-col justify-between space-y-4 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                    : "bg-white border-slate-200 hover:border-blue-300 shadow-xs"
                }`}
              >
                <div className={`flex items-center justify-between pb-3 border-b ${
                  isSelected ? "border-blue-200" : "border-slate-200"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`text-xl font-black tracking-tight transition-colors ${
                        isSelected ? "text-blue-600" : "text-slate-900"
                      }`}
                    >
                      {day.dayNum}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewDate(day.dateKey);
                      setShowScheduleModal(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    title={`Schedule visit on ${day.dateKey}`}
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <div className="space-y-2 flex-1">
                  {dayEvents.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 italic">No scheduled visits</div>
                  ) : (
                    dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day.dateKey);
                          setSelectedEvent(ev);
                        }}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              ev.eventType === "WORK_ORDER"
                                ? "bg-blue-100 text-blue-700"
                                : ev.eventType === "INSPECTION"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {ev.eventType}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(ev.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-2">{ev.title}</p>
                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                          <MapPin size={10} className="shrink-0" /> {ev.location}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AGENDA / SCHEDULE LIST VIEW                                            */}
      {/* ========================================================================= */}
      {viewMode === "agenda" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Chronological Operations Agenda</h3>
            <span className="text-xs text-slate-400 font-medium">Grouped by upcoming date</span>
          </div>

          {!filteredEvents.length ? (
            <div className="py-16 text-center text-xs text-slate-400">No scheduled calendar events found.</div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-blue-400"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev.eventType === "WORK_ORDER"
                            ? "bg-blue-100 text-blue-700"
                            : ev.eventType === "INSPECTION"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {ev.eventType}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {new Date(ev.startAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {ev.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        {ev.assignee || "Field Staff"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center shrink-0">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                      {ev.status || "SCHEDULED"}
                    </span>
                    <button className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EVENT DETAILS DIALOG                                               */}
      {/* ========================================================================= */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEvent(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-4 border border-slate-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedEvent.eventType === "WORK_ORDER"
                      ? "bg-blue-100 text-blue-700"
                      : selectedEvent.eventType === "INSPECTION"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {selectedEvent.eventType}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock size={14} className="text-blue-600" />
                  <span>
                    <strong>Start:</strong>{" "}
                    {new Date(selectedEvent.startAt).toLocaleDateString([], {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(selectedEvent.startAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock size={14} className="text-slate-400" />
                  <span>
                    <strong>End:</strong>{" "}
                    {new Date(selectedEvent.endAt).toLocaleDateString([], {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(selectedEvent.endAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin size={14} className="text-red-500" />
                    <span>
                      <strong>Location:</strong> {selectedEvent.location}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <User size={14} className="text-indigo-600" />
                  <span>
                    <strong>Assigned:</strong> {selectedEvent.assignee || "Field Staff"}
                  </span>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700">Scope of Work & Notes:</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedEvent.workOrderId ? (
                <Link
                  href={`/work-orders/${selectedEvent.workOrderId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all"
                >
                  <ExternalLink size={13} /> Manage Work Order
                </Link>
              ) : (
                <div />
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SCHEDULE NEW APPOINTMENT FORM                                      */}
      {/* ========================================================================= */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowScheduleModal(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 my-8 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Field Appointment</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Appointment Title / Purpose</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Annual HVAC Coil Steam Cleaning & Audit"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Event Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="WORK_ORDER">Work Order Site Visit</option>
                    <option value="INSPECTION">Routine / Safety Inspection</option>
                    <option value="PREVENTIVE">Preventive Maintenance Window</option>
                    <option value="APPOINTMENT">General Client Appointment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Time</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Location (Property & Unit)</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Grand View Heights - Suite 204"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Technician / Inspector</label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="e.g. David Chen (Lead Technician)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Access Notes & Instructions</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Tenant requested notification 15 minutes before arrival."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  {creating ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
