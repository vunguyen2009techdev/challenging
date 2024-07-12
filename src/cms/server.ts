import express from "express";
import http from "http";
import { PrismaClient } from "@prisma/client";
import _ from "lodash";
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001", // Allow WebSocket connections from this origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

app.use(express.json());
// Use CORS middleware
app.use(
  cors({
    origin: "http://localhost:3001", // Allow requests from this origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

// Routes
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/ranks", async (req, res) => {
  try {
    const ranks = await prisma.statistic.findMany({
      include: { user: true, quiz: true },
      orderBy: [{ totalScore: "desc" }, { createdAt: "desc" }],
    });
    res.json(ranks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/make-quiz", async (req, res) => {
  try {
    const { firstName, lastName, email, quizId } = req.body;
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const user = await prisma.user.create({
      data: { firstName, lastName, email },
    });
    if (!user) {
      return res.status(400).json({ message: "User not created" });
    }

    const statistic = await prisma.statistic.create({
      data: {
        user: { connect: { id: user.id } },
        quiz: { connect: { id: quizId } },
        totalScore: 0,
        status: false,
      },
    });
    res.json(statistic);
    // TODO: kick an socket for new user who joined
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/quiz", async (req, res) => {
  try {
    const { title, score } = req.body;
    const quiz = await prisma.quiz.create({
      data: { title, score },
    });
    res.json(quiz);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/question", async (req, res) => {
  try {
    const { question, score = 0, options, quizId } = req.body;
    const result = await prisma.question.create({
      data: {
        question,
        score,
        options: { create: [...options] },
        quizId,
      },
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/answer", async (req, res) => {
  try {
    const { answers, userId, quizId } = req.body;
    const optionIds = answers.map((answer: any) => answer.optionId);
    let totalScore = 0;

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    const options = await prisma.option.findMany({
      where: {
        id: { in: optionIds },
      },
      include: { question: { select: { score: true } } },
    });

    for (const option of options) {
      if (option.isCorrect) {
        totalScore += option.question.score;
      }
    }

    const statistic: any = await prisma.statistic.findFirst({
      where: {
        user: { id: { equals: userId } },
        quiz: { id: { equals: quizId } },
      },
      select: { id: true },
    });

    if (_.isEmpty(statistic)) {
      // Create new statistic
      const data = await prisma.statistic.create({
        data: {
          user: { connect: { id: userId } },
          quiz: { connect: { id: quizId } },
          status: true,
          totalScore,
        },
      });
      res.json(data);
    } else {
      // Update existing statistic
      const data = await prisma.statistic.update({
        where: { id: statistic.id },
        data: { status: true, totalScore },
      });
      res.json(data);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// WebSocket
io.on("connection", (socket: any) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("message", (message: any) => {
    console.log("Received message:", message);
    io.emit("message", message);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
