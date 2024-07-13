import React, { useEffect, useState } from "react";
import { isEmpty } from "lodash";
import { toast } from "sonner";
import axios from "axios";
import moment from "moment";
import { io, Socket } from "socket.io-client";

const serverUrl = "http://localhost:3000";
const routes = {
  makeQuiz: "make-quiz",
  quiz: "quiz",
  quizzes: "quizzes",
  question: "question",
  questions: "questions",
  answer: "answer",
  ranks: "ranks",
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

  const [userId, setUserId] = useState<number>(0);
  const [activeQuiz, setActiveQuiz] = useState<boolean>(false);
  const [quizInfo, setQuizInfo] = useState<any>({
    quizId: 0,
    firstName: "",
    lastName: "",
    email: "",
  });
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [quizScore, setQuizScore] = useState<number>(0);
  const [question, setQuestion] = useState({
    quizId: 0,
    question: "",
    score: 0,
  });
  const [answer, setAnswer] = useState<string>("");
  const [correctAnswer, setCorrectAnswer] = useState<boolean>(false);
  const [options, setOptions] = useState<
    { answer: string; isCorrect: boolean }[]
  >([]);
  const [selectedOptions, setSelectedOptions] = useState<
    { optionId: number }[]
  >([]);
  const [ranks, setRanks] = useState<any[]>([]);

  useEffect(() => {
    // Create WebSocket connection
    const newSocket = io(serverUrl, {
      withCredentials: true,
      extraHeaders: {},
    });

    setSocket(newSocket);

    // Fetch data using Axios
    axios
      .get(`${serverUrl}/${routes.quizzes}`)
      .then((response) => {
        setQuizzes(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    axios
      .get(`${serverUrl}/${routes.ranks}`)
      .then((response) => {
        setRanks(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    // Listen for a new user joined from the server
    newSocket.on("user-joined", (message: string) => {
      setRanks((prevRanks) => prevRanks.concat(message));
    });

    // Listen for a user answer the quiz from the server
    newSocket.on("user-answer", (message: any) => {
      setRanks((prevRanks) => {
        return prevRanks.map((rank) => {
          if (rank.userId == message.userId && rank.quizId == message.quizId) {
            return {
              ...rank,
              totalScore: message.totalScore,
              status: true,
            };
          }
          return rank;
        });
      });
    });

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreateQuiz = async () => {
    if (!isEmpty(quizTitle) && quizScore > 0) {
      try {
        const response = await axios.post(`${serverUrl}/${routes.quiz}`, {
          title: quizTitle,
          score: quizScore,
        });
        setQuizzes((prevQuizzes) => prevQuizzes.concat(response.data));
        toast.success("Create quiz success", toastOptions.success);
      } catch (error) {
        toast.error("Create quiz error", toastOptions.error);
      }
    }
  };

  const handleAddAnswer = async () => {
    setOptions((options) => [...options, { answer, isCorrect: correctAnswer }]);
  };

  const handleDeleteAnswer = async (index: number) => {
    const newOptions = options.filter((option, i) => i !== index);
    setOptions(newOptions);
  };

  const handleCreateQuestion = async () => {
    if (
      !isEmpty(question.question) &&
      question.quizId &&
      question.score > 0 &&
      options.length > 0
    ) {
      try {
        await axios.post(`${serverUrl}/${routes.question}`, {
          quizId: question.quizId,
          question: question.question,
          score: question.score,
          options: options.map((option) => ({
            option: option.answer,
            isCorrect: option.isCorrect,
          })),
        });
        toast.success("Create question success", toastOptions.success);
      } catch (error) {
        toast.error("Create question error", toastOptions.error);
      }
    }
  };

  const onSelectQuiz = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const quizId = e.target.value;
    if (quizId) {
      try {
        const response = await axios.get(
          `${serverUrl}/${routes.questions}?quizId=${quizId}`
        );
        setQuestions(response.data);
        setQuizInfo((quizInfo: any) => ({
          ...quizInfo,
          quizId: Number(quizId),
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  const handleChooseAnswer = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOptions((option) => {
      return [...option, { optionId: Number(event.target.value) }];
    });
  };

  const handleCompleteAnswer = async () => {
    if (userId && quizInfo.quizId && selectedOptions.length > 0) {
      try {
        await axios.post(`${serverUrl}/${routes.answer}`, {
          answers: selectedOptions,
          userId,
          quizId: quizInfo.quizId,
        });
        toast.success("You are complete the quiz", toastOptions.success);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed quiz", toastOptions.error);
      }
    }
  };

  const handleStartQuiz = async () => {
    if (
      quizInfo.quizId &&
      !isEmpty(quizInfo.firstName) &&
      !isEmpty(quizInfo.lastName) &&
      !isEmpty(quizInfo.email)
    ) {
      try {
        const response = await axios.post(`${serverUrl}/${routes.makeQuiz}`, {
          firstName: quizInfo.firstName,
          lastName: quizInfo.lastName,
          email: quizInfo.email,
          quizId: quizInfo.quizId,
        });
        setUserId(response.data.userId);
        setActiveQuiz(true);
      } catch (error) {
        console.error("Error fetching data:", error);
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
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ranks.map((rank, index) => {
                    return (
                      <tr key={index}>
                        <th scope="row">{index + 1}</th>
                        <td>{rank.user.firstName}</td>
                        <td>{rank.user.lastName}</td>
                        <td>{rank.user.email}</td>
                        <td>{rank.totalScore}</td>
                        <td>{rank.status ? "Completed" : "Uncompleted"}</td>
                        <td>
                          {moment(rank.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                        </td>
                      </tr>
                    );
                  })}
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
          {
            // Show quizlet
            !activeQuiz ? (
              <div className="card m-3">
                <div className="card-body">
                  <h5>Input your information to start the quiz</h5>

                  <div className="mb-3">
                    <label className="form-label">Quiz type</label>
                    <select
                      className="form-select"
                      aria-label="Default select example"
                      onChange={onSelectQuiz}
                    >
                      <option selected>Open this select menu</option>
                      {quizzes.map((quiz, index) => {
                        return (
                          <option key={index} value={quiz.id}>
                            {quiz.title}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Input your first name"
                      onChange={(e) => {
                        setQuizInfo((quizInfo: any) => ({
                          ...quizInfo,
                          firstName: e.target.value,
                        }));
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Input your last name"
                      onChange={(e) => {
                        setQuizInfo((quizInfo: any) => ({
                          ...quizInfo,
                          lastName: e.target.value,
                        }));
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Input your email"
                      onChange={(e) => {
                        setQuizInfo((quizInfo: any) => ({
                          ...quizInfo,
                          email: e.target.value,
                        }));
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStartQuiz}
                  >
                    Start quiz
                  </button>
                </div>
              </div>
            ) : (
              <div className="card m-3">
                <div className="card-body">
                  <h5>Challenging yourself</h5>

                  {questions.map((question, index) => {
                    return (
                      <div key={index} className="mb-3">
                        <label className="form-label">
                          {question.question}
                        </label>
                        {question.options.map((option: any, index: number) => {
                          return (
                            <div key={index} className="form-check">
                              <input
                                id={"option" + option.id}
                                name={"options" + question.id}
                                className="form-check-input"
                                type="radio"
                                value={option.id}
                                checked={
                                  selectedOptions.find(
                                    (item) => item.optionId == option.id
                                  )
                                    ? true
                                    : false
                                }
                                onChange={handleChooseAnswer}
                              />
                              <label className="form-check-label">
                                {option.option}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCompleteAnswer}
                  >
                    Complete
                  </button>

                  <button
                    type="button"
                    className="m-1 btn btn-secondary"
                    onClick={() => {
                      setQuizInfo((quizInfo: any) => ({
                        ...quizInfo,
                        quizId: 0,
                        firstName: "",
                        lastName: "",
                        email: "",
                      }));
                      setActiveQuiz(false);
                    }}
                  >
                    <i className="bi bi-arrow-return-left"></i>
                    Back
                  </button>
                </div>
              </div>
            )
          }
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
                <label className="form-label">Quiz type</label>
                <select
                  className="form-select"
                  aria-label="Default select example"
                  onChange={(e) => {
                    setQuestion((question) => ({
                      ...question,
                      quizId: Number(e.target.value),
                    }));
                  }}
                >
                  <option selected>Open this select menu</option>
                  {quizzes.map((quiz, index) => {
                    return (
                      <option key={index} value={quiz.id}>
                        {quiz.title}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Question</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Input a question"
                  onChange={(e) =>
                    setQuestion((question) => ({
                      ...question,
                      question: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Score</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Input score of question"
                  onChange={(e) =>
                    setQuestion((question) => ({
                      ...question,
                      score: Number(e.target.value),
                    }))
                  }
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
                    onChange={(e) => setAnswer((answer) => e.target.value)}
                  />
                </div>

                <div className="m-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value=""
                      id="flexCheckDefault"
                      onChange={(e) =>
                        setCorrectAnswer(e.target.checked ? true : false)
                      }
                    />
                    <label className="form-check-label">Is correct?</label>
                  </div>
                </div>

                <div className="m-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddAnswer}
                  >
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
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {options.map((option, index) => {
                        return (
                          <tr key={index}>
                            <th scope="row">{index + 1}</th>
                            <td>{option.answer}</td>
                            <td>{option.isCorrect ? "Yes" : "No"}</td>
                            <td>
                              <i
                                className="text-danger bi bi-trash"
                                onClick={() => handleDeleteAnswer(index)}
                              ></i>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <hr />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateQuestion}
              >
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
