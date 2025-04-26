const Booking = require("../models/Booking");
const Room = require("../models/Room");

// Helper to convert HH:MM to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Create a new booking
exports.createBooking = async (req, res) => {
  const { room, date, startTime, endTime, title, description } = req.body;

  try {
    // 1. Time validation: start < end
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res
        .status(400)
        .json({ message: "Start time must be before end time" });
    }

    // 2. Business hours: 8 AM - 6 PM
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (startMins < 480 || endMins > 1080) {
      return res.status(400).json({
        message: "Booking must be within business hours (8:00 - 18:00)",
      });
    }

    // 3. Duration limits: min 30 mins, max 4 hours
    const duration = endMins - startMins;
    if (duration < 30 || duration > 240) {
      return res.status(400).json({
        message: "Booking duration must be between 30 minutes and 4 hours",
      });
    }

    // 4. Get room capacity
    const roomData = await Room.findById(room);
    if (!roomData) {
      return res.status(404).json({ message: "Room not found" });
    }
    const roomCapacity = roomData.capacity;

    // 5. Find existing overlapping bookings
    const existingBookings = await Booking.find({ room, date });

    const overlappingBookings = existingBookings.filter((b) => {
      const existingStart = timeToMinutes(b.startTime);
      const existingEnd = timeToMinutes(b.endTime);
      return !(endMins <= existingStart || startMins >= existingEnd);
    });

    if (overlappingBookings.length >= roomCapacity) {
      return res.status(400).json({
        message: "Room capacity full for this time slot",
      });
    }

    // 6. Save the booking
    const booking = new Booking({
      room,
      date,
      startTime,
      endTime,
      title,
      description,
    });
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get bookings for a specific room or date
exports.getBookings = async (req, res) => {
  const { roomId, date } = req.query;

  let query = {};
  if (roomId) query.room = roomId;
  if (date) query.date = date;

  try {
    const bookings = await Booking.find(query).populate("room");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get a booking by id
exports.getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving room" });
  }
};

// Edit a booking
exports.updateBooking = async (req, res) => {
  const { id } = req.params;
  const { room, date, startTime, endTime, title, description } = req.body;

  try {
    // Validation
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res
        .status(400)
        .json({ message: "Start time must be before end time" });
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (startMins < 480 || endMins > 1080) {
      return res.status(400).json({
        message: "Booking must be within business hours (8:00 - 18:00)",
      });
    }

    const duration = endMins - startMins;
    if (duration < 30 || duration > 240) {
      return res.status(400).json({
        message: "Booking duration must be between 30 minutes and 4 hours",
      });
    }

    // Get room capacity
    const roomData = await Room.findById(room);
    if (!roomData) {
      return res.status(404).json({ message: "Room not found" });
    }
    const roomCapacity = roomData.capacity;

    // Find existing overlapping bookings excluding the current booking
    const existingBookings = await Booking.find({
      room,
      date,
      _id: { $ne: id },
    });

    const overlappingBookings = existingBookings.filter((b) => {
      const existingStart = timeToMinutes(b.startTime);
      const existingEnd = timeToMinutes(b.endTime);
      return !(endMins <= existingStart || startMins >= existingEnd);
    });

    if (overlappingBookings.length >= roomCapacity) {
      return res.status(400).json({
        message: "Room capacity full for this time slot",
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { room, date, startTime, endTime, title, description },
      { new: true }
    );
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
