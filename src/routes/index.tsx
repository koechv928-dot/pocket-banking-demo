import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/lib/bank/store";
import { PinEntry } from "@/components/bank/PinPad";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HOLDER } from "@/lib/bank/profile";
import kileleLogo from "@/assets/kilele-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Log in - Kilele Bank" },
      { name: "description", content: "Log in to the Kilele Bank demo with your 4-digit PIN or biometrics." },
      { property: "og:title", content: "Log in - Kilele Bank" },
      { property: "og:description", content: "Log in to the Kilele Bank demo mobile banking app." },
    ],
  }),
  component: Login,
});

function Login() {
  const { login, loginBiometric, t } = useBank();
  const navigate = useNavigate();
  const [bio, setBio] = useState<"idle" | "scanning" | "done">("idle");

  const startBio = () => {
    setBio("scanning");
    window.setTimeout(() => setBio("done"), 1400);
    window.setTimeout(() => {
      setBio("idle");
      loginBiometric();
      toast.success(`${t("welcomeBack")}, ${HOLDER.firstName}`);
      navigate({ to: "/home", replace: true });
    }, 2100);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-splash px-6 pb-8 pt-12 text-on-photo">
      <div className="flex flex-col items-center text-center">
        <img src={kileleLogo} alt="Kilele Bank" width={80} height={80} className="h-20 w-20 rounded-2xl shadow-fab" />
        <p className="mt-5 text-sm opacity-80">{t("welcomeBack")}</p>
        <h1 className="text-2xl font-bold">
          {t("hello")}, {HOLDER.firstName}
        </h1>
        <p className="mt-6 text-sm font-medium opacity-90">{t("enterPin")}</p>
      </div>
      <div className="mx-auto mt-6 w-full max-w-xs flex-1">
        <PinEntry
          tone="light"
          onSubmit={(pin) => {
            const res = login(pin);
            if (res.ok) {
              toast.success(`${t("welcomeBack")}, ${HOLDER.firstName}`);
              navigate({ to: "/home", replace: true });
              return null;
            }
            toast.error(res.error);
            return res.error;
          }}
          leftSlot={
            <button
              type="button"
              onClick={startBio}
              aria-label="Log in with biometrics"
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-on-photo hover:bg-photo-glass"
            >
              <Fingerprint className="h-8 w-8" />
            </button>
          }
        />
      </div>
      <div className="mt-6 text-center">
        <Link to="/forgot-pin" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
          {t("forgotPin")}
        </Link>
        <p className="mt-4 text-[11px] opacity-60">Demo app · no real money</p>
      </div>

      <Dialog open={bio !== "idle"}>
        <DialogContent className="max-w-xs rounded-2xl text-center [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-center">{bio === "done" ? "Verified" : "Touch the sensor"}</DialogTitle>
            <DialogDescription className="text-center">
              {bio === "done" ? "Biometric match confirmed" : "Scanning fingerprint..."}
            </DialogDescription>
          </DialogHeader>
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-secondary">
            {bio === "done" ? (
              <CheckCircle2 className="h-14 w-14 text-success animate-pop" />
            ) : (
              <>
                <Fingerprint className="h-14 w-14 text-primary" />
                <span className="absolute inset-x-4 top-1/2 h-0.5 bg-brand animate-scan" />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
