const Room = require("../models/Room");

// Get all rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get a room by id
exports.getRoomById = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving room" });
  }
};

// Add a new room
exports.addRoom = async (req, res) => {
  const { name, capacity } = req.body;
  try {
    const room = new Room({ name, capacity });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Edit a room
exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  const { name, capacity } = req.body;
  try {
    const room = await Room.findByIdAndUpdate(
      id,
      { name, capacity },
      { new: true }
    );
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: "Room deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
