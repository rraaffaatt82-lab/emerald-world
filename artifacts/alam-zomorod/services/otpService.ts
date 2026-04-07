/**
 * ═══════════════════════════════════════════════════════════════
 *  خدمة OTP — قابلة للتوصيل بأي مزوّد رسائل SMS / واتساب
 * ═══════════════════════════════════════════════════════════════
 *
 * الطريقة:
 *   1. استبدل دالة  sendSmsViaProvider  بطلب HTTP لمزوّد الرسائل
 *   2. المتغيرات السرية تُضبَط في env secrets
 *
 * مزوّدون شائعون:
 * ─────────────────────────────────────────────────────────────
 * • Twilio
 *     POST https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json
 *     Headers: Authorization: Basic base64(SID:TOKEN)
 *     Body: { To: phone, From: TWILIO_PHONE, Body: `رمزك: ${code}` }
 *
 * • Unifonic (الأردن / السعودية)
 *     POST https://api.unifonic.com/rest/Messages/Send
 *     Body: { AppSid, SenderID, Body: `رمزك: ${code}`, Recipient: phone }
 *
 * • Vonage / Nexmo
 *     POST https://rest.nexmo.com/sms/json
 *     Body: { api_key, api_secret, to: phone, from, text: `رمزك: ${code}` }
 *
 * • واتساب (360dialog / Gupshup / Meta Cloud API)
 *     POST إلى endpoint الـ provider مع template معتمد
 *
 * • Firebase Phone Auth
 *     استخدم firebase.auth().signInWithPhoneNumber(phone, recaptchaVerifier)
 * ─────────────────────────────────────────────────────────────
 */

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  phone: string;
}

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000;  // 5 دقائق
const MAX_ATTEMPTS = 5;

const otpStore = new Map<string, OtpRecord>();

const DEMO_FIXED_CODE = "123456";

function generateCode(phone: string): string {
  const isDemoPhone = ["1", "2", "3"].includes(phone) || phone.length < 5;
  if (isDemoPhone) return DEMO_FIXED_CODE;
  const digits = Math.floor(Math.random() * 900000 + 100000);
  return digits.toString();
}

/**
 * أرسل OTP عبر مزوّد الرسائل
 * ─────────────────────────────────────────────────────────────
 * استبدل هذه الدالة بمتطلبات مزوّدك:
 */
async function sendSmsViaProvider(phone: string, code: string): Promise<boolean> {
  const isDemoPhone = ["1", "2", "3"].includes(phone) || phone.length < 5;

  if (isDemoPhone) {
    console.log(`[OTP-DEMO] رقم: ${phone}  |  الرمز: ${code}`);
    return true;
  }

  try {
    // ─── مثال: Unifonic ────────────────────────────────────────
    // const response = await fetch("https://api.unifonic.com/rest/Messages/Send", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     AppSid: process.env.UNIFONIC_APP_SID,
    //     SenderID: "AlamZomorod",
    //     Recipient: phone,
    //     Body: `رمز التحقق من عالم زمرد: ${code}\nصالح 5 دقائق`,
    //   }),
    // });
    // return response.ok;

    // ─── مثال: Twilio ──────────────────────────────────────────
    // const sid = process.env.TWILIO_ACCOUNT_SID;
    // const token = process.env.TWILIO_AUTH_TOKEN;
    // const credentials = btoa(`${sid}:${token}`);
    // const response = await fetch(
    //   `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Basic ${credentials}`,
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     body: new URLSearchParams({
    //       To: phone,
    //       From: process.env.TWILIO_PHONE_NUMBER!,
    //       Body: `رمز التحقق من عالم زمرد: ${code}`,
    //     }).toString(),
    //   }
    // );
    // return response.ok;

    // بدون مزوّد فعلي: محاكاة ناجحة
    console.log(`[OTP] سيُرسَل إلى ${phone}: ${code}`);
    return true;
  } catch (err) {
    console.error("[OTP] خطأ في الإرسال:", err);
    return false;
  }
}

export interface SendOtpResult {
  success: boolean;
  error?: string;
  demoCode?: string;
}

export async function sendOtp(phone: string): Promise<SendOtpResult> {
  if (!phone || phone.trim().length < 1) {
    return { success: false, error: "رقم الهاتف غير صالح" };
  }

  const key = phone.trim();
  const code = generateCode(key);
  const record: OtpRecord = {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
    phone: key,
  };

  otpStore.set(key, record);

  const sent = await sendSmsViaProvider(key, code);
  if (!sent) {
    otpStore.delete(key);
    return { success: false, error: "تعذّر إرسال رمز التحقق، يرجى المحاولة لاحقاً" };
  }

  const isDemoPhone = ["1", "2", "3"].includes(key) || key.length < 5;
  return {
    success: true,
    demoCode: isDemoPhone ? code : undefined,
  };
}

export interface VerifyOtpResult {
  valid: boolean;
  error?: string;
}

export function verifyOtp(phone: string, code: string): VerifyOtpResult {
  const key = phone.trim();
  const isDemoPhone = ["1", "2", "3"].includes(key) || key.length < 5;

  // Demo phones: always accept the fixed code, no store needed
  if (isDemoPhone) {
    if (code.trim() === DEMO_FIXED_CODE) {
      return { valid: true };
    }
    return { valid: false, error: `الرمز التجريبي هو: ${DEMO_FIXED_CODE}` };
  }

  const record = otpStore.get(key);

  if (!record) {
    return { valid: false, error: "لم يُرسَل رمز تحقق لهذا الرقم أو انتهت صلاحيته" };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, error: "انتهت صلاحية الرمز، اضغط إعادة الإرسال" };
  }

  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { valid: false, error: "تجاوزت عدد المحاولات، اطلب رمزاً جديداً" };
  }

  if (record.code !== code.trim()) {
    return { valid: false, error: `رمز التحقق غير صحيح (${MAX_ATTEMPTS - record.attempts + 1} محاولة متبقية)` };
  }

  otpStore.delete(key);
  return { valid: true };
}

export function clearOtp(phone: string) {
  otpStore.delete(phone.trim());
}

export { OTP_LENGTH };
