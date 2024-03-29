const express = require("express");
const { postFile, deleteFile } = require("../Controllers/fileController");
const fileRouter = express.Router();

fileRouter.post("/", postFile);
fileRouter.delete("/:userId/:id", deleteFile);

module.exports = { fileRouter };
