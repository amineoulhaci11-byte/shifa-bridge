import { GoogleGenAI } from "@google/genai";

// ملاحظة: تأكد من وضع مفتاح API الخاص بك هنا أو في ملف .env
const getAI = () => new GoogleGenAI({ apiKey: "YOUR_GEMINI_API_KEY_HERE" });

export const getSmartResponse = async (userMessage: string, role: string) => {
  const ai = getAI();
  const systemInstruction = role === 'DOCTOR' 
    ? "أنت مساعد طبي ذكي يساعد الطبيب في تلخيص أعراض المريض أو اقتراح بروتوكولات المتابعة. كن موجزاً ومهنياً."
    : "أنت مساعد طبي ذكي يساعد المريض في فهم حالته بشكل مبسط وتوجيهه لأفضل الطرق للتواصل مع طبيبه. لا تعطي تشخيصات نهائية ولكن قدم نصائح عامة.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "عذراً، حدث خطأ أثناء معالجة طلبك الذكي.";
  }
};
