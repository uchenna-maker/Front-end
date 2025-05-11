import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
  Chip,
  Paper
} from "@mui/material";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useSelector } from "react-redux";
import { GButton } from "./button";
import { useApiSend } from "../hooks/useApi";
import { markAsTaken } from "../urls";
import toast from "react-hot-toast";


const generateMedicationEvents = (medicationData) => {
  const events = [];

  medicationData.forEach((medication) => {
    const startDate = moment(medication.startDate);
    const endDate = moment(medication.endDate);

    const colors = [
      "#8E24AA",
      "#D81B60",
      "#0F2D6B",
      "#E53935",
      "#F57C00",
      "#FFB300",
      "#546E7A",
    ];

    
    const colorIndex = Math.abs(
      medication.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
    ) % colors.length;
    const medicationColor = colors[colorIndex];

    
    for (let date = moment(startDate); date.isSameOrBefore(endDate); date.add(1, 'days')) {
      medication.dosages.forEach((dosage) => {
        const intakeTime = moment(dosage.intakeTime);
        const eventStart = moment(date)
          .hour(intakeTime.hour())
          .minute(intakeTime.minute())
          .second(0);
        const eventEnd = moment(eventStart).add(30, 'minutes');

        

        events.push({
          id: `${medication.id}-${dosage.id}-${date.format('YYYY-MM-DD')}`,
          scheduleId: medication.id,
          title: `${medication.drugName} - ${dosage.dosage}`,
          start: eventStart.toDate(),
          end: eventEnd.toDate(),
          color: medicationColor,
          description: `${dosage.description}`,
          prescription: medication.prescription,
          medicationId: medication.id,
          dosageId: dosage.id,
          isCompleted: dosage.taken,
          allDosageData: dosage,
          allMedicationData: medication,
          date: date.format('YYYY-MM-DD'),
        });
      });
    }
  });

  return events;
};


const EventDetailsModal = ({
  user,
  event,
  isOpen,
  onClose,
  onMarkAsDone
}) => {

  const {mutate, isPending} = useApiSend(
    () => markAsTaken(event?.dosageId, event?.scheduleId),
    () => {
      toast.success("Marked as taken");
      onMarkAsDone(event);
    },
    () => {
      toast.error("Failed to mark as taken");
    }
  )

  if (!event) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="text-sm !text-black" sx={{ m: 0, p: 2 }}>
        {event.title}
        {/* <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          x
        </IconButton> */}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <p className="text-sm !text-black">
            <strong>Date:</strong> {moment(event.start).format("MMMM Do, YYYY")}
          </p>
          <p className="text-sm !text-black">
            <strong>Time:</strong> {moment(event.start).format("h:mm A")} - {moment(event.end).format("h:mm A")}
          </p>
          <p className="text-sm !text-black">
            <strong>Drug:</strong> {event.allMedicationData.drugName}
          </p>
          <p className="text-sm !text-black">
            <strong>Prescription:</strong> {event.prescription}
          </p>
        </Box>

        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
          <p className="text-sm !text-black font-bold">Description</p>
          <p className="text-sm !text-black">{event.description}</p>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Chip
          label={event.isCompleted ? "Taken" : "Not Taken"}
          color={event.isCompleted ? "success" : "warning"}
        />

        {(!event.isCompleted && user?.user?.userRole?.id === 1) && (

          <GButton
            className="!w-auto !px-4"
            label="Mark as Taken"
            onClick={() => mutate()}
            isLoading={isPending}
            disabled={isPending}
          />

        )}
      </DialogActions>
    </Dialog>
  );
};


const CustomEvent = ({ event }) => {
  return (
    <div
      className="p-1 text-xs relative"
      style={{
        backgroundColor: event.isCompleted
          ? "#48BB78" 
          : event.color,
        color: "white",
        borderRadius: "4px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        padding: "4px",
      }}
    >
      {event.title}
      {event.isCompleted && (
        <span className="absolute top-0 right-0 text-white font-bold">✓</span>
      )}
    </div>
  );
};


const CustomDateCellWrapper = ({ children, value, darkMode }) => {
  const date = moment(value).format('YYYY-MM-DD');
  const events = children.props.events || [];

  
  const dateEvents = events.filter(e => moment(e.start).format('YYYY-MM-DD') === date);

  
  const medsMap = dateEvents.reduce((map, e) => {
    map[e.medicationId] = map[e.medicationId] || [];
    map[e.medicationId].push(e);
    return map;
  }, {});

  
  const allTaken = dateEvents.length > 0 && Object.values(medsMap).every(arr => arr.every(e => e.isCompleted));

  return React.cloneElement(children, {
    style: {
      ...children.props.style,
      backgroundColor: allTaken
        ? "#9AE6B4" 
        : darkMode ? "rgba(63,189,241,0.2)" : "transparent",
    },
  });
};


export const MedicationCalendar = ({ medicationData, darkMode }) => {
  const localizer = momentLocalizer(moment);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const user = useSelector(state => state.auth);


  useEffect(() => {
    if (medicationData && medicationData.length) {
      setEvents(generateMedicationEvents(medicationData));
    }
  }, [medicationData]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleMarkAsDone = (event) => {
    setEvents(events.map(e => e.id === event.id ? { ...e, isCompleted: true } : e));
    setIsDetailsModalOpen(false);
  };

  const goToPreviousMonth = () => setCurrentDate(moment(currentDate).subtract(1, "month").toDate());
  const goToNextMonth = () => setCurrentDate(moment(currentDate).add(1, "month").toDate());

  
  const textColorClass = darkMode ? "text-white" : "text-black";

  
  const components = {
    event: CustomEvent,
    dateCellWrapper: (props) => <CustomDateCellWrapper {...props} darkMode={darkMode} />
  };

  return (
    <div className={`flex flex-col w-full h-full bg-[transparent] overflow-hidden ${darkMode ? "rgba(63,189,241,0.2)" : ""}`}>
      <div className="flex justify-between items-center !mb-4">
        <button onClick={goToPreviousMonth} className="bg-[#0F2D6B] text-white font-bold !px-4 !py-2 rounded hover:bg-blue-600 cursor-pointer text-xs">
          Previous
        </button>
        {/* <h2 className={`text-xl font-bold ${textColorClass}`}>{moment(currentDate).format("MMMM YYYY")}</h2> */}
        <button onClick={goToNextMonth} className="bg-[#0F2D6B] text-white font-bold !px-4 !py-2 rounded hover:bg-blue-600 cursor-pointer text-xs">
          Next
        </button>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <Calendar
          localizer={localizer}
          date={currentDate}
          onNavigate={setCurrentDate}
          events={events}
          view={currentView}
          onView={setCurrentView}
          views={['month', 'week', 'day', 'agenda']}
          startAccessor="start"
          endAccessor="end"
          style={{
            height: "100%",
            minWidth: "800px",
            border: "none",
            borderColor: "transparent",
            color: darkMode ? "white" : "inherit"
          }}
          onSelectEvent={handleSelectEvent}
          selectable
          components={components}
        />
      </div>
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isDetailsModalOpen}
        user={user}
        onClose={() => setIsDetailsModalOpen(false)}
        onMarkAsDone={handleMarkAsDone}
      />
    </div>
  );
};