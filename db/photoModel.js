const mongoose = require("mongoose");

// Comment schema
const commentSchema = new mongoose.Schema({
  comment: { type: String, required: true },
  date_time: { type: Date, default: Date.now },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

// Photo schema
const photoSchema = new mongoose.Schema({
  date_time: { type: Date, default: Date.now },
  file_name: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comments: [commentSchema]
}, {
  collection: "photos" // <-- dùng đúng collection mong muốn
});

// Khởi tạo model, tránh lỗi khi chạy lại bằng cách kiểm tra tồn tại trước
const Photos = mongoose.model("Photos", photoSchema);
module.exports = Photos;
