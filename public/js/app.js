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

// ============ MAIN FUNCTIONS ============

function startQuiz() {
  onboardingScreen.classList.remove('active')
  quizContainer.classList.add('active')
  loadQuestions()
}

async function loadQuestions() {
  try {
    const res = await fetch('config/questions.json')
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
      <button onclick="saveContact()">Send</button>
    `
    result.appendChild(contactPrompt)
  }

  quizContainer.appendChild(result)
}

function getCompatibilityMessage(percent) {
  if (percent >= 90) return 'Perfect match! Soulmate alert!'
  if (percent >= 75) return 'Very compatible! Promising vibes.'
  if (percent >= 50) return 'Some potential. Worth exploring.'
  return 'Low compatibility. Might not align.'
}

function saveContact() {
  const contact = document.getElementById('contact-field').value
  if (!contact) return alert('Please enter your contact.')
  const timestamp = new Date().toISOString()
  const contactData = { contact, compatibility: totalScore, timestamp }

  // Log for now - replace with actual storage call later
  console.log('Contact info saved:', contactData)

  // TODO: Save contactData to JSON file via server/API/github backend
}
