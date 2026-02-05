import { getSystemPrompt } from "./prompts.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BASE_PROMPT } from "./prompts.js";
import { ReactPrompt } from "./defaults/react.js";
import { NodePrompt } from "./defaults/node.js";
import express from "express";
import cors from "cors";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY not found");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const app = express();
app.use(express.json());
app.use(cors());

const finalmodel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  systemInstruction: getSystemPrompt(),
});

app.post("/chat", async (req, res) => {
  const messages = req.body.messages;
  console.log(messages);

  try {
    const result = await finalmodel.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: BASE_PROMPT,
            },
            {
              text: `${ReactPrompt} Make sure to necessarily create all the files shown in xml format and add the content mentioned in them and then modify them based on the requirement and maintain a proper folder structure for different components. Organize everything properly within a structured folder hierarchy inside \\boltactiontype. Ensure that the UI is well-designed, responsive, and visually appealing by following best practices for layout, spacing, and component organization. Use Tailwind CSS for styling, and make sure the design is clean, modern, and user-friendly. Avoid placing all the code inside App.tsx; instead, break it down into reusable components and follow a modular approach.  
            
              Project Structure and Organization:  
              1. Create a well-organized folder structure within /boltactiontype following this hierarchy:  
                 - src/  
                   - components/       # Reusable UI components
                   - hooks/            # Custom React hooks  
                   - utils/            # Helper functions and utilities  
                   - types/            # TypeScript interfaces and types  
                   - styles/           # Global styles and Tailwind configurations  
            
              Code Organization:  
              1. Break down the application into modular, reusable components  
              2. Implement proper component composition and avoid prop drilling  
              3. Create separate files for interfaces, types, and constants  
              4. Use meaningful file and component names that reflect their purpose   
            
              Styling and UI Requirements:  
              1. Use Tailwind CSS for styling with these guidelines:  
                 - Implement responsive design for all screen sizes  
                 - Use consistent spacing and padding with Tailwind's spacing scale  
                 - Implement a cohesive color scheme using Tailwind's color palette  
                 - Use Tailwind's container classes for proper content width  
                 - Implement proper grid and flexbox layouts  
              2. Follow these UI best practices:  
                 - Maintain consistent typography and visual hierarchy  
                 - Implement proper component spacing and alignment  
                 - Use appropriate animations and transitions  
                 - Ensure proper contrast ratios for accessibility  
                 - Add hover and focus states for interactive elements  
              
                Component Development:  
                1. Create reusable components for common UI elements like:  
                   - Buttons with different variants  
                   - Input fields and form elements  
                   - Cards and containers  
              
                Ensure that the UI is well-designed and should be working it will only work if all the necessary files are presnt, responsive, and visually appealing. Avoid placing all the code inside \`App.tsx\`; instead, break it down into reusable components and follow a modular approach.`,
            },
            {
              text: messages,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000000,
      },
    });

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(chunkText);
    }

    res.end();
  } catch (error: any) {
    console.error("Error generating content:", error);
    res.status(500).send("Error generating content");
  }
});

app.listen(3000);
