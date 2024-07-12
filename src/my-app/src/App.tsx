import React, { useEffect, useState } from "react";
import { isEmpty } from "lodash";
import { toast } from "sonner";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { error } from "console";

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

const serverUrl = "http://localhost:3000";
const routes = {
  quiz: "quiz",
  question: "question",
};

const toastOptions = {
  success: {
    style: {
      color: "white",
      background: "green",
    },
  },
  error: {
    style: {
      color: "white",
      background: "red",
    },
  },
};

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [quizTitle, setQuizTitle] = useState<string>("");
  const [quizScore, setQuizScore] = useState<number>(0);
  const [data, setData] = useState<Post | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Create WebSocket connection
    const newSocket = io(serverUrl, {
      withCredentials: true,
      extraHeaders: {},
    });

    setSocket(newSocket);

    // Fetch data using Axios
    axios
      .get<Post>(`${serverUrl}/${routes.quiz}`)
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    // Listen for messages from the server
    newSocket.on("message", (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = () => {
    if (socket) {
      socket.emit("message", message);
      setMessage("");
    }
  };

  const handleCreateQuiz = async () => {
    if (!isEmpty(quizTitle) && quizScore > 0) {
      try {
        const response = await axios.post(`${serverUrl}/${routes.quiz}`, {
          title: quizTitle,
          score: quizScore,
        });
        console.log(response.data);
        toast.success("Create quiz success", toastOptions.success);
      } catch (error) {
        toast.error("Create quiz error", toastOptions.error);
      }
    }
  };

  return (
    <div className="container">
      <h1 className="my-4">The challenging Quizlet</h1>

      <ul className="nav nav-tabs" id="myTab" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={activeTab === 0 ? "nav-link active" : "nav-link"}
            id="home-tab"
            data-bs-toggle="tab"
            data-bs-target="#home-tab-pane"
            type="button"
            role="tab"
            aria-controls="home-tab-pane"
            aria-selected="true"
            onClick={() => setActiveTab(0)}
          >
            Home
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={activeTab === 1 ? "nav-link active" : "nav-link"}
            id="profile-tab"
            data-bs-toggle="tab"
            data-bs-target="#profile-tab-pane"
            type="button"
            role="tab"
            aria-controls="profile-tab-pane"
            aria-selected="false"
            onClick={() => setActiveTab(1)}
          >
            Quizlet
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={activeTab === 2 ? "nav-link active" : "nav-link"}
            id="contact-tab"
            data-bs-toggle="tab"
            data-bs-target="#contact-tab-pane"
            type="button"
            role="tab"
            aria-controls="contact-tab-pane"
            aria-selected="false"
            onClick={() => setActiveTab(2)}
          >
            Settings
          </button>
        </li>
      </ul>

      <div className="tab-content" id="myTabContent">
        <div
          className={
            activeTab === 0 ? "tab-pane fade show active" : "tab-pane fade"
          }
          id="home-tab-pane"
          role="tabpanel"
          aria-labelledby="home-tab"
          tabIndex={0}
        >
          <div className="card m-3">
            <div className="card-body">
              <h5>Ranking</h5>

              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">FirstName</th>
                    <th scope="col">LastName</th>
                    <th scope="col">Email</th>
                    <th scope="col">Score</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">1</th>
                    <td>Mark</td>
                    <td>Otto</td>
                    <td>Otto</td>
                    <td>50</td>
                    <td>@mdo</td>
                  </tr>
                  <tr>
                    <th scope="row">2</th>
                    <td>Jacob</td>
                    <td>Thornton</td>
                    <td>Otto</td>
                    <td>0</td>
                    <td>@fat</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          className={
            activeTab === 1 ? "tab-pane fade show active" : "tab-pane fade"
          }
          id="profile-tab-pane"
          role="tabpanel"
          aria-labelledby="profile-tab"
          tabIndex={1}
        >
          <div className="card m-3">
            <div className="card-body">
              <h5>Input your information to start the quiz</h5>

              <div className="mb-3">
                <label className="form-label">Quiz type</label>
                <select
                  className="form-select"
                  aria-label="Default select example"
                >
                  <option selected>Open this select menu</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Input your first name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Input your last name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Input your email"
                />
              </div>

              <button type="button" className="btn btn-primary">
                Start quiz
              </button>
            </div>
          </div>

          <div className="card m-3">
            <div className="card-body">
              <h5>Challenging yourself</h5>

              <div className="mb-3">
                <label className="form-label">1+1 = ?</label>
                <div className="form-check">
                  <input className="form-check-input" type="radio" />
                  <label className="form-check-label">Default radio</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" checked />
                  <label className="form-check-label">
                    Default checked radio
                  </label>
                </div>
              </div>

              <button type="button" className="btn btn-primary">
                Complete
              </button>
            </div>
          </div>
        </div>

        <div
          className={
            activeTab === 2 ? "tab-pane fade show active" : "tab-pane fade"
          }
          id="contact-tab-pane"
          role="tabpanel"
          aria-labelledby="contact-tab"
          tabIndex={2}
        >
          <div className="card m-3">
            <div className="card-body">
              <h5>Create Quiz</h5>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Input title of quiz"
                  onChange={(e) => setQuizTitle(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Score</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Input score of quiz"
                  onChange={(e) => setQuizScore(Number(e.target.value))}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateQuiz}
              >
                Submit
              </button>
            </div>
          </div>

          <div className="card m-3">
            <div className="card-body">
              <h5>Create Question</h5>
              <div className="mb-3">
                <label className="form-label">Question</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Input a question"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Score</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Input score of question"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Options</label>
                <div className="m-3">
                  <label className="form-label">Answer</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Input an answer"
                  />
                </div>

                <div className="m-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value=""
                      id="flexCheckDefault"
                    />
                    <label className="form-check-label">Is correct?</label>
                  </div>
                </div>

                <div className="m-3">
                  <button type="button" className="btn btn-secondary btn-sm">
                    Add answer
                  </button>
                </div>

                <div className="m-3">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Answer</th>
                        <th scope="col">Is correct</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">1</th>
                        <td>Mark</td>
                        <td>false</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <hr />
              <button type="button" className="btn btn-primary">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
