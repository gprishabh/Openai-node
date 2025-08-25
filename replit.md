# OpenAI Node.js POC

## Overview

This project is a comprehensive Proof of Concept (POC) demonstrating OpenAI's capabilities using Node.js. The application showcases a complete AI Personal Assistant with chat functionality, knowledge base integration, multimedia processing (images and audio), and content moderation. The project is structured as a 4-week learning progression, with each week building upon the previous one to create a fully integrated AI assistant.

The POC implements a full-stack TypeScript application with a React frontend and Express backend, demonstrating real-world integration patterns with OpenAI's latest APIs including GPT-5, DALL-E 3, Whisper, and text-to-speech capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular design with separate chat components (ChatArea, ChatSidebar, MessageList, InputArea)

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints organized by weekly features
- **File Handling**: Multer middleware for file uploads with type validation
- **Development**: TSX for TypeScript execution and hot reloading

### Database and Storage
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Centralized schema definitions in shared directory
- **Development Storage**: In-memory storage implementation for rapid prototyping
- **Session Management**: Custom session handling with connect-pg-simple for production

### OpenAI Integration
- **Models Used**: GPT-5 for chat, text-embedding-3-small for embeddings, DALL-E 3 for images, Whisper for audio transcription, TTS-1 for speech synthesis
- **Service Architecture**: Modular service layer with separate classes for each OpenAI capability
- **Week-based Structure**: Organized by learning progression (Week 1: Chat, Week 2: Embeddings, Week 3: Multimedia, Week 4: Integration)
- **Error Handling**: Comprehensive error handling and logging for all OpenAI API interactions

### Knowledge Base System
- **RAG Implementation**: Retrieval Augmented Generation using document embeddings
- **Document Processing**: Support for multiple file formats (TXT, PDF, DOCX)
- **Similarity Search**: Cosine similarity algorithm for relevant document retrieval
- **Chunking Strategy**: Intelligent text splitting for optimal embedding quality

### Audio Processing
- **Speech-to-Text**: Whisper API integration with multiple audio format support
- **Text-to-Speech**: TTS-1 model for natural voice synthesis
- **File Management**: Temporary file handling with automatic cleanup

### Content Safety
- **Moderation API**: Automatic content filtering before processing
- **Safety Categories**: Comprehensive checking for hate, harassment, self-harm, sexual content, and violence
- **Risk Scoring**: Detailed category scores for fine-grained content control

### Development Tools
- **Build System**: Vite for frontend bundling and development server
- **Type Safety**: Strict TypeScript configuration with path mapping
- **Code Quality**: ESNext modules with proper import/export patterns
- **CLI Interface**: Interactive command-line interface for testing all features

## External Dependencies

### OpenAI Services
- **OpenAI API**: Core AI capabilities requiring API key authentication
- **Models**: GPT-5, text-embedding-3-small, DALL-E 3, Whisper-1, TTS-1
- **Rate Limits**: Standard OpenAI API rate limiting applies

### Database
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Connection**: Environment variable `DATABASE_URL` required for database connectivity

### Development Platform
- **Replit Integration**: Configured for Replit development environment with runtime error handling and cartographer plugin

### Frontend Dependencies
- **Radix UI**: Comprehensive component library for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form handling with validation support

### Build and Deployment
- **Vite**: Frontend build tool with TypeScript support
- **ESBuild**: Backend bundling for production deployment
- **PostCSS**: CSS processing with Tailwind integration

### File Processing
- **Multer**: File upload middleware with type validation and size limits
- **Node.js File System**: Built-in file operations for document processing