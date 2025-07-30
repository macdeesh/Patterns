// ============ GLOBAL VARIABLES ============
let questions = [];
let currentQuestionIndex = 0;
let totalScore = 0;
let userAnswers = [];
let selectedAnswer = null;

// ============ DOM ELEMENTS ============
const onboardingScreen = document.getElementById('screen-onboarding');
const startBtn = document.getElementById('btn-start');

// Create quiz container
const quizContainer = document.createElement('section');
quizContainer.id = 'screen-quiz';
quizContainer.className = 'screen';
document.body.appendChild(quizContainer);

// ============ EVENT LISTENERS ============
startBtn.addEventListener('click', startQuiz);

// ============ START QUIZ ============
function startQuiz() {
  onboardingScreen.classList.remove('active');
  onboardingScreen.classList.add('hidden');
  quizContainer.classList.add('active');
  loadQuestions();
}

// ============ LOAD QUESTIONS ============
async function loadQuestions() {
  try {
    const res = await fetch('data/questions.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    // ✅ Find "Main Questions" in categories array
    const category = data.categories?.find(cat => cat.title === "Main Questions");
    if (!category || !Array.isArray(category.questions)) {
      throw new Error('Main Questions category not found or invalid format');
    }

    questions = category.questions;
    showQuestion(currentQuestionIndex);
  } catch (err) {
    console.error('Failed to load questions:', err);
    quizContainer.innerHTML = `
      <p class="config-placeholder">Error: ${err.message}</p>
      <button onclick="location.reload()">Try Again</button>
    `;
  }
}

// ============ SHUFFLE HELPER ============
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ============ SHOW QUESTION ============
function showQuestion(index) {
  if (index >= questions.length) return finishQuiz();

  const q = questions[index];
  selectedAnswer = null;

  quizContainer.innerHTML = '';
  const questionDiv = document.createElement('div');
  questionDiv.className = 'question-slide';

  const title = document.createElement('h2');
  title.textContent = `Question ${index + 1}`;
  questionDiv.appendChild(title);

  const text = document.createElement('p');
  text.textContent = q.text;
  questionDiv.appendChild(text);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'options';

  const shuffledOptions = shuffleArray([...q.options]);
  const radioName = `q-${index}`;

  shuffledOptions.forEach(opt => {
    const label = document.createElement('label');
    label.className = 'answer-option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = radioName;
    radio.dataset.score = opt.score;
    radio.dataset.text = opt.text;

    const radioDot = document.createElement('span');
    radioDot.className = 'radio-custom';

    const textSpan = document.createElement('span');
    textSpan.textContent = opt.text;
    textSpan.className = 'answer-text';

    label.appendChild(radio);
    label.appendChild(radioDot);
    label.appendChild(textSpan);

    radio.addEventListener('change', () => {
      if (radio.checked) {
        document.querySelectorAll('.answer-option').forEach(el => el.classList.remove('selected'));
        label.classList.add('selected');
        selectedAnswer = { text: opt.text, score: opt.score };

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
          nextBtn.disabled = false;
          nextBtn.style.opacity = '1';
          nextBtn.style.cursor = 'pointer';
        }
      }
    });

    optionsContainer.appendChild(label);
  });

  questionDiv.appendChild(optionsContainer);

  const actions = document.createElement('div');
  actions.className = 'question-actions';

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.id = 'next-btn';
  nextBtn.disabled = true;
  nextBtn.style.opacity = '0.5';
  nextBtn.style.cursor = 'not-allowed';

  nextBtn.addEventListener('click', () => {
    if (selectedAnswer) {
      userAnswers.push({ question: q.text, answer: selectedAnswer.text, score: selectedAnswer.score });
      totalScore += selectedAnswer.score;
      currentQuestionIndex++;
      showQuestion(currentQuestionIndex);
    }
  });

  actions.appendChild(nextBtn);
  questionDiv.appendChild(actions);
  quizContainer.appendChild(questionDiv);
}

// ============ FINISH QUIZ ============
function finishQuiz() {
  quizContainer.innerHTML = '';

  const maxScore = questions.length * 5;
  const percent = Math.round((totalScore / maxScore) * 100);

  const resultDiv = document.createElement('div');
  resultDiv.className = 'result-screen';

  const scoreEl = document.createElement('h2');
  scoreEl.textContent = `Compatibility: ${percent}%`;
  resultDiv.appendChild(scoreEl);

  const messageEl = document.createElement('p');
  messageEl.textContent = getCompatibilityMessage(percent);
  resultDiv.appendChild(messageEl);

  // Contact input (only if high compatibility)
  // Contact input (only if high compatibility)
if (percent >= 75) {
  const contactSection = document.createElement('div');
  contactSection.innerHTML = `
    <p>Looks like a strong match! Want to connect?</p>
    <input type="text" placeholder="Your Instagram or contact" id="contact-input" />
  `;
  resultDiv.appendChild(contactSection);

  const contactInput = document.getElementById('contact-input');

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save Contact';

  saveBtn.addEventListener('click', () => {
    const contact = contactInput.value.trim();
    if (!contact) return alert('Please enter your contact.');

    const entry = {
      contact,
      compatibility: percent,
      answers: userAnswers,
      timestamp: new Date().toISOString()
    };

    saveAnswer(entry)
      .then(res => {
        const contentType = res.headers.get('content-type');
        return contentType && contentType.includes('application/json') ? res.json() : {};
      })
      .then(data => {
        if (data.success !== false) {
          // ✅ Hide input and button
          contactInput.style.display = 'none';
          saveBtn.style.display = 'none';

          // ✅ Show success message
          const successMsg = document.createElement('p');
          successMsg.textContent = 'Thank you, your contact is saved. ✅';
          successMsg.style.fontWeight = '500';
          successMsg.style.color = '#2e7d32';
          successMsg.style.marginTop = '16px';
          contactSection.appendChild(successMsg);
        } else {
          alert('Failed to save. Try again.');
        }
      })
      .catch(err => {
        console.error('Save error:', err);
        alert('Error saving. Please try again.');
      });
  });

  resultDiv.appendChild(saveBtn);
}

  // Final buttons container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'final-actions';

  // ✅ Restart Quiz protected by password
  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Restart Quiz';
  restartBtn.addEventListener('click', () => {
    const pass = prompt('Enter password to restart:');
    if (pass === 'karim') {
      location.reload();
    } else {
      alert('Incorrect password.');
    }
  });

  // ✅ Admin Dashboard protected by password
  const dashboardBtn = document.createElement('button');
  dashboardBtn.textContent = 'Admin Dashboard';
  dashboardBtn.addEventListener('click', () => {
    const pass = prompt('Enter password:');
    if (pass === 'karim') {
      showAdminDashboard();
    } else {
      alert('Incorrect password.');
    }
  });

  buttonContainer.appendChild(restartBtn);
  buttonContainer.appendChild(dashboardBtn);
  resultDiv.appendChild(buttonContainer);
  quizContainer.appendChild(resultDiv);
}

// ============ COMPATIBILITY MESSAGE ============
function getCompatibilityMessage(percent) {
  if (percent >= 90) return 'Perfect match! Soulmate alert!';
  if (percent >= 75) return 'Very compatible! Promising vibes.';
  if (percent >= 50) return 'Some potential. Worth exploring.';
  return 'Low compatibility. Might not align.';
}

// ============ API CALLS ============
async function saveAnswer(data) {
  return await fetch('/api/saveAnswer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

async function fetchAnswers() {
  const password = 'karim';
  const res = await fetch(`/api/getAnswers?password=${password}`);
  
  if (!res.ok) {
    const text = await res.text();
    console.error('getAnswers error:', res.status, text);
    throw new Error(`Failed to fetch answers: ${res.status}`);
  }
  
  return await res.json();
}

// ============ ADMIN DASHBOARD ============
async function showAdminDashboard() {
  // Define password once
  const password = 'karim';

  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  
  // Remove existing admin screen if present
  const existing = document.getElementById('admin-screen');
  if (existing) existing.remove();

  // Create admin screen
  const adminScreen = document.createElement('section');
  adminScreen.id = 'admin-screen';
  adminScreen.className = 'screen active';
  adminScreen.innerHTML = `
    <h2>Admin Dashboard</h2>
    <div id="answers-list"><p>Loading responses...</p></div>
    <div class="admin-actions">
      <button id="delete-data-btn">Erase All</button>
      <button id="exit-admin-btn">Exit</button>
    </div>
  `;
  document.body.appendChild(adminScreen);

  const list = document.getElementById('answers-list');

  try {
    const data = await fetchAnswers(); // Uses password internally
    list.innerHTML = '';

    if (!data?.answers?.length) {
      list.innerHTML = '<p>No responses saved yet.</p>';
    } else {
      data.answers.forEach((entry, i) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'admin-entry';

        let answersHtml = '';
        entry.answers.forEach(ans => {
          answersHtml += `
            <li><strong>${truncate(ans.question, 60)}</strong><br>→ ${ans.answer} <em>(${ans.score} pts)</em></li>
          `;
        });

        entryEl.innerHTML = `
          <h4>Response #${i + 1} – ${entry.compatibility}%</h4>
          <p><strong>Contact:</strong> ${entry.contact || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date(entry.timestamp).toLocaleString()}</p>
          <details>
            <summary>View Full Answers</summary>
            <ol>${answersHtml}</ol>
          </details>
          <hr>
        `;
        list.appendChild(entryEl);
      });
    }
  } catch (err) {
    list.innerHTML = '<p>Error loading data. Check console.</p>';
    console.error(err);
  }

  // Delete button
  document.getElementById('delete-data-btn').addEventListener('click', async () => {
    if (confirm('Erase all responses?')) {
      try {
        const res = await fetch(`/api/deleteAnswers?password=${password}`, {
          method: 'DELETE'
        });

        if (!res.ok) throw new Error('Delete failed');

        alert('All data erased.');
        location.reload();
      } catch (err) {
        alert('Failed to delete.');
        console.error(err);
      }
    }
  });

  // Exit button
  document.getElementById('exit-admin-btn').addEventListener('click', () => {
    location.reload();
  });
}

// ============ HELPERS ============
function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '...' : str;
}
