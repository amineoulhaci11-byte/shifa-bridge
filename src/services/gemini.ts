import { GoogleGenerativeAI } from "@google/generative-ai"; // 1. تصحيح اسم المكتبة

// جلب المفتاح من المتغيرات البيئية (Environment Variables) التي أضفتها في Vercel
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const getSmartResponse = async (userMessage: string, role: string) => {
  // 2. اختيار النموذج الصحيح
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // استخدام إصدار مستقر وحديث
  });

  const systemInstruction = role === 'DOCTOR' 
    ? "أنت مساعد طبي ذكي يساعد الطبيب في تلخيص أعراض المريض أو اقتراح بروتوكولات المتابعة. كن موجزاً ومهنياً."
    : "أنت مساعد طبي ذكي يساعد المريض في فهم حالته بشكل مبسط وتوجيهه لأفضل الطرق للتواصل مع طبيبه. لا تعطي تشخيصات نهائية ولكن قدم نصائح عامة.";

  try {
    // 3. طريقة الطلب الصحيحة للمكتبة الحديثة
    const result = await model.generateContent(`${systemInstruction}\n\nالمستخدم يقول: ${userMessage}`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "عذراً، حدث خطأ أثناء معالجة طلبك الذكي.";
  }
};
