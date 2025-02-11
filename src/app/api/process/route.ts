import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function fileToGenerativePart(data: string, mimeType: string) {
  return {
    inlineData: {
      data: data,
      mimeType,
    },
  };
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API) {
      return NextResponse.json(
        {
          error: "Missing GEMINI_API environment variable",
        },
        { status: 500 }
      );
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: "You can only answer with 30 words or less",
    });
    const prompt = "Explain the image";

    const { image } = await req.json();
    if (!image.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const imageParts = [fileToGenerativePart(base64, `image/png`)];
    const result = await model.generateContent([prompt, ...imageParts]);

    return NextResponse.json({
      text: `${result.response.text()}`,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.log(errorMessage);
    return NextResponse.json({ text: errorMessage }, { status: 500 });
  }
}
