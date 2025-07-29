// Full working version of app.js including:
// - Functional quiz logic
// - Admin access on last page only with password prompt
// - Save and erase data functionality
// - Start again and exit buttons

import React, { useState, useEffect } from "react";
import questions from "./public/data/questions.json";

const PASSWORD = "karim";

function App() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [userContact, setUserContact] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(false);

  const currentQuestion = questions[step];

  const handleAnswer = (answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (step + 1 < questions.length) {
      setStep(step + 1);
    }
  };

  const handleSave = async () => {
    const userData = {
      timestamp: new Date().toISOString(),
      answers,
      contact: userContact,
    };

    const res = await fetch("/.netlify/functions/save-answers", {
      method: "POST",
      body: JSON.stringify({ userData }),
    });

    if (res.ok) {
      setShowSavedMessage(true);
    }
  };

  const handleErase = async () => {
    setUserContact("");
    setAnswers([]);
    setStep(0);
  };

  const fetchAdminData = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch(`/.netlify/functions/get-answers?password=${PASSWORD}`);
      const data = await res.json();
      setAdminData(data);
    } catch (e) {
      console.error("Failed to fetch admin data", e);
    }
    setAdminLoading(false);
  };

  const handleAdminLogin = () => {
    setShowPasswordPrompt(true);
  };

  const confirmPassword = (input) => {
    if (input === PASSWORD) {
      setIsAdmin(true);
      fetchAdminData();
    }
    setShowPasswordPrompt(false);
  };

  const handleStartAgain = () => {
    setShowStartPrompt(true);
  };

  const confirmRestart = () => {
    setAnswers([]);
    setUserContact("");
    setStep(0);
    setShowStartPrompt(false);
  };

  // UI Render logic:
  if (isAdmin) {
    return (
      <div>
        <h1>Admin Panel</h1>
        <button onClick={() => {
          setIsAdmin(false);
          setStep(0);
          setAnswers([]);
          setUserContact("");
        }}>Exit</button>
        {adminLoading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {adminData.map((entry, index) => (
              <li key={index}>
                <p><strong>Answers:</strong> {entry.answers.join(", ")}</p>
                <p><strong>Contact:</strong> {entry.contact}</p>
              </li>
            ))}
          </ul>
        )}
        <button onClick={handleErase}>Erase</button>
        <button onClick={confirmRestart}>Restart</button>
      </div>
    );
  }

  return (
    <div>
      {step < questions.length ? (
        <>
          <h2>{currentQuestion.question}</h2>
          {currentQuestion.answers.map((ans, idx) => (
            <button key={idx} onClick={() => handleAnswer(ans)}>{ans}</button>
          ))}
        </>
      ) : (
        <>
          <h2>Thank you for completing the quiz!</h2>
          {!showSavedMessage ? (
            <>
              <input
                type="text"
                placeholder="Enter your Instagram/contact"
                value={userContact}
                onChange={(e) => setUserContact(e.target.value)}
              />
              <button onClick={handleSave}>Send</button>
            </>
          ) : (
            <p>Saved!</p>
          )}
          <button onClick={handleStartAgain}>Start Again</button>
          <button onClick={handleAdminLogin}>Admin Login</button>
        </>
      )}

      {showPasswordPrompt && (
        <div className="modal">
          <p>Enter Admin Password:</p>
          <input type="password" onKeyDown={(e) => e.key === "Enter" && confirmPassword(e.target.value)} autoFocus />
        </div>
      )}

      {showStartPrompt && (
        <div className="modal">
          <p>Are you sure you want to restart?</p>
          <button onClick={confirmRestart}>Yes</button>
          <button onClick={() => setShowStartPrompt(false)}>No</button>
        </div>
      )}
    </div>
  );
}

export default App;
