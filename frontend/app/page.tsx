"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  PawPrintIcon,
  Loader2,
  Cat,
  Dog,
  Fish,
  Bird,
  Rabbit,
  AlertCircle,
  Trash2,
  Clock,
  Download,
  Sun,
  Moon,
  Menu,
  BookmarkPlus,
  Keyboard,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import ChatSidebar from "@/components/chat-sidebar"
import { PetThemeProvider, usePetTheme } from "@/components/pet-theme-provider"
import WelcomeTour from "@/components/welcome-tour"
import VoiceInput from "@/components/voice-input"
import ScrollToTop from "@/components/scroll-to-top"
import KeyboardShortcuts from "@/components/keyboard-shortcuts"
import QuickSuggestions from "@/components/quick-suggestions"

// Fix the imports for markdown processing
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm" // Fixed import
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

import { PetTheme } from "@/components/pet-theme-provider"

const petIcons: { icon: any; color: string; name: string; themeColor: PetTheme }[] = [
  { icon: Cat, color: "text-purple-400", name: "Cat", themeColor: "purple" },
  { icon: Dog, color: "text-amber-400", name: "Dog", themeColor: "amber" },
  { icon: Fish, color: "text-blue-400", name: "Fish", themeColor: "blue" },
  { icon: Bird, color: "text-emerald-400", name: "Bird", themeColor: "emerald" },
  { icon: Rabbit, color: "text-pink-400", name: "Rabbit", themeColor: "pink" },
  { icon: PawPrintIcon, color: "text-indigo-400", name: "Paw", themeColor: "indigo" },
]

// Define message type
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isTyping?: boolean
  keywords?: string[]
}

// Define knowledge card type
interface KnowledgeCardType {
  id: string
  title: string
  content: string
  petType: string
  timestamp: Date
  tags: string[]
}

// Define pet profile type
interface PetProfileType {
  id: string
  name: string
  type: string
  breed: string
  age: string
  weight: string
  notes: string
  avatar?: string
}

// Define chat history type
interface ChatHistory {
  id: string
  title: string
  preview: string
  timestamp: Date
  messages: Message[]
  petContext?: string
}

export default function PetChatbotWrapper() {
  return (
    <PetThemeProvider>
      <PetChatbot />
    </PetThemeProvider>
  )
}

function PetChatbot() {
  // Client-side only state
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedPet, setSelectedPet] = useState(0)
  const { theme, setTheme } = useTheme()
  const { petTheme, setPetTheme } = usePetTheme()
  const [typingText, setTypingText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showTimestamps, setShowTimestamps] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCardType[]>([])
  const [petProfiles, setPetProfiles] = useState<PetProfileType[]>([])
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([])
  const [activePet, setActivePet] = useState<PetProfileType | null>(null)
  const [activeTab, setActiveTab] = useState("chat")
  const [selectedChatHistory, setSelectedChatHistory] = useState<string | null>(null)
  const [filterKeyword, setFilterKeyword] = useState("")
  const { toast } = useToast()
  const isMobile = useMobile()
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle mounting - this prevents hydration errors
  useEffect(() => {
    setMounted(true)
    // Set dark theme on component mount
    setTheme("dark")

    // Check if welcome tour has been completed
    const tourCompleted = localStorage.getItem("pawguide-tour-completed")
    if (!tourCompleted) {
      // Delay showing the welcome tour to avoid it appearing during initial load
      setTimeout(() => {
        setShowWelcomeTour(true)
      }, 1000)
    }

    // Load data from localStorage
    const loadLocalData = () => {
      try {
        const storedCards = localStorage.getItem("pawguide-knowledge-cards")
        if (storedCards) {
          setKnowledgeCards(
            JSON.parse(storedCards).map((card: any) => ({
              ...card,
              timestamp: new Date(card.timestamp),
            })),
          )
        }

        const storedPets = localStorage.getItem("pawguide-pet-profiles")
        if (storedPets) {
          setPetProfiles(JSON.parse(storedPets))
        }

        const storedHistory = localStorage.getItem("pawguide-chat-histories")
        if (storedHistory) {
          setChatHistories(
            JSON.parse(storedHistory).map((history: any) => ({
              ...history,
              timestamp: new Date(history.timestamp),
              messages: history.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })),
            })),
          )
        }
      } catch (err) {
        console.error("Error loading local data:", err)
      }
    }

    loadLocalData()
  }, [setTheme])

  // Save data to localStorage when it changes
  useEffect(() => {
    if (!mounted) return

    try {
      localStorage.setItem("pawguide-knowledge-cards", JSON.stringify(knowledgeCards))
      localStorage.setItem("pawguide-pet-profiles", JSON.stringify(petProfiles))
      localStorage.setItem("pawguide-chat-histories", JSON.stringify(chatHistories))
    } catch (err) {
      console.error("Error saving to localStorage:", err)
    }
  }, [knowledgeCards, petProfiles, chatHistories, mounted])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, typingText])

  // Update pet theme when selected pet changes
  useEffect(() => {
    setPetTheme(petIcons[selectedPet].themeColor as typeof petTheme)
  }, [selectedPet, setPetTheme])

  // Focus input when messages change
  useEffect(() => {
    if (inputRef.current && messages.length > 0 && !isLoading && !isTyping) {
      inputRef.current.focus()
    }
  }, [messages, isLoading, isTyping])

  const PetIcon = petIcons[selectedPet].icon
  const petColor = petIcons[selectedPet].color

  // Get the last user message for suggestions
  const lastUserMessage = messages.length > 0 ? messages.filter((m) => m.role === "user").pop()?.content || null : null

  // Save current chat as history
  const saveChat = () => {
    if (messages.length === 0) return

    const userMessages = messages.filter((m) => m.role === "user")
    const title =
      userMessages.length > 0
        ? userMessages[0].content.substring(0, 30) + (userMessages[0].content.length > 30 ? "..." : "")
        : "Chat " + new Date().toLocaleDateString()

    const newHistory: ChatHistory = {
      id: Date.now().toString(),
      title,
      preview: messages[messages.length - 1].content.substring(0, 50) + "...",
      timestamp: new Date(),
      messages: [...messages],
      petContext: activePet ? activePet.name : undefined,
    }

    setChatHistories((prev) => [newHistory, ...prev])
    toast({
      title: "Chat saved",
      description: "Your conversation has been saved to history.",
    })
  }

  // Load a chat history
  const loadChatHistory = (historyId: string) => {
    const history = chatHistories.find((h) => h.id === historyId)
    if (!history) return

    setMessages(history.messages)
    setSelectedChatHistory(historyId)

    // If there's a pet context, set it as active
    if (history.petContext) {
      const pet = petProfiles.find((p) => p.name === history.petContext)
      if (pet) {
        setActivePet(pet)
      }
    }

    if (isMobile) {
      setSidebarOpen(false)
    }

    toast({
      title: "Chat loaded",
      description: "Previous conversation has been loaded.",
    })
  }

  // Clear chat history
  const clearChat = () => {
    setMessages([])
    setError(null)
    setIsTyping(false)
    setTypingText("")
    setSelectedChatHistory(null)

    toast({
      title: "Chat cleared",
      description: "Your conversation has been cleared.",
    })
  }

  // Export chat history
  const exportChat = () => {
    if (typeof window === "undefined" || messages.length === 0) return

    const chatHistory = messages
      .map((msg) => {
        return `[${format(msg.timestamp, "yyyy-MM-dd HH:mm:ss")}] ${msg.role === "user" ? "You" : "PawGuide"}: ${msg.content}`
      })
      .join("\n\n")

    const blob = new Blob([chatHistory], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pawguide-chat-${format(new Date(), "yyyy-MM-dd")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Chat exported",
      description: "Your conversation has been exported as a text file.",
    })
  }

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")

    toast({
      title: `${theme === "dark" ? "Light" : "Dark"} mode activated`,
      description: `Switched to ${theme === "dark" ? "light" : "dark"} mode.`,
    })
  }

  // Create a knowledge card from a message
  const createKnowledgeCard = (message: Message, title: string) => {
    const newCard: KnowledgeCardType = {
      id: Date.now().toString(),
      title,
      content: message.content,
      petType: petIcons[selectedPet].name,
      timestamp: new Date(),
      tags: message.keywords || [petIcons[selectedPet].name.toLowerCase()],
    }

    setKnowledgeCards((prev) => [newCard, ...prev])
    toast({
      title: "Knowledge saved",
      description: "The information has been saved as a knowledge card.",
    })
  }

  // Add a pet profile
  const addPetProfile = (pet: Omit<PetProfileType, "id">) => {
    const newPet: PetProfileType = {
      ...pet,
      id: Date.now().toString(),
    }

    setPetProfiles((prev) => [newPet, ...prev])
    toast({
      title: "Pet added",
      description: `${pet.name} has been added to your pets.`,
    })
  }

  // Set active pet for context
  const setActivePetProfile = (petId: string | null) => {
    if (!petId) {
      setActivePet(null)
      toast({
        title: "Pet context removed",
        description: "Conversations will no longer include pet context.",
      })
      return
    }

    const pet = petProfiles.find((p) => p.id === petId)
    if (pet) {
      setActivePet(pet)
      toast({
        title: "Pet context set",
        description: `Conversations will now include context about ${pet.name}.`,
      })
    }
  }

  // Extract keywords from text
  const extractKeywords = (text: string): string[] => {
    const petKeywords = ["dog", "cat", "fish", "bird", "rabbit", "pet", "animal"]
    const careKeywords = ["food", "health", "training", "behavior", "grooming", "toys", "treats"]
    const allKeywords = [...petKeywords, ...careKeywords]

    return allKeywords.filter((keyword) => text.toLowerCase().includes(keyword))
  }

  // Simulate typing effect with markdown preservation
  const simulateTyping = (text: string) => {
    setIsTyping(true)
    setTypingText("")

    // For markdown, we'll type faster and in chunks to preserve formatting
    const chunks = splitIntoChunks(text, 3)
    let currentChunk = 0

    const typingInterval = setInterval(() => {
      if (currentChunk < chunks.length) {
        setTypingText((prev) => prev + chunks[currentChunk])
        currentChunk++
      } else {
        clearInterval(typingInterval)
        setIsTyping(false)

        // Add the complete message to the chat with extracted keywords
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastIndex = newMessages.length - 1
          if (lastIndex >= 0 && newMessages[lastIndex].isTyping) {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: text,
              isTyping: false,
              keywords: extractKeywords(text),
            }
          }
          return newMessages
        })
      }
    }, 30) // Slightly faster typing for chunks
  }

  // Helper function to split text into chunks while preserving markdown
  const splitIntoChunks = (text: string, chunkSize: number): string[] => {
    const chunks: string[] = []

    // Special markdown patterns to keep together
    const markdownPatterns = [
      /^#+\s.*$/m, // Headers
      /^\s*[-*+]\s.*$/m, // List items
      /^\s*\d+\.\s.*$/m, // Numbered list items
      /^>\s.*$/m, // Blockquotes
      /^```[\s\S]*?```$/m, // Code blocks
      /^\|[\s\S]*?\|$/m, // Table rows
      /^---$/m, // Horizontal rules
    ]

    let currentPosition = 0

    while (currentPosition < text.length) {
      // Check if current position starts a markdown pattern
      let patternMatch = false
      let patternLength = 0

      for (const pattern of markdownPatterns) {
        const remainingText = text.slice(currentPosition)
        const match = remainingText.match(pattern)

        if (match && match.index === 0) {
          patternMatch = true
          patternLength = match[0].length
          break
        }
      }

      if (patternMatch) {
        // Add the entire markdown pattern as a chunk
        chunks.push(text.slice(currentPosition, currentPosition + patternLength))
        currentPosition += patternLength
      } else {
        // Add a regular chunk
        const endPosition = Math.min(currentPosition + chunkSize, text.length)
        chunks.push(text.slice(currentPosition, endPosition))
        currentPosition = endPosition
      }
    }

    return chunks
  }

  // Handle voice input
  const handleVoiceInput = (transcript: string) => {
    setInput(transcript)

    // Auto-submit if the transcript is long enough
    if (transcript.length > 10) {
      setTimeout(() => {
        const event = new Event("submit") as any
        handleSubmit(event)
      }, 500)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => {
      const event = new Event("submit") as any
      handleSubmit(event)
    }, 100)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      keywords: extractKeywords(input),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    // Add a placeholder for the typing animation
    const typingPlaceholder: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }

    setMessages((prev) => [...prev, typingPlaceholder])

    try {
      // Format messages for the API (excluding the typing placeholder)
      const apiMessages = [...messages, userMessage]
        .filter((msg) => !msg.isTyping)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      // Prepare pet context if available
      const petContext = activePet
        ? {
          name: activePet.name,
          type: activePet.type,
          breed: activePet.breed,
          age: activePet.age,
          notes: activePet.notes,
        }
        : null

      // Try to call the main API
      let response
      try {
        response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: apiMessages,
            petContext,
          }),
          cache: "no-store",
        })
        if (!response.ok) {
          try {
            const errorData = await response.json()
            if (errorData.text) {
              throw new Error(errorData.text)
            }
          } catch (e) {
            // Ignore parsing errors and fall back to default error
          }
          throw new Error(`Server responded with status: ${response.status}`)
        }
      } catch (fetchError) {
        console.log("Main API failed, trying fallback:", fetchError)
        // If the main API fails, try the mock API
        response = await fetch("/api/mock/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: apiMessages,
            petContext,
          }),
          cache: "no-store",
        })
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      // Simulate typing for the response
      simulateTyping(data.text)
    } catch (err) {
      console.error("Error:", err)

      // Remove the typing placeholder
      setMessages((prev) => prev.filter((msg) => !msg.isTyping))

      // Add an error message from the assistant
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please check your internet connection and try again in a moment.",
        timestamp: new Date(),
        keywords: ["error"],
      }

      setMessages((prev) => [...prev, errorMessage])
      setError("Failed to connect to the pet assistant. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to cycle through pet icons
  const cycleIcon = () => {
    setSelectedPet((prev) => (prev + 1) % petIcons.length)

    toast({
      title: `${petIcons[(selectedPet + 1) % petIcons.length].name} Assistant activated`,
      description: `Switched to ${petIcons[(selectedPet + 1) % petIcons.length].name} Assistant.`,
    })
  }

  // Return a loading state or nothing during server-side rendering
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c111d]">
        <div className="animate-float">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center animate-pulse-glow">
            <PawPrintIcon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    )
  }

  // Get theme-specific colors
  const getThemeColors = () => {
    const baseColors = {
      purple: {
        primary: theme === "dark" ? "text-purple-300" : "text-purple-700",
        bg: theme === "dark" ? "bg-purple-900 bg-opacity-70" : "bg-purple-100",
        border: theme === "dark" ? "border-purple-800" : "border-purple-200",
        hover: theme === "dark" ? "hover:bg-purple-800" : "hover:bg-purple-200",
        button: theme === "dark" ? "bg-purple-700 hover:bg-purple-600" : "bg-purple-500 hover:bg-purple-600",
      },
      amber: {
        primary: theme === "dark" ? "text-amber-300" : "text-amber-700",
        bg: theme === "dark" ? "bg-amber-900 bg-opacity-70" : "bg-amber-100",
        border: theme === "dark" ? "border-amber-800" : "border-amber-200",
        hover: theme === "dark" ? "hover:bg-amber-800" : "hover:bg-amber-200",
        button: theme === "dark" ? "bg-amber-700 hover:bg-amber-600" : "bg-amber-500 hover:bg-amber-600",
      },
      blue: {
        primary: theme === "dark" ? "text-blue-300" : "text-blue-700",
        bg: theme === "dark" ? "bg-blue-900 bg-opacity-70" : "bg-blue-100",
        border: theme === "dark" ? "border-blue-800" : "border-blue-200",
        hover: theme === "dark" ? "hover:bg-blue-800" : "hover:bg-blue-200",
        button: theme === "dark" ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-500 hover:bg-blue-600",
      },
      emerald: {
        primary: theme === "dark" ? "text-emerald-300" : "text-emerald-700",
        bg: theme === "dark" ? "bg-emerald-900 bg-opacity-70" : "bg-emerald-100",
        border: theme === "dark" ? "border-emerald-800" : "border-emerald-200",
        hover: theme === "dark" ? "hover:bg-emerald-800" : "hover:bg-emerald-200",
        button: theme === "dark" ? "bg-emerald-700 hover:bg-emerald-600" : "bg-emerald-500 hover:bg-emerald-600",
      },
      pink: {
        primary: theme === "dark" ? "text-pink-300" : "text-pink-700",
        bg: theme === "dark" ? "bg-pink-900 bg-opacity-70" : "bg-pink-100",
        border: theme === "dark" ? "border-pink-800" : "border-pink-200",
        hover: theme === "dark" ? "hover:bg-pink-800" : "hover:bg-pink-200",
        button: theme === "dark" ? "bg-pink-700 hover:bg-pink-600" : "bg-pink-500 hover:bg-pink-600",
      },
      indigo: {
        primary: theme === "dark" ? "text-indigo-300" : "text-indigo-700",
        bg: theme === "dark" ? "bg-indigo-900 bg-opacity-70" : "bg-indigo-100",
        border: theme === "dark" ? "border-indigo-800" : "border-indigo-200",
        hover: theme === "dark" ? "hover:bg-indigo-800" : "hover:bg-indigo-200",
        button: theme === "dark" ? "bg-indigo-700 hover:bg-indigo-600" : "bg-indigo-500 hover:bg-indigo-600",
      },
    }

    return baseColors[petTheme as keyof typeof baseColors]
  }

  const colors = getThemeColors()

  return (
    <div
      className={cn(
        "flex min-h-screen",
        theme === "dark"
          ? "bg-[#0c111d] text-gray-100"
          : "bg-[#e4e4e4] text-gray-800",
      )}
    >
      {/* Welcome Tour */}
      {showWelcomeTour && <WelcomeTour onComplete={() => setShowWelcomeTour(false)} />}

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onClearChat={clearChat}
        onSaveChat={saveChat}
        onExportChat={exportChat}
        onToggleTheme={toggleTheme}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        messagesExist={messages.length > 0}
      />

      {/* Scroll to Top Button */}
      <ScrollToTop theme={theme} colors={colors} />

      {/* Sidebar for larger screens */}
      {!isMobile && (
        <ChatSidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          chatHistories={chatHistories}
          knowledgeCards={knowledgeCards}
          petProfiles={petProfiles}
          activePet={activePet}
          setActivePet={setActivePetProfile}
          loadChatHistory={loadChatHistory}
          selectedChatHistory={selectedChatHistory}
          filterKeyword={filterKeyword}
          setFilterKeyword={setFilterKeyword}
          addPetProfile={addPetProfile}
          theme={theme}
          petTheme={petTheme}
          colors={colors}
        />
      )}

      {/* Mobile sidebar */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
            <ChatSidebar
              open={sidebarOpen}
              setOpen={setSidebarOpen}
              chatHistories={chatHistories}
              knowledgeCards={knowledgeCards}
              petProfiles={petProfiles}
              activePet={activePet}
              setActivePet={setActivePetProfile}
              loadChatHistory={loadChatHistory}
              selectedChatHistory={selectedChatHistory}
              filterKeyword={filterKeyword}
              setFilterKeyword={setFilterKeyword}
              addPetProfile={addPetProfile}
              theme={theme}
              petTheme={petTheme}
              colors={colors}
              isMobile={true}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
        <DialogContent className={theme === "dark" ? "neu-raised" : ""}>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Navigate PawGuide more efficiently.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {[
              ["Ctrl+K", "Toggle sidebar"],
              ["Ctrl+L", "Clear chat"],
              ["Ctrl+S", "Save chat"],
              ["Ctrl+E", "Export chat"],
              ["Ctrl+D", "Toggle theme"],
              ["Ctrl+/", "Show this help"],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between">
                <kbd className="px-2 py-1 rounded text-xs font-mono bg-gray-800/50 border border-gray-700/50 text-purple-300">{key}</kbd>
                <span className="text-sm text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col flex-1">
        {/* ═══ HEADER ═══ */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "sticky top-0 z-10 h-16",
            theme === "dark" ? "neu-flat" : "neu-flat",
          )}
        >
          <div className="flex items-center h-full px-4 mx-auto max-w-4xl">
            {/* Sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
              id="sidebar-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <motion.div
              whileHover={{ rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={cycleIcon}
              className="cursor-pointer ml-2"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <PetIcon className="w-5 h-5 text-white" />
              </div>
            </motion.div>

            <h1 className="text-lg font-bold ml-3 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              PawGuide
            </h1>

            {/* Active pet badge */}
            {activePet && (
              <Badge variant="outline" className="ml-2 border-purple-500/30 text-purple-300 text-xs">
                {activePet.name}
              </Badge>
            )}

            <div className="flex-1"></div>

            {/* Simplified toolbar — key actions visible, rest in menu */}
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="text-gray-400 hover:text-purple-300 transition-colors h-9 w-9"
                    >
                      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Toggle theme</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-300 h-9 w-9">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={theme === "dark" ? "bg-[#151c2c] border-gray-700/50" : "bg-white border-gray-200"}
                >
                  <DropdownMenuItem onClick={() => setShowTimestamps(!showTimestamps)} className="cursor-pointer gap-2">
                    <Clock className="h-4 w-4" /> {showTimestamps ? "Hide" : "Show"} timestamps
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowShortcutsDialog(true)} className="cursor-pointer gap-2">
                    <Keyboard className="h-4 w-4" /> Keyboard shortcuts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowWelcomeTour(true)} className="cursor-pointer gap-2">
                    <HelpCircle className="h-4 w-4" /> Show tour
                  </DropdownMenuItem>
                  {petIcons.map((pet, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => setSelectedPet(index)}
                      className={cn("cursor-pointer gap-2", selectedPet === index && "bg-purple-500/10")}
                    >
                      <pet.icon className={`w-4 h-4 ${pet.color}`} /> {pet.name} Assistant
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Save chat */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={saveChat}
                      disabled={messages.length === 0}
                      className="text-gray-400 hover:text-purple-300 transition-colors h-9 w-9"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Save chat</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Clear chat */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearChat}
                      disabled={messages.length === 0}
                      className="text-gray-400 hover:text-red-400 transition-colors h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Clear chat</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </motion.header>

        {/* ═══ CHAT CONTAINER (fills remaining space) ═══ */}
        <div className="chat-container">
          {error && (
            <div className="px-4 pt-3 max-w-4xl mx-auto w-full">
              <Alert
                variant="destructive"
                className={cn("neu-raised-sm", theme === "dark" ? "border-red-900/50 bg-red-950/40" : "")}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* ═══ MESSAGES AREA (scrollable) ═══ */}
          <div className="chat-messages">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence>
                {messages.length === 0 ? (
                  /* ═══ WELCOME SCREEN ═══ */
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center justify-center min-h-[65vh] text-center p-6 relative"
                  >
                    {/* Floating gradient orbs */}
                    <div className="welcome-gradient-orb w-72 h-72 bg-purple-600 top-10 left-1/4" />
                    <div className="welcome-gradient-orb w-56 h-56 bg-indigo-600 bottom-20 right-1/4" />
                    <div className="welcome-gradient-orb w-40 h-40 bg-pink-600 top-1/2 left-1/2" />

                    {/* Main icon with neumorphic container */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10 mb-8"
                    >
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse-glow">
                        <PetIcon className="w-12 h-12 text-white" />
                      </div>
                    </motion.div>

                    <h2 className="relative z-10 text-3xl font-bold mb-3 bg-gradient-to-r from-purple-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                      Welcome to PawGuide
                    </h2>
                    <p className="relative z-10 text-gray-400 max-w-md mb-8 text-sm leading-relaxed">
                      Your AI-powered pet care companion. Ask about training, nutrition,
                      health, behavior, or anything pet-related.
                    </p>

                    {petProfiles.length > 0 && (
                      <div className="relative z-10 mb-6">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Select a pet for personalized advice</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {petProfiles.map((pet) => (
                            <Badge
                              key={pet.id}
                              variant={activePet?.id === pet.id ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer px-3 py-1 transition-all",
                                activePet?.id === pet.id
                                  ? "bg-purple-600 text-white border-purple-500"
                                  : "border-gray-700 text-gray-400 hover:border-purple-500/50 hover:text-purple-300",
                              )}
                              onClick={() => setActivePetProfile(pet.id)}
                            >
                              {pet.name} ({pet.type})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestion cards — neumorphic */}
                    <div className="relative z-10 grid grid-cols-2 gap-3 w-full max-w-lg">
                      {[
                        { text: "How do I train my puppy?", icon: "🐕" },
                        { text: "What should I feed my cat?", icon: "🐱" },
                        { text: "Why is my bird losing feathers?", icon: "🐦" },
                        { text: "Best toys for rabbits?", icon: "🐰" },
                      ].map((suggestion, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="suggestion-chip text-left flex items-start gap-2"
                          onClick={() => {
                            setInput(suggestion.text)
                            setTimeout(() => {
                              const event = new Event("submit") as any
                              handleSubmit(event)
                            }, 100)
                          }}
                        >
                          <span className="text-lg mt-0.5">{suggestion.icon}</span>
                          <span>{suggestion.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* ═══ CHAT MESSAGES ═══ */
                  messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn("flex items-start gap-3 mb-4", message.role === "user" ? "justify-end" : "")}
                    >
                      {message.role !== "user" && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/15">
                            <PetIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className={cn("flex flex-col max-w-[80%]", message.role === "user" ? "items-end" : "items-start")}>
                        {showTimestamps && (
                          <span className="text-[10px] mb-1 text-gray-500 font-medium">
                            {format(message.timestamp, "h:mm a")}
                          </span>
                        )}
                        <div className="flex flex-col">
                          <div
                            className={cn(
                              "px-4 py-3 relative group",
                              message.role === "user"
                                ? "chat-bubble-user text-white"
                                : "chat-bubble-assistant markdown-content",
                            )}
                          >
                            {message.isTyping && message.role === "assistant" ? (
                              typingText ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                  className="prose prose-sm dark:prose-invert max-w-none"
                                >
                                  {typingText}
                                </ReactMarkdown>
                              ) : (
                                <div className="flex items-center gap-1.5 py-1">
                                  {[0, 1, 2].map((i) => (
                                    <motion.div
                                      key={i}
                                      className="w-2 h-2 rounded-full bg-purple-400"
                                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                  ))}
                                </div>
                              )
                            ) : message.role === "assistant" ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                className="prose prose-sm dark:prose-invert max-w-none"
                                components={{
                                  a: ({ node, ...props }: any) => (
                                    <a {...props} className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer" />
                                  ),
                                  ul: ({ node, ...props }: any) => <ul {...props} className="list-disc pl-5 my-2 space-y-1" />,
                                  ol: ({ node, ...props }: any) => <ol {...props} className="list-decimal pl-5 my-2 space-y-1" />,
                                  li: ({ node, ...props }: any) => <li {...props} className="my-0.5" />,
                                  h1: ({ node, ...props }: any) => <h1 {...props} className="text-xl font-bold my-3 text-purple-300" />,
                                  h2: ({ node, ...props }: any) => <h2 {...props} className="text-lg font-semibold my-2 text-purple-300" />,
                                  h3: ({ node, ...props }: any) => <h3 {...props} className="text-md font-semibold my-2" />,
                                  p: ({ node, ...props }: any) => <p {...props} className="my-2 leading-relaxed" />,
                                  code: ({ node, inline, ...props }: any) =>
                                    inline ? (
                                      <code {...props} className="bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded text-xs" />
                                    ) : (
                                      <code {...props} className="block bg-[#0f1420] p-3 rounded-lg text-sm overflow-x-auto my-2 border border-gray-800" />
                                    ),
                                  pre: ({ node, ...props }: any) => (
                                    <pre {...props} className="bg-[#0f1420] p-3 rounded-lg overflow-x-auto my-2 border border-gray-800" />
                                  ),
                                  blockquote: ({ node, ...props }: any) => (
                                    <blockquote {...props} className="border-l-3 border-purple-500 pl-4 italic my-2 bg-purple-500/5 rounded-r-lg py-2 pr-3" />
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              <span className="text-sm">{message.content}</span>
                            )}

                            {/* Save as knowledge card button */}
                            {message.role === "assistant" && !message.isTyping && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border border-gray-700 hover:bg-purple-600 hover:border-purple-500"
                                  >
                                    <BookmarkPlus className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Save as Knowledge Card</DialogTitle>
                                    <DialogDescription>
                                      Create a knowledge card from this information for future reference.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="card-title">Title</Label>
                                      <Input
                                        id="card-title"
                                        placeholder="e.g., How to brush your dog's teeth"
                                        defaultValue={message.keywords?.length ? `Tips about ${message.keywords[0]}` : ""}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="card-content">Content</Label>
                                      <Textarea
                                        id="card-content"
                                        className="h-24"
                                        defaultValue={message.content}
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      type="submit"
                                      className="bg-purple-600 hover:bg-purple-500"
                                      onClick={() => {
                                        const titleInput = document.getElementById("card-title") as HTMLInputElement
                                        createKnowledgeCard(message, titleInput.value)
                                      }}
                                    >
                                      Save Card
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>

                          {/* Keyword badges */}
                          {message.keywords && message.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {message.keywords.map((keyword, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 mt-1">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold",
                            theme === "dark"
                              ? "bg-gray-800 text-gray-300 border border-gray-700"
                              : "bg-gray-200 text-gray-700 border border-gray-300",
                          )}>
                            U
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {/* Quick Suggestions */}
              {messages.length > 0 && !isLoading && !isTyping && (
                <QuickSuggestions
                  onSelectSuggestion={handleSuggestionSelect}
                  lastUserMessage={lastUserMessage}
                  theme={theme}
                  colors={colors}
                />
              )}

              {/* Typing indicator */}
              {isLoading && !isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 mb-4"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/15">
                    <PetIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="chat-bubble-assistant px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-purple-400"
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ═══ STICKY INPUT BAR ═══ */}
          <div className={cn(
            "chat-input-wrapper",
            theme === "dark" ? "bg-[#0c111d]/90 backdrop-blur-xl" : "bg-[#e4e4e4]/90 backdrop-blur-xl",
          )}>
            <form
              onSubmit={handleSubmit}
              className="max-w-4xl mx-auto"
            >
              <div className={cn(
                "flex items-center gap-2 rounded-2xl p-2",
                theme === "dark" ? "neu-inset" : "neu-inset",
              )}>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your pet..."
                  className={cn(
                    "flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-gray-500",
                    theme === "dark" ? "text-gray-100" : "text-gray-800",
                  )}
                />
                <VoiceInput onTranscript={handleVoiceInput} isDisabled={isLoading} theme={theme} colors={colors} />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </form>
            {/* Minimal footer */}
            <p className="text-center text-[10px] text-gray-600 mt-2">
              PawGuide — Built by Hemant Srivastava
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


