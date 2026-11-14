import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, MessageSquareText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PageHeader } from "@/components/bank/PageHeader";
import { TextField } from "@/components/bank/Form";
import { useBank } from "@/lib/bank/store";
import { DEMO_OTP, HOLDER } from "@/lib/bank/profile";
import { maskPhone, normalizePhone, validateNewPin } from "@/lib/bank/logic";

export const Route = createFileRoute("/forgot-pin")({
  head: () => ({
    meta: [
      { title: "Reset PIN - Kilele Bank" },
      { name: "description", content: "Reset your Kilele Bank demo PIN with a one-time code." },
      { property: "og:title", content: "Reset PIN - Kilele Bank" },
      { property: "og:description", content: "Reset your demo PIN with a one-time code." },
    ],
  }),
  component: ForgotPin,
});

function ForgotPin() {
  const { resetPinWithOtp } = useBank();
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp" | "pin">("phone");
  const [phone, setPhone] = useState("");
  const [idNo, setIdNo] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const sendOtp = () => {
    const p = normalizePhone(phone);
    if (!p) return setError("Enter a valid Kenyan mobile number, e.g. 0712 345 678");
    if (p !== HOLDER.phone) return setError("This number is not registered to a Kilele account");
    if (!/^\d{6,9}$/.test(idNo.trim())) return setError("Enter your ID number (6-9 digits)");
    setError(null);
    setStep("otp");
    setResendIn(30);
    toast.success(`OTP sent to ${maskPhone(p)}`, { description: "Demo: the code is in the hint below" });
  };

  return (
    <div>
      <PageHeader title="Forgot PIN" onBack={() => (step === "phone" ? navigate({ to: "/" }) : setStep(step === "pin" ? "otp" : "phone"))} />
      <div className="space-y-5 p-5">
        <div className="flex gap-2">
          {["phone", "otp", "pin"].map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${["phone", "otp", "pin"].indexOf(step) >= i ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === "phone" && (
          <>
            <div className="flex items-center gap-3">
              <KeyRound className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Verify it's you</p>
                <p className="text-sm text-muted-foreground">We'll send a one-time code to your registered phone.</p>
              </div>
            </div>
            <TextField id="phone" label="Registered phone number" inputMode="tel" placeholder="07XX XXX XXX" value={phone} onChange={setPhone} />
            <TextField id="idno" label="National ID number" inputMode="numeric" placeholder="e.g. 23456781" value={idNo} onChange={setIdNo} maxLength={9} />
            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">Demo phone: {HOLDER.phone}. Any 6-9 digit ID works.</p>
            <Button size="xl" className="w-full" onClick={sendOtp}>
              Send code
            </Button>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="flex items-center gap-3">
              <MessageSquareText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Enter the 6-digit code</p>
                <p className="text-sm text-muted-foreground">Sent to {maskPhone(phone)}. Demo code: {DEMO_OTP}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={(v) => { setOtp(v); setError(null); }}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p role="alert" className="text-center text-sm font-medium text-destructive">{error}</p>}
            <Button
              size="xl"
              className="w-full"
              onClick={() => {
                if (otp.length !== 6) return setError("Enter all 6 digits");
                if (otp !== DEMO_OTP) return setError("Incorrect code. Check the SMS and try again");
                setError(null);
                setStep("pin");
              }}
            >
              Verify
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              disabled={resendIn > 0}
              onClick={() => {
                setResendIn(30);
                toast.success("A new code has been sent");
              }}
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </Button>
          </>
        )}

        {step === "pin" && (
          <>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Create a new PIN</p>
                <p className="text-sm text-muted-foreground">Avoid easy PINs like 1234 or 0000.</p>
              </div>
            </div>
            <TextField id="newpin" type="password" label="New PIN" inputMode="numeric" maxLength={4} value={pin} onChange={(v) => setPin(v.replace(/\D/g, ""))} />
            <TextField id="confirmpin" type="password" label="Confirm new PIN" inputMode="numeric" maxLength={4} value={confirm} onChange={(v) => setConfirm(v.replace(/\D/g, ""))} />
            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
            <Button
              size="xl"
              className="w-full"
              onClick={() => {
                const err = validateNewPin(pin, confirm);
                if (err) return setError(err);
                resetPinWithOtp(pin);
                toast.success("PIN reset. Log in with your new PIN");
                navigate({ to: "/", replace: true });
              }}
            >
              Save new PIN
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
