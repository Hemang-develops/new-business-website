import { useRef, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase-client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Input } from "@/components/ui/input";

/**
 * redirectTo must be a plain page path — NOT a hash anchor like "/#programs".
 * After OAuth, Supabase appends "#access_token=..." to whatever you pass,
 * so "/#programs" becomes "/#programs#access_token=..." which is an invalid
 * querySelector selector and crashes the app.
 * We redirect to /account; AuthPage will handle the session and can
 * navigate onward once the user is confirmed authenticated.
 */
const REDIRECT_URL = `${window.location.origin}/account`;

const authAppearance = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: "#5eead4",
        brandAccent: "#99f6e4",
        inputBackground: "rgba(0,0,0,0.3)",
        inputBorder: "rgba(255,255,255,0.15)",
        inputBorderFocus: "#5eead4",
        inputText: "#ffffff",
        inputPlaceholder: "rgba(255,255,255,0.4)",
        messageText: "#f43f5e",
        anchorTextColor: "transparent",
        anchorTextHoverColor: "transparent",
      },
      radii: {
        borderRadiusButton: "9999px",
        buttonBorderRadius: "9999px",
        inputBorderRadius: "0.75rem",
      },
      fonts: {
        bodyFontFamily: "inherit",
        buttonFontFamily: "inherit",
        inputFontFamily: "inherit",
        labelFontFamily: "inherit",
      },
      fontSizes: {
        baseBodySize: "0.875rem",
        baseInputSize: "0.875rem",
        baseLabelSize: "0.875rem",
        baseButtonSize: "0.875rem",
      },
      space: {
        buttonPadding: "0.625rem 1.25rem",
        inputPadding: "0.5rem 0.75rem",
      },
    },
  },
  style: {
    anchor: { display: "none" },
  },
  className: {
    button: "!font-semibold !transition-colors",
    input: "!text-white placeholder:!text-white/40",
    label: "!text-white/75 !text-sm !mb-1",
  },
};

// ─── Sign-in: Auth UI with Google + email/password ────────────────────────────
const SignInForm = () => (
  <>
    <Auth
      supabaseClient={supabase}
      view="sign_in"
      appearance={authAppearance}
      providers={["google"]}
      redirectTo={REDIRECT_URL}
      showLinks={false}
      localization={{
        variables: {
          sign_in: {
            email_label: "Email",
            password_label: "Password",
            button_label: "Sign in",
            social_provider_text: "Continue with {{provider}}",
          },
        },
      }}
    />
    <p className="mt-4 text-center text-sm text-white/65">
      New here?{" "}
      <Link
        to="/sign-up"
        className="font-semibold text-teal-200 underline-offset-4 transition hover:underline"
      >
        Create account
      </Link>
    </p>
  </>
);

// ─── Sign-up: manual form (supports first name, last name, birthday) ──────────
const SignUpForm = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const toast = useToast();
  const birthdayInputRef = useRef(null);
  const maxBirthday = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthday: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (!formData.firstName.trim() || !formData.lastName.trim())
        throw new Error("Please add your first and last name.");
      if (!formData.birthday.trim())
        throw new Error("Please add your birthday.");
      if (!formData.email.trim() || !formData.password.trim())
        throw new Error("Email and password are required.");
      if (formData.password.length < 8)
        throw new Error("Password must be at least 8 characters.");
      if (formData.password !== formData.confirmPassword)
        throw new Error("Passwords do not match.");

      const result = await signUp({
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthday: formData.birthday,
        email: formData.email,
        password: formData.password,
      });

      if (result?.needsEmailConfirmation) {
        const msg = "Account created. Check your email to confirm before signing in.";
        setSuccessMessage(msg);
        toast.success(msg, "Account created");
        return;
      }

      toast.success("Your account is ready.", "Welcome in");
      navigate("/account");
    } catch (err) {
      const msg = err.message || "Unable to continue. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: REDIRECT_URL },
    });
  };

  return (
    <div className="space-y-5">
      {/* Google option on sign-up too */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5836-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.6818 9c0-.5891.1009-1.1618.2822-1.71V4.9582H.9574A8.9959 8.9959 0 0 0 0 9c0 1.4514.3477 2.8255.9574 4.0418L3.964 10.71z" fill="#FBBC05"/>
          <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1632 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/40">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-white/75">First name</span>
            <Input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="border-white/15 bg-black/30 focus-visible:border-teal-300"
              placeholder="Nehal"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-white/75">Last name</span>
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="border-white/15 bg-black/30 focus-visible:border-teal-300"
              placeholder="Patel"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-white/75">Birthday</span>
          <Input
            ref={birthdayInputRef}
            type="date"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
            onFocus={() => birthdayInputRef.current?.showPicker?.()}
            onClick={() => birthdayInputRef.current?.showPicker?.()}
            max={maxBirthday}
            required
            className="border-white/15 bg-black/30 focus-visible:border-teal-300 [color-scheme:dark]"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-white/75">Email</span>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="border-white/15 bg-black/30 focus-visible:border-teal-300"
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-white/75">Password</span>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="border-white/15 bg-black/30 focus-visible:border-teal-300"
            placeholder="Minimum 8 characters"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-white/75">Confirm password</span>
          <Input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="border-white/15 bg-black/30 focus-visible:border-teal-300"
            placeholder="Re-enter password"
          />
        </label>

        {error && (
          <p className="rounded-2xl border border-rose-300/50 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="rounded-2xl border border-teal-300/50 bg-teal-300/10 px-4 py-3 text-sm text-teal-100">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-teal-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Please wait..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-white/65">
        Already have an account?{" "}
        <Link
          to="/sign-in"
          className="font-semibold text-teal-200 underline-offset-4 transition hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

// ─── Public export ────────────────────────────────────────────────────────────
const AuthForm = ({ mode = "signin" }) => {
  const isSignUp = mode === "signup";

  const heading = isSignUp ? "Create your HF11 account" : "Welcome back";
  const subHeading = isSignUp
    ? "Track purchases, save your details, and access your coaching journey faster."
    : "Sign in to continue your checkout and return to your purchased resources.";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr,1fr]">
      <section className="space-y-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-200/80">
          Account access
        </p>
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
          {heading}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          {subHeading}
        </p>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/75">
          <p className="font-semibold uppercase tracking-[0.3em] text-white/50">
            Why create an account
          </p>
          <ul className="mt-4 space-y-2">
            <li>Faster checkout on paid offerings and digital rituals.</li>
            <li>One place to manage your contact details for support follow-ups.</li>
            <li>Easy re-entry when you return for new programs or bundles.</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          {isSignUp ? "Create account" : "Sign in"}
        </p>
        {isSignUp ? <SignUpForm /> : <SignInForm />}
      </section>
    </div>
  );
};

export default AuthForm;
