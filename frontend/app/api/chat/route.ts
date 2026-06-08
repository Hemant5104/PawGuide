import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Pet-related keywords for filtering (mirrors Python backend logic)
const PET_KEYWORDS = [
  "thanks", "hi", "hello", "why", "what", "who",
  "pet", "dog", "cat", "bird", "fish", "rabbit", "hamster", "guinea pig",
  "animal", "veterinarian", "vet", "breed", "food", "feed", "training",
  "behavior", "health", "care", "groom", "walk", "toy", "treat", "leash",
  "collar", "cage", "aquarium", "terrarium", "medicine", "vaccination",
  "puppy", "kitten", "adoption", "shelter", "rescue", "spay", "neuter",
  "pet food", "pet care", "pet grooming", "dog training", "cat litter",
  "pet adoption", "pet shelter", "pet toys", "pet accessories", "pet supplies",
  "dog walker", "pet insurance", "pet health", "pet vaccination", "pet hygiene",
  "animal rescue", "pet boarding", "pet sitting",
  "labrador", "german shepherd", "golden retriever", "french bulldog", "bulldog",
  "poodle", "beagle", "rottweiler", "yorkshire terrier", "boxer",
  "dachshund", "siberian husky", "great dane", "doberman", "australian shepherd",
  "shih tzu", "boston terrier", "pomeranian", "cocker spaniel", "chihuahua",
  "persian", "maine coon", "siamese", "ragdoll", "bengal",
  "sphynx", "british shorthair", "scottish fold", "abyssinian", "birman",
  "betta", "goldfish", "guppy", "angelfish", "neon tetra",
  "budgerigar", "cockatiel", "african grey", "lovebird", "canary",
  "macaw", "amazon parrot", "parakeet", "conure", "cockatoo",
]

function isPetRelated(query: string): boolean {
  const lower = query.toLowerCase()
  return PET_KEYWORDS.some((keyword) => lower.includes(keyword))
}

interface PetContext {
  name: string
  type: string
  breed?: string
  age?: string
  notes?: string
}

interface ChatMessage {
  role: string
  content: string
}

interface ChatRequestBody {
  messages: ChatMessage[]
  petContext?: PetContext | null
}

export async function POST(request: Request) {
  try {
    const body: ChatRequestBody = await request.json()

    const apiKey = process.env.GEMINI_API_KEY
    const backendUrl = process.env.BACKEND_URL

    // ── Strategy 1: Call Gemini directly (preferred for Vercel) ──
    if (apiKey) {
      return await handleWithGemini(apiKey, body)
    }

    // ── Strategy 2: Proxy to Python backend on Render ──
    if (backendUrl) {
      return await handleWithBackend(backendUrl, body)
    }

    // ── No configuration available ──
    return NextResponse.json(
      {
        text: "The server is not configured. Please set GEMINI_API_KEY or BACKEND_URL environment variable.",
      },
      { status: 500 },
    )
  } catch (error: any) {
    console.error("API route error:", error)
    const errorMessage = error?.message || ""

    // Detect rate limit errors and give a helpful message
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return NextResponse.json(
        {
          text: "I'm currently experiencing high demand. Please wait a moment and try again. If this persists, the daily API quota may have been reached.",
        },
        { status: 429 },
      )
    }

    return NextResponse.json(
      {
        text: `I'm having trouble connecting to my knowledge base right now. Error details: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}

// ── Direct Gemini call (no Python backend needed) ──
async function handleWithGemini(apiKey: string, body: ChatRequestBody) {
  const { messages, petContext } = body

  // Find the last user message
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
  if (!lastUserMessage) {
    return NextResponse.json({ text: "No user message found." }, { status: 400 })
  }

  // Check if query is pet-related
  if (!isPetRelated(lastUserMessage.content)) {
    return NextResponse.json({
      text: "I'm a pet assistant designed to help with pet-related questions. Could you please ask me something about pets, pet care, or animal behavior?",
    })
  }

  // Build system prompt (mirrors Python backend)
  let systemPrompt = "You are PawGuide, a helpful and friendly pet assistant. "

  if (petContext) {
    systemPrompt += `The user has a ${petContext.type} named ${petContext.name}. `
    if (petContext.breed) systemPrompt += `Breed: ${petContext.breed}. `
    if (petContext.age) systemPrompt += `Age: ${petContext.age}. `
    if (petContext.notes) systemPrompt += `Additional information: ${petContext.notes}. `
    systemPrompt += "Please consider this information when providing advice. "
  }

  systemPrompt +=
    "Provide helpful, accurate, and concise information about pet care, behavior, training, nutrition, or health. "
  systemPrompt +=
    "Format your response using markdown for better readability. Use headings, lists, and emphasis where appropriate. "
  systemPrompt +=
    "If you're unsure about something, acknowledge the limitations of your knowledge and suggest consulting a veterinarian or professional."

  // Initialize the Gemini client with system instruction
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  })

  // Build conversation history — exclude the last user message (sent via sendMessage)
  // Also filter out empty content and error messages
  const history = messages
    .slice(0, -1)
    .filter((m) => m.content && m.content.trim() !== "" && !m.content.startsWith("I'm having trouble") && !m.content.startsWith("Error:"))
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }))

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(lastUserMessage.content)
  const responseText = result.response.text()

  return NextResponse.json({ text: responseText })
}

// ── Proxy to Python backend (Render) ──
async function handleWithBackend(backendUrl: string, body: ChatRequestBody) {
  const response = await fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Backend responded with status: ${response.status}`)
  }

  const data = await response.json()
  return NextResponse.json(data)
}
