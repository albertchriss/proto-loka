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
      model: "gemini-2.0-flash",
      systemInstruction:
        "Nama kamu adalah Loka. Jawab menggunakan bahasa Indonesia. Kamu hanya dapat menjawab dalam 10 kata atau kurang.",
    });
    // const prompt = "Jelaskan gambar secara singkat.";

    const { image, prompt } = await req.json();
    if (!image.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const imageParts = [fileToGenerativePart(base64, `image/png`)];
    const result = await model.generateContent([prompt, ...imageParts]);
    // const countResult = await model.countTokens([prompt, ...imageParts]);
    // console.log("total token: ", countResult.totalTokens);
    // console.log("usage: ",result.response.usageMetadata);
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
