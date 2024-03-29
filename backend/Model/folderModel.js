const mongoose = require("mongoose");
const folderSchema = new mongoose.Schema(
  {
    name: String,
    type: {
      type: String,
      default: "folder",
    },
    contains: {
      type: [mongoose.Types.ObjectId],
      ref: "File",
    },
    user: mongoose.Types.ObjectId,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

const folderModel = mongoose.model("Folder", folderSchema);
module.exports = { folderModel };
