import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
import md5 from "spark-md5";
import CryptoJS from "crypto-js";
import { ACCESS_CODE_PREFIX } from "../constant";
const serverConfig = getServerSideConfig();
const key = serverConfig.Key;

function decrypt(encryptedText: any) {
  const decryptedText = CryptoJS.AES.decrypt(
    encryptedText,
    CryptoJS.enc.Utf8.parse(key),
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    },
  );
  return decryptedText.toString(CryptoJS.enc.Utf8);
}

async function get_model_key(username: string, model: string) {
  const path = "https://backend.chat.chinagreentownai.com/get_model_key";
  const reqBody = {
    username: username,
    model: model,
  };

  try {
    const response = await fetch(path, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });
    const data = await response.json();
    console.log("------>444444", data);
    return data;
  } catch (error) {
    console.log("get model key failure", error);
    console.log(">>>>>>>11111111>>>>>>>>>>>>>");
    const data = {
      code: 100,
      data: {
        downgrade: true,
        key: "",
        model: "",
        username: "",
      },
    };
    return data;
  }
}

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isOpenAiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isOpenAiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isOpenAiKey ? token : "",
  };
}

export async function auth(req: NextRequest) {
  const authToken = req.headers.get("Authorization") ?? "";

  // check if it is openai api key or user token
  const { accessCode, apiKey: token } = parseApiKey(authToken);

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const serverConfig = getServerSideConfig();
  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  if (serverConfig.needCode && !serverConfig.codes.has(hashedCode) && !token) {
    return {
      error: true,
      msg: !accessCode ? "empty access code" : "wrong access code",
    };
  }

  // if user does not provide an api key, inject system api key
  if (!token) {
    // 获取apikey
    // https://backend.chat.chinagreentownai.com/get_model_key
    const { code, data } = await get_model_key("liuxin", "gpt-4");
    // const code  = 0;
    console.log("code---->1", code);
    // console.log('data----->2',data)
    const apiKey = serverConfig.apiKey;
    if (code === 0 || true) {
      const encryptedText = data.key;
      console.log("data", data.model);
      const modelText = data.model;
      console.log("---->encryptedText", encryptedText);
      const decryptedText = decrypt(encryptedText);
      console.log("Decrypted text:", decryptedText);
      req.headers.set("Authorization", `Bearer ${decryptedText}`);
      // req.headers.set("Authorization", `Bearer ${apiKey}`);
    } else {
      req.headers.set("Authorization", `Bearer ${apiKey}`);
    }
    if (apiKey) {
      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${apiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  };
}
