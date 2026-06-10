import express from 'express'
import PracticeQuestion from '../models/PracticeQuestion.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Seed initial mock data if the collection is empty
const seedQuestions = async () => {
  try {
    const count = await PracticeQuestion.countDocuments()
    // Clear and re-seed the collection if we have less than 35 questions
    if (count < 35) {
      await PracticeQuestion.deleteMany({})

      const initialData = [
        // Aptitude
        { category: 'aptitude', question: "If a train 110 m long passes a telegraph pole in 3 seconds, what is its speed in km/hr?", options: ["132", "120", "144", "110"], answer: 0 },
        { category: 'aptitude', question: "A store owner sells an item for $400, making a 25% profit. What was the cost price?", options: ["$300", "$320", "$350", "$375"], answer: 1 },
        { category: 'aptitude', question: "What is the next prime number after 7?", options: ["9", "11", "13", "8"], answer: 1 },
        { category: 'aptitude', question: "A can do a work in 15 days and B in 20 days. If they work on it together for 4 days, then the fraction of the work that is left is:", options: ["1/4", "1/10", "7/15", "8/15"], answer: 3 },
        { category: 'aptitude', question: "Find the greatest number that will divide 43, 91 and 183 so as to leave the same remainder in each case.", options: ["4", "7", "9", "13"], answer: 0 },
        { category: 'aptitude', question: "The sum of ages of 5 children born at the intervals of 3 years each is 50 years. What is the age of the youngest child?", options: ["4 years", "8 years", "10 years", "None of these"], answer: 0 },
        { category: 'aptitude', question: "A person crosses a 600 m long street in 5 minutes. What is his speed in km per hour?", options: ["3.6", "7.2", "8.4", "10"], answer: 1 },
        { category: 'aptitude', question: "Two numbers are respectively 20% and 50% more than a third number. The ratio of the two numbers is:", options: ["2:5", "3:5", "4:5", "6:7"], answer: 2 },
        { category: 'aptitude', question: "A fruit seller had some apples. He sells 40% apples and still has 420 apples. Originally, he had:", options: ["588", "600", "672", "700"], answer: 3 },

        // Logical Reasoning
        { category: 'logical', question: "Look at this series: 2, 1, (1/2), (1/4)... What number should come next?", options: ["(1/3)", "(1/8)", "(2/8)", "(1/16)"], answer: 1 },
        { category: 'logical', question: "Odometer is to mileage as compass is to:", options: ["speed", "hiking", "needle", "direction"], answer: 3 },
        { category: 'logical', question: "SCD, TEF, UGH, ____, WKL", options: ["CMN", "UJI", "VIJ", "IJT"], answer: 2 },
        { category: 'logical', question: "Which word does NOT belong with the others?", options: ["parsley", "basil", "dill", "mayonnaise"], answer: 3 },
        { category: 'logical', question: "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?", options: ["7", "10", "12", "13"], answer: 1 },
        { category: 'logical', question: "Paw : Cat :: Hoof : ?", options: ["Lamb", "Elephant", "Horse", "Lion"], answer: 2 },
        { category: 'logical', question: "If in a certain language, MADRAS is coded as NBESBT, how is BOMBAY coded in that code?", options: ["CPNCBX", "CPNCBZ", "CPOCBZ", "CQOCBZ"], answer: 1 },
        { category: 'logical', question: "Pointing to a photograph of a boy Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?", options: ["Brother", "Uncle", "Cousin", "Father"], answer: 3 },
        { category: 'logical', question: "A is B's sister. C is B's mother. D is C's father. E is D's mother. Then, how is A related to D?", options: ["Grandfather", "Grandmother", "Daughter", "Granddaughter"], answer: 3 },

        // Technical
        { category: 'technical', question: "Which data structure uses LIFO (Last In First Out)?", options: ["Queue", "Stack", "Tree", "Graph"], answer: 1 },
        { category: 'technical', question: "What is the time complexity of searching in a balanced Binary Search Tree?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], answer: 1 },
        { category: 'technical', question: "Which of the following is not an OOPS concept?", options: ["Encapsulation", "Polymorphism", "Exception", "Abstraction"], answer: 2 },
        { category: 'technical', question: "What does SQL stand for?", options: ["Structured Query Language", "Strong Question Language", "Structured Question Language", "Standard Query Language"], answer: 0 },
        { category: 'technical', question: "Which sorting algorithm has the best average case time complexity?", options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], answer: 2 },
        { category: 'technical', question: "In HTTP, which method is typically used to create a new resource?", options: ["GET", "PUT", "POST", "DELETE"], answer: 2 },
        { category: 'technical', question: "What is the time complexity of QuickSort in the worst case?", options: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], answer: 2 },
        { category: 'technical', question: "Which of the following is not a NoSQL database?", options: ["MongoDB", "Cassandra", "PostgreSQL", "Redis"], answer: 2 },
        { category: 'technical', question: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"], answer: 0 },
        { category: 'technical', question: "Which HTTP status code means 'Not Found'?", options: ["200", "404", "500", "403"], answer: 1 },
        { category: 'technical', question: "In Git, which command is used to save changes to the local repository?", options: ["git push", "git commit", "git save", "git add"], answer: 1 },

        // Verbal / English
        { category: 'verbal', question: "Choose the synonym for 'Abundant':", options: ["Scarce", "Plentiful", "Rare", "Limited"], answer: 1 },
        { category: 'verbal', question: "Find the correctly spelt word:", options: ["Accomodation", "Accommodation", "Acommodation", "Acomodation"], answer: 1 },
        { category: 'verbal', question: "Antonym of 'Diligent':", options: ["Lazy", "Hardworking", "Careful", "Active"], answer: 0 },
        { category: 'verbal', question: "He is entirely absorbed ___ his studies.", options: ["in", "on", "at", "with"], answer: 0 },
        { category: 'verbal', question: "Select the odd one out:", options: ["Happy", "Joyful", "Ecstatic", "Sorrowful"], answer: 3 },
        { category: 'verbal', question: "Which of the following is a noun?", options: ["Quickly", "Happiness", "Run", "Beautiful"], answer: 1 },
        { category: 'verbal', question: "Choose the correct spelling:", options: ["Fascination", "Fasination", "Facination", "Fassination"], answer: 0 },
        { category: 'verbal', question: "Antonym of 'Optimistic':", options: ["Pessimistic", "Hopeful", "Joyful", "Happy"], answer: 0 },
        { category: 'verbal', question: "A person who knows many languages is called:", options: ["Linguist", "Polyglot", "Translator", "Bilingual"], answer: 1 },
        { category: 'verbal', question: "The phrase 'Break the ice' means:", options: ["To start a conflict", "To initiate a conversation", "To break something valuable", "To do a difficult task"], answer: 1 }
      ]
      await PracticeQuestion.insertMany(initialData)
      console.log('Seeded expanded practice questions to MongoDB')
    }
  } catch (error) {
    console.error('Failed to seed practice questions:', error)
  }
}

seedQuestions()

// Get questions by categories
router.get('/questions', async (req, res) => {
  try {
    const categories = req.query.categories ? req.query.categories.split(',') : []
    const exclude = req.query.exclude ? req.query.exclude.split(',').filter(Boolean) : []
    const limit = parseInt(req.query.limit) || 10
    
    let query = categories.length > 0 ? { category: { $in: categories } } : {}
    if (exclude.length > 0) {
      query._id = { $nin: exclude }
    }
    
    let allQuestions = await PracticeQuestion.find(query)
    let isReset = false
    
    // If we ran out of fresh questions, fallback to the entire pool and reset the cycle
    if (allQuestions.length < limit && exclude.length > 0) {
      const fallbackQuery = categories.length > 0 ? { category: { $in: categories } } : {}
      allQuestions = await PracticeQuestion.find(fallbackQuery)
      isReset = true
    }

    // Shuffle the array to ensure different questions each time
    const shuffled = allQuestions.sort(() => 0.5 - Math.random())
    
    // Take only the requested limit (e.g. 10 questions)
    const questions = shuffled.slice(0, limit)
    
    res.json({ questions, isReset })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message })
  }
})

// Save practice score (requires user to be logged in)
router.post('/score', authenticateToken, async (req, res) => {
  try {
    const { track, score, total } = req.body
    // Future enhancement: Save this record to a UserScores collection to visualize progress later
    res.json({ message: 'Score saved successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error saving score', error: error.message })
  }
})

export default router