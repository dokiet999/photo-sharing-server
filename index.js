const express = require("express");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
//const CommentRouter = require("./routes/CommentRouter");
const User = require("./db/userModel");
const Photos = require("./db/photoModel");
dbConnect();
const session = require("express-session");

  app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }  // phải là false nếu không dùng HTTPS
}));

app.use(cors({
  origin: 'http://localhost:3000',     // ✅ origin frontend
  credentials: true                    // ✅ cho phép gửi cookies
}));
app.use(express.json());
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);

const path = require("path");


//----------------------------------
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/"); // thư mục lưu file
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });
//----------------------------------
app.use("/uploads", express.static(path.join(__dirname, "images")));
// Cho phép Express phục vụ file ảnh tĩnh từ thư mục "images"
app.use("/images", express.static(path.join(__dirname, "images")));


app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    res.json(user);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.get('/user/login/:loginName', async (req, res) => {
  try {
    const user = await User.findOne({ login_name: req.params.loginName });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user); 
  } catch (err) {
    console.error("Error fetching user by login_name:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/lists", async (request, response) => {
  try {
    const users = await User.find();
    response.json(users);
  }catch (err){
    console.log(err);
    response.status(500).send({ message: "Error fetching users" });
  }
});

app.get("/photos", async (request, response) => {
  try {
    const photo = await Photos.find();
    response.json(photo);
  }catch (err){
    console.log(err);
    response.status(500).send({ message: "Error fetching users" });
  }
});

app.post("/login", async (request, response) => {
  const { login_name, password } = request.body;
  try {
    const user = await User.findOne({login_name, password});

     if (user) {
      request.session.userId = user._id; // hoặc user.id tùy vào DB
      response.send("Login successful");
    } else {
      response.status(401).send("Invalid credentials");
    }
  } catch (err) {
    console.error("Login error:", err);
    response.status(500).send("Server error");
  }
});

app.get("/photos/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const photo = await Photos.find({ user_id: userId })
      .populate("user_id", "first_name last_name")
      .populate("comments.user_id", "first_name last_name")
      .sort({ date_time: -1 });

    res.json(photo);
  } catch (err) {
    console.error("Error fetching user photos:", err);
    res.status(500).send({ message: "Error fetching user photos" });
  }
});

app.post('/upload/:userId', upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Tạo một document mới trong MongoDB
    const newPhoto = await Photos.create({
      file_name: req.file.filename,
      user_id: req.params.userId,
      date_time: new Date() // có thể bỏ vì schema đã có default
    });

    res.json({
      message: 'Upload thành công và đã lưu vào MongoDB',
      photo: newPhoto
    });
  } catch (err) {
    console.error('Lỗi khi lưu vào MongoDB:', err);
    res.status(500).json({ error: 'Lỗi server khi lưu ảnh vào MongoDB' });
  }
});

app.post('/commentsOfPhoto/:photo_id', async (req, res) => {
  const { comment, user_id } = req.body;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: "Bình luận trống" });
  }

  if (!user_id) {
    return res.status(400).json({ error: "Thiếu user_id" });
  }

  try {
    const photo = await Photos.findById(req.params.photo_id);
    if (!photo) return res.status(404).json({ error: "Không tìm thấy ảnh" });

    photo.comments.push({
      comment: comment,
      user_id: user_id,
      date_time: new Date(),
    });

    await photo.save();
    res.json({ message: "Bình luận đã được thêm", photo });
  } catch (err) {
    console.error("Lỗi khi thêm bình luận:", err);
    res.status(500).json({ error: "Lỗi server khi thêm bình luận" });
  }
});

app.post('/register', async (req, res) => {
  const { login_name, password, first_name, last_name, location, description, occupation } = req.body;

  if (!login_name || !password || !first_name || !last_name) {
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
  }

  try {
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
    }

    const newUser = new User({  
      first_name,
      last_name,
      location,
      description,
      occupation,
      login_name,
      password
    });

    await newUser.save();
    res.status(201).json({ message: "Đăng ký thành công", user: newUser });
  } catch (err) {
    console.error("Lỗi khi đăng ký:", err);
    res.status(500).json({ error: "Lỗi server khi đăng ký" });
  }
});


app.listen(8081, () => {
  console.log("server listening on port 8081");
});
