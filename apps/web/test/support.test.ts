import { describe, expect, it } from "vitest";
import { allow, clientIp } from "@/lib/rate-limit";
import { parseEmail, parseHttpsUrl, parseWhatsapp } from "@/lib/support";
import { mailtoUrl, whatsappUrl } from "@/lib/support-types";

describe("support settings", () => {
  it("reads a WhatsApp number in any common format", () => {
    expect(parseWhatsapp("+54 9 11 1234-5678")).toBe("5491112345678");
    expect(parseWhatsapp("https://wa.me/5491112345678")).toBe("5491112345678");
    expect(parseWhatsapp("1234")).toBeNull();
    expect(parseWhatsapp(undefined)).toBeNull();
  });

  it("accepts only an email and an https link", () => {
    expect(parseEmail(" someone@example.com ")).toBe("someone@example.com");
    expect(parseEmail("not an email")).toBeNull();
    expect(parseHttpsUrl("https://buymeacoffee.com/someone")).toBe("https://buymeacoffee.com/someone");
    expect(parseHttpsUrl("http://example.com")).toBeNull();
    expect(parseHttpsUrl("javascript:alert(1)")).toBeNull();
  });

  it("builds contact links with the message", () => {
    expect(whatsappUrl("5491112345678", "Hola, quiero dedicar")).toBe("https://wa.me/5491112345678?text=Hola%2C%20quiero%20dedicar");
    expect(mailtoUrl("a@b.co", "Asunto", "Hola")).toBe("mailto:a@b.co?subject=Asunto&body=Hola");
  });
});

describe("rate limit", () => {
  it("allows up to the limit per window", () => {
    const now = 1_000_000;
    const results = Array.from({ length: 4 }, () => allow("test:1.2.3.4", 3, 60_000, now));
    expect(results).toEqual([true, true, true, false]);
    expect(allow("test:5.6.7.8", 3, 60_000, now)).toBe(true);
    expect(allow("test:1.2.3.4", 3, 60_000, now + 60_000)).toBe(true);
  });
});

describe("client IP", () => {
  it("takes the address the reverse proxy appended, not one the client sent", () => {
    const req = (h: Record<string, string>) => new Request("http://localhost/api/scan", { headers: h });
    expect(clientIp(req({ "x-forwarded-for": "1.1.1.1, 203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientIp(req({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(req({}))).toBe("local");
  });
});
