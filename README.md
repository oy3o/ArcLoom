# ArcLoom

[中文](./README.zh.md) | [English](./README.md)

**ArcLoom** is an interactive narrative RPG where you navigate a modern world veiled in magic. Advance through sequences of power, build relationships with mystical companions, and shape your destiny chapter by chapter, powered by generative AI like Google's Gemini and OpenAI's models.

This project serves as a powerful, extensible engine named **ArcLoom** for creating dynamic, AI-driven narrative experiences.

## ✨ Key Features

*   **Dynamic World Generation**: Create unique and rich game worlds from scratch based on high-level concepts like genre, era, and narrative style. The AI generates lore, power systems, key locations, factions, and main quests.
*   **Multi-Backend AI Support**: Seamlessly switch between different AI providers. It supports Google Gemini out-of-the-box and any OpenAI-compatible API endpoint.
*   **AI-Powered Narrative**: The entire story is generated in real-time by the AI, responding dynamically to your choices and ensuring no two playthroughs are the same.
*   **AI Image Generation**: Key scenes, characters, and companions are brought to life with AI-generated imagery, enhancing immersion.
*   **Deep State Management**: A robust system for managing the game state, including player stats, inventory, companion affinity, and world events.
*   **Save & Load**:
    *   **Quicksave/Quickload**: Instantly save and restore your progress.
    *   **Import/Export**: Share your game state or back up your progress by exporting the entire world and story to a JSON file, and import it later to continue.
    *   **Import World Lore**: Start a game from a pre-defined world structure by importing a world data file.
*   **Reactive & Modern UI**: Built with React, Vite, and Tailwind CSS for a fast, responsive, and aesthetically pleasing user experience.

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (version 20.x or higher recommended)
*   [npm](https://www.npmjs.com/) or any other package manager like pnpm or yarn.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## ⚙️ Configuration

To play the game, you must connect to at least one AI backend for text generation ("Narrator").

1.  **Launch the application.** On the title screen, click **"Connecting"**.
2.  On the "Manage AI Backends" screen, click **"+ Google"** or **"+ OpenAI"**.
3.  **Fill in the details:**
    *   **Custom Name**: A friendly name for your reference (e.g., "My Gemini Pro").
    *   **API Key**: Your secret API key from the provider.
    *   **Generation Type**:
        *   `文本叙述者` (Text Narrator): For models that generate story text (e.g., Gemini 1.5 Pro, GPT-4o).
        *   `图片回想者` (Image Ponderer): For models that generate images (e.g., Imagen, DALL-E 3).
    *   **Endpoint URL (OpenAI only)**: Leave blank for the official OpenAI API, or provide a custom URL for a proxy or a compatible local model.
4.  Click **"Verify & Fetch Models"**. If your key and endpoint are correct, a list of available models will appear.
5.  Select a model from the dropdown list.
6.  Click **"Save"**.

You can now return to the title screen and start a new game!

## 🎮 How to Play

1.  **Configure Backend**: Ensure you have at least one "Narrator" backend configured.
2.  **Start New Game**: From the title screen, click **"Re-anchoring"**.
3.  **Customize Your World**: On the "Anchor Spacetime" screen, select your desired genre, era, protagonist gender, and romance style. Choose the AI backends for narration and image generation.
4.  **Generate the World**: Click **"Start Anchoring"**. The AI will create a unique world based on your selections.
5.  **Review and Begin**: You will be presented with an overview of the generated world, including the main quest, power system, and key characters. If you are satisfied, click **"Intervene in Spacetime"** to begin your adventure.
6.  **Interact**: Read the story presented by the AI and make choices to advance the narrative. You can also type your own actions in the input box.
