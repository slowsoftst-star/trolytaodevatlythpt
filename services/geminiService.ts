import { GoogleGenAI, Type, Schema, Content, Part } from "@google/genai";
import { CHAT_SYSTEM_INSTRUCTION } from "../constants";
import { QuizRequestItem, QuizResult, QuizType } from "../types";

// Fallback model chain per LỆNH.md §1
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

// Get API key from localStorage
const getApiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || '';
};

// Get selected model from localStorage
const getSelectedModel = (): string => {
  return localStorage.getItem('selected_model') || 'gemini-2.5-flash';
};

// Create GenAI instance with current key
const createAI = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }
  return new GoogleGenAI({ apiKey });
};

// Build fallback order: selected model first, then the rest
const buildModelOrder = (): string[] => {
  const selected = getSelectedModel();
  const order = [selected];
  for (const m of FALLBACK_MODELS) {
    if (m !== selected) order.push(m);
  }
  return order;
};

// Helper to remove code blocks
const cleanJsonOutput = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// Detect quota/auth errors
const isQuotaError = (error: any): boolean => {
  const msg = String(error?.message || error || '').toLowerCase();
  return msg.includes('quota') || msg.includes('rate limit') || msg.includes('429') || msg.includes('resource exhausted');
};

const isAuthError = (error: any): boolean => {
  const msg = String(error?.message || error || '').toLowerCase();
  return msg.includes('api key') || msg.includes('401') || msg.includes('403') || msg.includes('invalid') || msg.includes('permission');
};

export const sendChatMessage = async (
  history: Content[],
  newMessage: string,
  images?: string[]
): Promise<string> => {
  const ai = createAI();
  const models = buildModelOrder();

  const parts: Part[] = [];
  if (images && images.length > 0) {
    images.forEach(img => {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
    });
  }
  parts.push({ text: newMessage });
  const contents: Content[] = [...history, { role: 'user', parts }];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: CHAT_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });
      return response.text || "Xin lỗi, tôi không thể tạo câu trả lời vào lúc này.";
    } catch (error: any) {
      console.warn(`Model ${model} failed:`, error?.message);

      if (isAuthError(error)) {
        return "⚠️ API Key không hợp lệ hoặc đã hết hạn. Vui lòng vào Settings để nhập API Key mới.\n\n👉 Lấy key tại: https://aistudio.google.com/api-keys";
      }
      if (isQuotaError(error)) {
        if (model === models[models.length - 1]) {
          return "⚠️ API Key đã hết quota cho tất cả model. Bạn có thể:\n1. Lấy API key từ Gmail khác tại https://aistudio.google.com/api-keys\n2. Hoặc chờ đến ngày hôm sau để quota được reset.";
        }
        continue; // Try next model
      }
      if (model === models[models.length - 1]) {
        return "Đã xảy ra lỗi khi kết nối với trợ lý AI. Vui lòng thử lại.";
      }
      // Continue to next model for any error
    }
  }
  return "Đã xảy ra lỗi khi kết nối. Vui lòng thử lại.";
};

export const generateQuizQuestions = async (items: QuizRequestItem[]): Promise<QuizResult> => {
  const ai = createAI();
  const models = buildModelOrder();

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
      title: { type: Type.STRING, description: "Tiêu đề bộ câu hỏi tổng hợp" },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            content: { type: Type.STRING, description: "Nội dung câu hỏi, chứa công thức LaTeX" },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách lựa chọn" },
            correctAnswer: { type: Type.STRING, description: "Đáp án đúng" },
            explanation: { type: Type.STRING, description: "Giải thích chi tiết" },
            type: { type: Type.STRING }
          },
          required: ["id", "content", "options", "correctAnswer", "explanation", "type"]
        }
      }
    },
    required: ["title", "questions"]
  };

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.4,
        }
      });

      const jsonText = cleanJsonOutput(response.text || "{}");
      return JSON.parse(jsonText) as QuizResult;
    } catch (error: any) {
      console.warn(`Quiz model ${model} failed:`, error?.message);

      if (isAuthError(error)) {
        throw new Error("API Key không hợp lệ. Vui lòng vào Settings để nhập key mới.");
      }
      if (model === models[models.length - 1]) {
        if (isQuotaError(error)) {
          throw new Error("API Key đã hết quota. Hãy dùng API key từ Gmail khác hoặc chờ đến hôm sau.");
        }
        throw new Error("Không thể tạo bộ câu hỏi. Vui lòng thử lại.");
      }
    }
  }
  throw new Error("Không thể tạo bộ câu hỏi.");
};
