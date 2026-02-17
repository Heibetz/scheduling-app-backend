import db from "../models/index.js";
import logger from "../config/logger.js";

const Notification = db.notification;
const exports = {};

// Create and Save a new Notification
exports.create = (req, res) => {
  if (!req.body.user_id || !req.body.type || !req.body.message) {
    logger.warn('Notification creation attempt with missing fields');
    res.status(400).send({ message: "Required fields missing" });
    return;
  }

  const notification = {
    user_id: req.body.user_id,
    type: req.body.type,
    message: req.body.message,
    related_shift_id: req.body.related_shift_id,
  };

  Notification.create(notification)
    .then((data) => {
      logger.info(`Notification created for user ${data.user_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating notification: ${err.message}`);
      res.status(500).send({ message: err.message || "Error creating Notification." });
    });
};

// Retrieve all notifications for a user
exports.findByUser = (req, res) => {
  const userId = req.params.userId;

  Notification.findAll({ where: { user_id: userId }, order: [["created_at", "DESC"]] })
    .then((data) => {
      logger.info(`Retrieved ${data.length} notifications for user ${userId}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving notifications for user ${userId}: ${err.message}`);
      res.status(500).send({ message: err.message || "Error retrieving Notifications." });
    });
};

// Find a single Notification
exports.findOne = (req, res) => {
  const id = req.params.id;

  Notification.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({ message: `Cannot find Notification with id=${id}.` });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving notification ${id}: ${err.message}`);
      res.status(500).send({ message: "Error retrieving Notification with id=" + id });
    });
};

// Mark notification as read
exports.markAsRead = (req, res) => {
  const id = req.params.id;

  Notification.update({ is_read: true }, { where: { notification_id: id } })
    .then((num) => {
      if (num == 1 || (Array.isArray(num) && num[0] == 1)) {
        res.send({ message: "Notification marked as read." });
      } else {
        res.send({ message: `Cannot mark Notification with id=${id}. Maybe not found.` });
      }
    })
    .catch((err) => {
      logger.error(`Error marking notification ${id} as read: ${err.message}`);
      res.status(500).send({ message: "Error updating Notification with id=" + id });
    });
};

export default exports;
