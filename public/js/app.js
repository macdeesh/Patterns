// ============ GLOBAL VARIABLES ============
let questions = []
let currentQuestionIndex = 0
let totalScore = 0

// ============ DOM ELEMENTS ============
const onboardingScreen = document.getElementById('screen-onboarding')
const startBtn = document.getElementById('btn-start')
const quizContainer = document.createElement('section')
quizContainer.id = 'screen-quiz'
quizContainer.className = 'screen'
document.body.appendChild(quizContainer)

// ============ EVENT LISTENERS ============
startBtn.addEventListener('click', startQuiz)

function startQuiz() {
  onboardingScreen.classList.remove('active')
  quizContainer.classList.add('active')
  loadQuestions()
}

async function loadQuestions() {
  try {
    const res = await fetch('data/questions.json')
    const data = await res.json()

    const category = data['Main Questions']
    questions = category.questions

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No questions found')
    }

    showQuestion(currentQuestionIndex)
  } catch (err) {
    console.error('Failed to load questions:', err)
    quizContainer.innerHTML = `<p class="config-placeholder">Error loading quiz. Check console for details.</p>`
  }
}

function showQuestion(index) {
  quizContainer.innerHTML = ''
  if (index >= questions.length) return finishQuiz()

  const q = questions[index]

  const title = document.createElement('h2')
  title.textContent = `Question ${index + 1}`
  quizContainer.appendChild(title)

  const questionText = document.createElement('p')
  questionText.textContent = q.text
  quizContainer.appendChild(questionText)

  const optionsList = document.createElement('div')
  optionsList.className = 'options'

  q.options.forEach(opt => {
    const btn = document.createElement('button')
    btn.textContent = opt.text
    btn.classList.add('answer-button')
    btn.addEventListener('click', () => handleAnswer(opt.score))
    optionsList.appendChild(btn)
  })

  quizContainer.appendChild(optionsList)
}

function handleAnswer(score) {
  totalScore += score || 0
  currentQuestionIndex++
  showQuestion(currentQuestionIndex)
}

function finishQuiz() {
  quizContainer.innerHTML = ''
  const percent = Math.round((totalScore / (questions.length * 5)) * 100)

  const result = document.createElement('div')
  result.className = 'result-box'

  const score = document.createElement('h2')
  score.textContent = `Compatibility: ${percent}%`
  result.appendChild(score)

  const message = document.createElement('p')
  message.textContent = getCompatibilityMessage(percent)
  result.appendChild(message)

  if (percent >= 75) {
    const contactPrompt = document.createElement('div')
    contactPrompt.innerHTML = `
      <p>Looks like a strong match! Want to connect?</p>
      <input type="text" placeholder="Your Instagram or contact" id="contact-field" />
      <button id="send-contact-btn">Send</button>
    `
    result.appendChild(contactPrompt)
  }

  const actions = document.createElement('div')
  actions.className = 'final-actions'
  actions.innerHTML = `
    <button id="start-again-btn">Start Again</button>
    <button id="login-btn">Admin Login</button>
  `
  result.appendChild(actions)

  quizContainer.appendChild(result)

  // Listeners
  document.getElementById('start-again-btn').addEventListener('click', () => {
    if (confirm('Restart the quiz?')) {
      location.reload()
    }
  })

  document.getElementById('login-btn').addEventListener('click', () => {
    const pass = prompt('Enter password:')
    if (pass === 'karim') {
      loadAdminView()
    } else {
      alert('Incorrect password.')
    }
  })

  const sendBtn = document.getElementById('send-contact-btn')
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const contact = document.getElementById('contact-field').value
      if (!contact) return alert('Please enter your contact.')

      const entry = {
        contact,
        compatibility: percent,
        answers: questions.map((q, i) => q.text),
        timestamp: new Date().toISOString(),
      }

      saveAnswer(entry).then(() => {
        const parent = sendBtn.parentElement
        parent.innerHTML = `<p>Saved successfully ✅</p>`
      })
    })
  }
}

function getCompatibilityMessage(percent) {
  if (percent >= 90) return 'Perfect match! Soulmate alert!'
  if (percent >= 75) return 'Very compatible! Promising vibes.'
  if (percent >= 50) return 'Some potential. Worth exploring.'
  return 'Low compatibility. Might not align.'
}

// ============ NETLIFY FUNCTIONS ============

async function saveAnswer(data) {
  return await fetch('/.netlify/functions/saveAnswer', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

async function deleteAnswers() {
  try {
    const res = await fetch('/.netlify/functions/deleteAnswers', {
      method: 'DELETE',
    })

    if (!res.ok) throw new Error('Failed to delete.')

    alert('Answers deleted.')
    loadAdminView()
  } catch (err) {
    alert('Error deleting answers.')
    console.error(err)
  }
}

async function fetchAnswers() {
  const res = await fetch('/.netlify/functions/getAnswers')
  return await res.json()
}

// ============ ADMIN VIEW ============

async function loadAdminView() {
  document.body.innerHTML = `
    <section id="admin-screen" class="screen active">
      <h2>Admin Panel</h2>
      <div id="answers-list"><p>Loading...</p></div>
      <div class="admin-actions">
        <button id="save-data-btn">Save</button>
        <button id="delete-data-btn">Erase</button>
        <button id="exit-admin-btn">Exit</button>
      </div>
    </section>
  `

  const data = await fetchAnswers()

  const list = document.getElementById('answers-list')
  list.innerHTML = ''

  if (!data.answers || !Array.isArray(data.answers)) {
    list.innerHTML = '<p>No data found.</p>'
    return
  }

  data.answers.forEach((entry, i) => {
    const el = document.createElement('div')
    el.className = 'admin-entry'
    el.innerHTML = `
      <h4>Entry #${i + 1}</h4>
      <p><strong>Contact:</strong> ${entry.contact || 'N/A'}</p>
      <p><strong>Compatibility:</strong> ${entry.compatibility || 'N/A'}%</p>
      <p><strong>Saved on:</strong> ${new Date(entry.timestamp).toLocaleString()}</p>
      <hr/>
    `
    list.appendChild(el)
  })

  document.getElementById('delete-data-btn').addEventListener('click', () => {
    const confirmed = confirm('Are you sure?')
    if (confirmed) deleteAnswers()
  })

  document.getElementById('save-data-btn').addEventListener('click', () => {
    alert('Data saved (Netlify repo stores the file).')
  })

  document.getElementById('exit-admin-btn').addEventListener('click', () => {
    location.reload()
  })
}
