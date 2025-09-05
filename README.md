# OpenAI Node.js POC

A comprehensive proof-of-concept application demonstrating various OpenAI features including chat, knowledge base, image generation, audio processing, and content moderation.

## Project Overview

This project is organized as a weekly learning progression, with each week introducing new OpenAI capabilities:

- **Week 1**: Chat Basics
- **Week 2**: Knowledge Base with Document Processing
- **Week 3**: Images, Audio & Content Moderation
- **Week 4**: Integrated Features

## Features

### Audio Upload & Transcription

The audio upload feature allows users to convert spoken content into written text using OpenAI's advanced speech recognition technology.

#### How It Works

**What Users Experience:**

1. **Select an audio file** from their computer (like a recording they made on their phone or a music file)
2. **Upload the file** through the web interface
3. **Wait a moment** while the system processes their audio
4. **Receive a text version** of what was spoken in the audio file

**What Happens Behind the Scenes:**

##### Step 1: File Validation
- The system first checks if your file is actually an audio file
- It looks for common audio formats like MP3, WAV, M4A, and others
- It also checks that the file isn't too large (currently limited to 25MB to keep processing fast)
- If the file doesn't meet these requirements, it politely tells you what went wrong

##### Step 2: File Preparation
- Your audio file gets temporarily saved on the server
- The system adds the correct file extension (like .mp3) to help identify the audio type
- This ensures the audio processing tools can properly read your file

##### Step 3: Audio Transcription
- The system sends your audio file to OpenAI's advanced speech recognition service
- This service "listens" to your audio and converts the spoken words into written text
- The AI can handle different languages and accents quite well
- You can even provide hints about what language is being spoken to improve accuracy

##### Step 4: Results and Cleanup
- Once the transcription is complete, the system gives you the text version
- It saves this transcription in your session history so you can refer back to it later
- The temporary audio file is automatically deleted from the server for privacy and storage efficiency
- If anything goes wrong during processing, the system cleans up the files and tells you what happened

#### Key Features and Benefits

**Supported Formats**: The system accepts many common audio formats including MP3, WAV, M4A, FLAC, OGG, and others - basically most audio files you might have.

**Session Tracking**: Each transcription is tied to your session, so you can see all your previous transcriptions and manage them.

**Error Handling**: If something goes wrong (like an unsupported file type or processing error), the system gives you clear feedback about what happened.

**Privacy**: Audio files are only kept temporarily during processing and are automatically deleted afterward.

**History Management**: You can view all your past transcriptions and even delete specific ones if needed.

#### Real-World Use Cases

This feature is useful for:
- Converting voice memos into text
- Transcribing recorded meetings or interviews
- Getting text versions of audio content for easier searching or editing
- Making audio content accessible to people who prefer reading
- Creating written records of spoken content

The whole process typically takes just a few seconds to a minute, depending on the length of your audio file and current system load.

### Document Upload for Knowledge Base

The document upload feature allows users to build their own custom knowledge base by uploading documents that the AI can then reference when answering questions. This creates a personalized AI assistant that has access to your specific information.

#### How It Works

**What Users Experience:**

1. **Select a document** from their computer (text files, PDFs, or Word documents)
2. **Upload the file** through the web interface
3. **Wait a moment** while the system processes and learns from the document
4. **Ask questions** about the content, and the AI will provide answers based on what it learned from your documents

**What Happens Behind the Scenes:**

##### Step 1: File Validation and Reading
- The system checks if your file is a supported document type (TXT, PDF, or DOCX)
- For text files, it reads the content directly
- For PDF files, it uses special tools to extract all the readable text, even from complex layouts
- For Word documents, it carefully extracts the text while preserving the meaning
- If the file can't be read or is empty, it tells you what went wrong

##### Step 2: Text Processing and Chunking
- The system breaks your document into smaller, manageable pieces (called "chunks")
- Each chunk contains about 800 words with some overlap to maintain context
- This chunking helps the AI better understand and remember different parts of your document
- Think of it like creating an organized filing system for your document's information

##### Step 3: Creating AI Memory (Embeddings)
- Each chunk of text is converted into a special mathematical representation called an "embedding"
- These embeddings are like digital fingerprints that capture the meaning and context of the text
- The AI can later use these fingerprints to quickly find relevant information when you ask questions
- This process uses OpenAI's advanced language understanding technology

##### Step 4: Storage and Organization
- All the processed chunks and their embeddings are stored in the knowledge base
- The system keeps track of which document each piece of information came from
- It also stores helpful details like when the document was uploaded and how many pieces it was broken into
- The original uploaded file is safely deleted from the server for your privacy

##### Step 5: Smart Retrieval (When You Ask Questions)
- When you ask a question, the system first converts your question into the same type of mathematical representation
- It then searches through all the stored embeddings to find the most relevant pieces of information
- The AI combines the relevant information with your question to provide accurate, context-aware answers
- It can even tell you which specific documents the information came from

#### Key Features and Benefits

**Supported Formats**: Accepts common document types including plain text (.txt), PDF files (.pdf), and Microsoft Word documents (.docx).

**Intelligent Processing**: Automatically handles different document formats and extracts text even from complex layouts and formatting.

**Context Preservation**: Breaks documents into overlapping chunks to maintain context and meaning across sections.

**Source Tracking**: Keeps track of which documents information comes from, so you always know the source of answers.

**Privacy Protection**: Original documents are processed and then securely deleted from the server.

**Scalable Knowledge**: You can upload multiple documents to build a comprehensive knowledge base on any topic.

#### Real-World Use Cases

This feature is perfect for:
- Creating a company knowledge base from policy documents, manuals, and procedures
- Building a personal research assistant from academic papers and articles
- Making internal documentation searchable and easily accessible
- Converting static documents into an interactive Q&A system
- Creating study aids from textbooks and course materials
- Building domain-specific AI assistants with specialized knowledge

The processing time depends on document size and complexity, but most documents are ready for querying within 30 seconds to a few minutes.

### Text Content Moderation

The text moderation feature acts as an intelligent safety guardian that automatically reviews all content before it gets processed by the AI. It helps ensure that conversations remain safe, appropriate, and constructive for all users.

#### How It Works

**What Users Experience:**

1. **Type or submit any content** (messages, questions, or text)
2. **Content is automatically checked** in the background before processing
3. **Receive immediate feedback** if content needs adjustment
4. **Continue with safe, helpful interactions** when content is appropriate

**What Happens Behind the Scenes:**

##### Step 1: Real-Time Content Analysis
- Every piece of text is instantly sent to OpenAI's advanced moderation system
- The AI examines the content for potentially harmful, inappropriate, or unsafe material
- This happens automatically and transparently - users don't need to do anything special
- The analysis takes just milliseconds, so there's no noticeable delay

##### Step 2: Comprehensive Safety Categories
- The system checks for multiple types of problematic content:
  - **Hate speech** and discriminatory language
  - **Harassment** and threatening behavior
  - **Violence** and graphic descriptions
  - **Sexual content** and inappropriate material
  - **Self-harm** related content and dangerous instructions
- Each category is carefully evaluated using sophisticated AI understanding

##### Step 3: Risk Assessment and Scoring
- The system assigns confidence scores to each category (0-100%)
- It calculates an overall risk level: low, medium, or high
- Higher scores indicate greater likelihood of problematic content
- The assessment considers context and nuance, not just keywords

##### Step 4: Smart Decision Making
- Based on the analysis, the system decides on an appropriate action:
  - **Allow**: Content is safe and processing continues normally
  - **Warn**: Content has minor issues but can be processed with caution
  - **Block**: Content is inappropriate and processing is stopped
- High-severity categories (like threats or harmful instructions) automatically trigger blocking

##### Step 5: Helpful Response Generation
- If content is flagged, the system provides a clear, respectful explanation
- Instead of generic error messages, users get specific guidance on what to adjust
- The response is tailored to the type of issue detected
- Users are encouraged to rephrase their request in a more appropriate way

##### Step 6: Session Tracking and Learning
- All moderation decisions are logged for the user's session
- This helps identify patterns and improve the user experience
- Statistics are kept to understand common issues and improve the system
- Personal information is never stored - only moderation decisions

#### Key Features and Benefits

**Proactive Protection**: Automatically prevents inappropriate content from being processed, maintaining a safe environment.

**Intelligent Analysis**: Uses advanced AI to understand context and nuance, not just simple keyword filtering.

**Multiple Safety Categories**: Comprehensive coverage of different types of potentially harmful content.

**Transparent Feedback**: Clear explanations help users understand what needs to be adjusted.

**Continuous Operation**: Works silently in the background without interrupting the user experience.

**Privacy Focused**: Only moderation decisions are stored, not the actual content being checked.

**Customizable Responses**: Different types of flagged content receive appropriate, helpful responses.

#### Real-World Benefits

This feature is essential for:
- Maintaining professional and respectful AI interactions
- Protecting users from exposure to harmful content
- Ensuring compliance with content safety guidelines
- Creating inclusive environments for all users
- Preventing the AI from generating inappropriate responses
- Building trust in AI-powered applications
- Supporting responsible AI development practices

The moderation process is nearly instantaneous, adding less than 100 milliseconds to response times while providing crucial safety protection.

### AI Image Generation

The image generation feature transforms your text descriptions into stunning visual artwork using OpenAI's DALL-E 3, the most advanced AI image creation technology. Simply describe what you want to see, and the AI will create a unique, high-quality image for you.

#### How It Works

**What Users Experience:**

1. **Type a description** of the image you want (like "a sunset over a mountain lake")
2. **Use specific trigger words** to activate image generation
3. **Wait a moment** while the AI creates your unique artwork
4. **View your generated image** displayed directly in the interface

**What Happens Behind the Scenes:**

##### Step 1: Keyword Detection and Intent Recognition
- The system automatically scans your message for image generation trigger words
- **Recognized keywords include:**
  - "generate image" - Direct command to create an image
  - "create image" - Alternative direct command
  - "draw" - Simple artistic request
  - "picture of" - Natural language request
  - "image of" - Specific image request
  - "generate a" - General creation request
  - "create a" - Alternative general request
- Once detected, the system switches to image generation mode instead of regular chat

##### Step 2: Prompt Processing and Enhancement
- The system extracts the core description from your message, removing trigger words
- For example: "generate an image of a red sports car" becomes "red sports car"
- The AI automatically enhances your prompt with quality modifiers like "high quality, detailed, well-composed"
- Style-specific enhancements can be applied:
  - **Realistic**: Adds "photorealistic, high detail, professional photography"
  - **Artistic**: Adds "artistic, creative, stylized, beautiful composition"
  - **Cartoon**: Adds "cartoon style, animated, colorful, fun"
  - **Photographic**: Adds "professional photography, studio lighting, high resolution"

##### Step 3: Content Safety Validation
- Your prompt is checked against content policies to ensure appropriate image generation
- The system blocks requests for inappropriate, violent, or explicit content
- Helpful suggestions are provided if your prompt needs adjustment
- Length validation ensures prompts are detailed enough (minimum 10 characters) but not too long (maximum 1000 characters)

##### Step 4: AI Image Creation with DALL-E 3
- Your enhanced prompt is sent to OpenAI's DALL-E 3 model
- The AI creates a completely unique image based on your description
- DALL-E 3 often revises and improves your prompt for better artistic results
- The system generates one high-resolution image (1024x1024 pixels by default)
- Quality settings can be adjusted (standard or HD) and style preferences applied (vivid or natural)

##### Step 5: Image Processing and Delivery
- The generated image is received from OpenAI's servers
- The system creates a unique identifier for tracking and history
- Image metadata is stored including original prompt, revised prompt, and generation settings
- The image URL is provided for immediate viewing in your browser
- All generation details are saved to your session history for future reference

##### Step 6: History and Management
- Each generated image is logged with full details and timestamps
- You can view your complete image generation history for the session
- Statistics are tracked including total images generated and session activity
- Images remain accessible through their URLs for the duration of your session

#### Key Features and Benefits

**Smart Keyword Detection**: Automatically recognizes when you want to generate an image using natural language.

**Prompt Enhancement**: Improves your descriptions with quality modifiers for better results.

**Multiple Styles**: Choose from realistic, artistic, cartoon, or photographic styles.

**High Quality Output**: Generates detailed, high-resolution images suitable for various uses.

**Content Safety**: Built-in filtering ensures all generated images meet appropriate content standards.

**Session History**: Keep track of all your generated images with full details and easy access.

**Instant Results**: Most images are generated and ready to view within 10-30 seconds.

#### Trigger Words and Examples

To generate images, include any of these trigger phrases in your message:

- **"Generate image of [description]"** → "Generate image of a peaceful forest with sunlight streaming through trees"
- **"Create image of [description]"** → "Create image of a futuristic city with flying cars"
- **"Draw [description]"** → "Draw a cute cartoon cat wearing a wizard hat"
- **"Picture of [description]"** → "Picture of a vintage bicycle in a European street"
- **"Image of [description]"** → "Image of a delicious chocolate cake with berries"

#### Tips for Better Results

**Be Descriptive**: Include details about colors, lighting, mood, and style
- Instead of: "a car"
- Try: "a sleek red sports car in a modern city at sunset"

**Specify the Style**: Mention artistic preferences
- "photorealistic portrait", "cartoon style", "oil painting", "watercolor"

**Include Composition Details**: Describe how you want things arranged
- "close-up", "wide angle", "from above", "side view"

**Set the Mood**: Add atmospheric elements
- "dramatic lighting", "soft and dreamy", "bright and cheerful", "moody and dark"

#### Real-World Use Cases

This feature is perfect for:
- Creating unique artwork for personal projects
- Generating illustrations for presentations or documents
- Visualizing creative ideas and concepts
- Making custom images for social media content
- Creating educational visual aids
- Designing mockups and prototypes
- Generating inspiration for artistic projects
- Producing marketing and promotional imagery

The image generation process typically completes in 15-45 seconds, depending on the complexity of your request and current system load. All images are created fresh and unique - no two generations are ever exactly the same!

### Text-to-Speech (Voice Synthesis)

The text-to-speech feature transforms any written text into natural-sounding spoken audio using OpenAI's advanced voice synthesis technology. Simply provide text, choose your preferred voice, and the AI will create high-quality audio that you can listen to or download.

#### How It Works

**What Users Experience:**

1. **Type or paste any text** you want to convert to speech
2. **Choose a voice personality** from six distinct options (optional)
3. **Adjust the speaking speed** if desired (optional)
4. **Receive an audio file** that you can play immediately or download

**What Happens Behind the Scenes:**

##### Step 1: Text Validation and Processing
- The system checks that your text is within the acceptable length limit (maximum 4,096 characters)
- This limit ensures optimal audio quality and reasonable processing times
- The text is prepared for the voice synthesis engine, preserving punctuation and formatting for natural speech patterns
- Special characters and numbers are automatically handled to sound natural when spoken

##### Step 2: Voice Selection and Configuration
- **Six distinct AI voices are available**, each with unique characteristics:
  - **Alloy**: Neutral and clear, perfect for professional content
  - **Echo**: Warm and friendly, great for conversational content
  - **Fable**: Expressive and engaging, ideal for storytelling
  - **Onyx**: Deep and authoritative, suitable for formal presentations
  - **Nova**: Bright and energetic, excellent for upbeat content
  - **Shimmer**: Soft and soothing, perfect for calm, gentle delivery
- **Speed control** allows you to make speech faster (up to 4x) or slower (down to 0.25x) than normal
- The default voice (Alloy) and normal speed (1.0x) are used if no preferences are specified

##### Step 3: AI Voice Synthesis with OpenAI TTS
- Your text is sent to OpenAI's state-of-the-art text-to-speech model
- The AI analyzes the text structure, punctuation, and context to create natural-sounding speech
- Advanced neural networks generate human-like intonation, rhythm, and emotional expression
- The system handles pronunciation of complex words, abbreviations, and technical terms automatically

##### Step 4: Audio File Generation and Storage
- The synthesized speech is converted into a high-quality MP3 audio file
- A unique filename is automatically generated to prevent conflicts
- The audio file is saved securely in the server's uploads directory
- File metadata including duration, voice used, and generation timestamp are recorded

##### Step 5: Duration Estimation and Delivery
- The system estimates the audio duration based on word count and speaking speed
- Average speaking rate is calculated at 150 words per minute, adjusted for your chosen speed
- The completed audio file is made available for immediate playback
- A direct download link is provided for saving the audio locally

##### Step 6: Session Management and History
- All generated audio files are tracked in your session history
- You can view details of previous text-to-speech generations
- File information includes original text, voice used, duration, and file size
- Audio files remain accessible throughout your session for easy reference

#### Key Features and Benefits

**Multiple Voice Personalities**: Six distinct AI voices to match different content types and personal preferences.

**Flexible Speed Control**: Adjust speaking speed from 0.25x to 4x normal rate for different listening needs.

**High Audio Quality**: Professional-grade MP3 output suitable for podcasts, presentations, or personal use.

**Intelligent Text Processing**: Automatically handles punctuation, numbers, and special characters for natural speech.

**Instant Generation**: Most text converts to speech within 5-15 seconds.

**Session History**: Keep track of all generated audio with complete details and easy access.

**Download Capability**: Save audio files locally for offline use or integration into other projects.

#### Voice Characteristics Guide

**Alloy** - *Neutral & Professional*
- Best for: Business presentations, educational content, formal announcements
- Tone: Clear, balanced, and universally appealing

**Echo** - *Warm & Conversational*
- Best for: Friendly messages, casual content, customer service
- Tone: Approachable, warm, and engaging

**Fable** - *Expressive & Dynamic*
- Best for: Storytelling, creative content, entertainment
- Tone: Animated, expressive, and captivating

**Onyx** - *Deep & Authoritative*
- Best for: News reading, serious content, leadership messages
- Tone: Strong, confident, and commanding

**Nova** - *Bright & Energetic*
- Best for: Marketing content, motivational messages, upbeat announcements
- Tone: Enthusiastic, positive, and inspiring

**Shimmer** - *Soft & Soothing*
- Best for: Meditation guides, gentle instructions, calming content
- Tone: Peaceful, gentle, and reassuring

#### Speed Settings and Use Cases

- **0.25x - 0.5x (Very Slow)**: Learning pronunciation, language study, accessibility needs
- **0.75x (Slow)**: Complex technical content, careful listening, elderly audiences
- **1.0x (Normal)**: Standard speech rate, most general content
- **1.25x - 1.5x (Fast)**: Time-efficient listening, familiar content review
- **2.0x - 4.0x (Very Fast)**: Quick content review, speed reading practice

#### Real-World Applications

This feature is ideal for:
- Creating audio versions of written articles and documents
- Generating voiceovers for presentations and videos
- Making content accessible for visually impaired users
- Producing podcast content and audio newsletters
- Creating language learning materials with proper pronunciation
- Generating voice prompts for applications and systems
- Converting written scripts into spoken performances
- Creating audio content for social media and marketing
- Developing interactive voice responses for customer service
- Producing meditation guides and relaxation content

#### Technical Specifications

- **Maximum text length**: 4,096 characters per request
- **Audio format**: High-quality MP3 (44.1 kHz, stereo)
- **File size**: Typically 1-3 MB per minute of audio
- **Generation time**: 5-15 seconds for most requests
- **Voice quality**: Professional broadcast quality
- **Language support**: Optimized for English, with support for other languages

The text-to-speech generation process is remarkably fast and efficient, typically completing within 5-15 seconds regardless of text length. The resulting audio quality rivals professional voice recordings and is suitable for any application from personal use to commercial production.

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (OpenAI API key)
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared TypeScript schemas
├── uploads/         # Temporary file storage
└── docs/           # Additional documentation
```

## API Endpoints

### Audio Endpoints

- `POST /api/audio/transcribe` - Upload and transcribe audio files to text
- `GET /api/audio/transcriptions/:sessionId` - Get transcription history for a session
- `DELETE /api/audio/transcriptions/:sessionId/:transcriptionId` - Remove specific transcription
- `POST /api/audio/tts` - Convert text to speech with voice selection and speed control
- `GET /api/audio/file/:filename` - Serve and download generated audio files

### Knowledge Base Endpoints

- `POST /api/knowledge-base/upload` - Upload documents to build knowledge base
- `POST /api/knowledge-base/query` - Ask questions based on uploaded documents
- `GET /api/knowledge-base/documents` - View all uploaded documents and statistics
- `DELETE /api/knowledge-base/documents/:documentId` - Remove specific documents

### Content Moderation Endpoints

- `POST /api/moderation/check` - Check content for safety and appropriateness

### Image Generation Endpoints

- `POST /api/image/generate` - Generate images from text descriptions
- `GET /api/image/history/:sessionId` - View all generated images for a session

### Other Features

- Chat endpoints for basic conversation
- Knowledge base for document processing and querying
- Image generation capabilities
- Content moderation tools
- Integrated features combining all capabilities

## Contributing

This is a proof-of-concept project for learning OpenAI integration patterns. Feel free to explore the code and adapt it for your own projects.

## License

This project is for educational purposes.
