import { GoogleGenAI, Type, Schema, Content, Part } from "@google/genai";
import { CHAT_SYSTEM_INSTRUCTION } from "../constants";
import { QuizRequestItem, QuizResult, Question, QuizType } from "../types";

// NOTE: API Key must be provided by the environment
const apiKey = process.env.GEMINI_API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

// Helper to remove code blocks if model adds them despite instructions
const cleanJsonOutput = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const sendChatMessage = async (
  history: Content[],
  newMessage: string,
  images?: string[] // array of base64 strings
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    // Construct the parts for the new message
    const parts: Part[] = [];
    
    if (images && images.length > 0) {
      images.forEach(img => {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from base64 header
            data: img
          }
        });
      });
    }
    
    parts.push({ text: newMessage });

    const contents: Content[] = [...history, { role: 'user', parts }];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        temperature: 0.7, // Slightly creative for friendly tone
      }
    });

    return response.text || "Xin lỗi, tôi không thể tạo câu trả lời vào lúc này.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Đã xảy ra lỗi khi kết nối với trợ lý AI. Vui lòng thử lại.";
  }
};

export const generateQuizQuestions = async (items: QuizRequestItem[]): Promise<QuizResult> => {
  try {
    const model = 'gemini-3-flash-preview';

    // Build a structured prompt describing all requested parts
    let requirementsStr = "";
    items.forEach((item, index) => {
      requirementsStr += `
      Phần ${index + 1}:
      - Khối lớp: ${item.grade}
      - Bài: ${item.chapterName} - ${item.lessonName}
      - Số câu: ${item.quantity}
      - Hình thức: ${item.type}
      - Mức độ: ${item.difficulty}
      `;
    });

    const prompt = `
      Tạo một bộ câu hỏi ôn tập Vật lý THPT tổng hợp dựa trên các yêu cầu sau:
      ${requirementsStr}

      Yêu cầu chung:
      - Nội dung bám sát Chương trình GDPT 2018.
      - Công thức Toán/Lý phải dùng LaTeX bọc trong $ (inline) hoặc $$ (block).
      - Đảm bảo đáp án chính xác và lời giải chi tiết.
      - ID câu hỏi phải là số nguyên tăng dần từ 1.

      Quy định về Hình thức câu hỏi (QUAN TRỌNG):
      1. Nếu là 'Trắc nghiệm': Có 4 phương án lựa chọn, trả về trong mảng 'options'. 'correctAnswer' là 'A', 'B', 'C' hoặc 'D'.
      2. Nếu là 'Đúng/Sai': 
         - Đây là dạng câu hỏi trắc nghiệm Đúng/Sai gồm 1 câu dẫn và 4 lệnh hỏi a), b), c), d).
         - 'content': Chứa câu dẫn hoặc phát biểu chung.
         - 'options': Phải chứa đúng 4 chuỗi tương ứng với nội dung của 4 ý a, b, c, d.
         - 'correctAnswer': Phải là chuỗi định dạng kết quả chính xác (Ví dụ: "a) Đúng - b) Sai - c) Sai - d) Đúng").
      3. Nếu là 'Tự luận/Trả lời ngắn':
         - 'content': Nội dung câu hỏi bài tập hoặc lý thuyết.
         - 'options': Trả về mảng rỗng [].
         - 'correctAnswer': Đáp án ngắn gọn hoặc kết quả của bài toán.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Tiêu đề bộ câu hỏi tổng hợp (Ví dụ: Đề ôn tập Vật lý Tổng hợp)" },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              content: { type: Type.STRING, description: "Nội dung câu hỏi, chứa công thức LaTeX" },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách lựa chọn (Nếu có). Với Tự luận thì để rỗng." },
              correctAnswer: { type: Type.STRING, description: "Đáp án đúng (A/B/C/D hoặc chuỗi đáp án ngắn)" },
              explanation: { type: Type.STRING, description: "Giải thích chi tiết và phương pháp giải" },
              type: { type: Type.STRING }
            },
            required: ["id", "content", "options", "correctAnswer", "explanation", "type"]
          }
        }
      },
      required: ["title", "questions"]
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4, // Lower temperature for more precise academic content
      }
    });

    const jsonText = cleanJsonOutput(response.text || "{}");
    const result = JSON.parse(jsonText) as QuizResult;
    return result;

  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    throw new Error("Không thể tạo bộ câu hỏi. Vui lòng thử lại.");
  }
};
