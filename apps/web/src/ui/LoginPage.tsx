import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { cacheCustomerPhoneDigits, useCustomerAuth } from "./useCustomerAuth";

function normalizePhone(input: string) {
  return input.replace(/[^0-9+]/g, "").slice(0, 16);
}

function phoneToDigits(input: string) {
  return normalizePhone(input).replace(/[^0-9]/g, "").slice(0, 15);
}

export function LoginPage() {
  const auth = useCustomerAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const nextUrlRaw = (params.get("next") || "/orders").trim() || "/orders";
  const nextUrl = nextUrlRaw.startsWith("/login") ? "/orders" : nextUrlRaw;

  const [step, setStep] = useState<"start" | "verify">("start");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const phoneOk = useMemo(() => normalizePhone(phone).replace(/^\+/, "").length >= 6, [phone]);

  async function start() {
    if (!phoneOk) return;
    setStatus("");
    setDevCode(null);
    setLoading(true);
    try {
      const r = await api.customer.startLogin(normalizePhone(phone));
      setDevCode(r.code ?? null);
      setStep("verify");
    } catch (e: any) {
      setStatus(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!phoneOk || !code.trim()) return;
    setStatus("");
    setLoading(true);
    try {
      await api.customer.verifyLogin(normalizePhone(phone), code.trim());
      cacheCustomerPhoneDigits(phoneToDigits(phone));
      await qc.invalidateQueries({ queryKey: ["customerMe"] });
      nav(nextUrl);
    } catch (e: any) {
      setStatus(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  if (auth.status === "authed") {
    return (
      <div className="container page publicPageShell" style={{ maxWidth: 720 }}>
        <div className="publicPageIntro revealSection sectionGlow">
          <div className="infoEyebrow">Customer access</div>
          <div className="h2">You are already signed in</div>
          <div className="muted">Your phone session is active on this device, so you can go straight to your orders or cart.</div>
        </div>
        <div className="hr" />

        <div className="card revealSection authCard">
          <div className="p">
            <div className="authStatRow">
              <div>
                <div style={{ fontWeight: 800 }}>Signed in phone</div>
                <div className="muted2" style={{ marginTop: 6 }}>{auth.phoneDigits}</div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <Link className="btn primary" to={nextUrl}>
                  Continue
                </Link>
                <button className="btn" onClick={auth.logout}>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page publicPageShell" style={{ maxWidth: 720 }}>
      <div className="publicPageIntro revealSection sectionGlow">
        <div className="infoEyebrow">Customer login</div>
        <div className="h2">Sign in to keep your order history</div>
        <div className="muted">
          Use your phone number once, then we keep your session on this device so you do not need to fill details again and again.
        </div>
      </div>
      <div className="hr" />

      <div className="card revealSection authCard">
        <div className="p">
          <div className="authStepRow">
            <span className={step === "start" ? "glassBadge active" : "glassBadge"}>1. Phone</span>
            <span className={step === "verify" ? "glassBadge active" : "glassBadge"}>2. Verify</span>
          </div>

          <div className="label">Phone</div>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(normalizePhone(e.target.value))}
            placeholder="e.g. +91xxxxxxxxxx"
            disabled={loading || step === "verify"}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (step === "start") start();
                else verify();
              }
            }}
            autoFocus
          />

          {step === "verify" && (
            <>
              <div className="label">Verification code</div>
              <input
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="6-digit code"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") verify();
                }}
              />
              {devCode && (
                <div className="muted2" style={{ marginTop: 8, fontSize: 12 }}>
                  Dev code: <b>{devCode}</b>
                </div>
              )}
            </>
          )}

          <div style={{ height: 14 }} />
          {step === "start" ? (
            <button className="btn primary" onClick={start} disabled={!phoneOk || loading}>
              {loading ? "Sending..." : "Send code"}
            </button>
          ) : (
            <div className="row">
              <button className="btn primary" onClick={verify} disabled={!code.trim() || loading}>
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setStep("start");
                  setCode("");
                  setDevCode(null);
                  setStatus("");
                }}
                disabled={loading}
              >
                Change phone
              </button>
            </div>
          )}

          {status && (
            <div className="muted" style={{ marginTop: 12 }}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
