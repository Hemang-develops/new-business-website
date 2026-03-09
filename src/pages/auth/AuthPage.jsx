import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/common/Footer";
import { useAuth } from "../../context/AuthContext";

const AuthPage = ({ mode }) => {
  const isSignUp = mode === "signup";
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, signIn, signUp, signOut, updateProfile } = useAuth();
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
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthday: "",
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const birthdayInputRef = useRef(null);
  const maxBirthday = new Date().toISOString().split("T")[0];

  const heading = isSignUp ? "Create your HF11 account" : "Welcome back";
  const subHeading = isSignUp
    ? "Track purchases, save your details, and access your coaching journey faster."
    : "Sign in to continue your checkout and return to your purchased resources.";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (!formData.email.trim() || !formData.password.trim()) {
        throw new Error("Email and password are required.");
      }

      if (isSignUp) {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          throw new Error("Please add your first and last name.");
        }
        if (!formData.birthday.trim()) {
          throw new Error("Please add your birthday.");
        }

        if (formData.password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const signUpResult = await signUp({
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthday: formData.birthday,
          email: formData.email,
          password: formData.password,
        });

        if (signUpResult?.needsEmailConfirmation) {
          setSuccessMessage("Account created. Check your email to confirm your account before signing in.");
          return;
        }
      } else {
        await signIn({
          email: formData.email,
          password: formData.password,
        });
      }

      navigate("/buy");
    } catch (submitError) {
      setError(submitError.message || "Unable to continue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setError("");
    setSuccessMessage("");
    try {
      await signOut();
    } catch (signOutError) {
      setError(signOutError.message || "Unable to sign out right now.");
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    setProfileData({
      firstName: user.firstName || (user.name ? String(user.name).split(/\s+/)[0] : ""),
      lastName:
        user.lastName ||
        (user.name ? String(user.name).split(/\s+/).slice(1).join(" ") : ""),
      email: user.email || "",
      birthday: user.birthday || "",
    });
  }, [user]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((previous) => ({ ...previous, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
      setError("Please add your first and last name.");
      return;
    }

    setIsProfileSaving(true);

    try {
      await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
      setSuccessMessage("Profile updated.");
    } catch (profileError) {
      setError(profileError.message || "Unable to update profile right now.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const openBirthdayPicker = () => {
    birthdayInputRef.current?.showPicker?.();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <Navigation />
      <main className="relative z-10 px-6 pb-24 pt-32">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr,1fr]">
          <section className="space-y-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-200/80">Account access</p>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">{heading}</h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">{subHeading}</p>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/75">
              <p className="font-semibold uppercase tracking-[0.3em] text-white/50">Why create an account</p>
              <ul className="mt-4 space-y-2">
                <li>Faster checkout on paid offerings and digital rituals.</li>
                <li>One place to manage your contact details for support follow-ups.</li>
                <li>Easy re-entry when you return for new programs or bundles.</li>
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                Checking your session...
              </div>
            ) : null}
            {isAuthenticated ? (
              <div className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200/80">Signed in</p>
                <h2 className="text-2xl font-semibold text-white">You are signed in as {user?.name}</h2>
                <form onSubmit={handleProfileSave} className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Contact details</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm text-white/75">First name</span>
                      <input
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm text-white/75">Last name</span>
                      <input
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300"
                      />
                    </label>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-sm text-white/75">Email</span>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      readOnly
                      disabled
                      title="Email cannot be changed from account settings."
                      className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white/60 outline-none"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm text-white/75">Birthday</span>
                    <input
                      type="date"
                      name="birthday"
                      value={profileData.birthday}
                      readOnly
                      disabled
                      title="Birthday cannot be changed from account settings."
                      className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white/60 outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isProfileSaving}
                    className="inline-flex items-center rounded-full border border-teal-300/50 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-200 hover:bg-teal-300/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isProfileSaving ? "Saving..." : "Save details"}
                  </button>
                </form>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/buy"
                    className="inline-flex items-center rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 transition hover:bg-teal-200"
                  >
                    Continue to shop
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-teal-300 hover:text-teal-200"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                  {isSignUp ? "Create account" : "Sign in"}
                </p>

                {isSignUp ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm text-white/75">First name</span>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300"
                        placeholder="Nehal"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm text-white/75">Last name</span>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300"
                        placeholder="Patel"
                      />
                    </label>
                  </div>
                ) : null}

                {isSignUp ? (
                  <label className="block space-y-2">
                    <span className="text-sm text-white/75">Birthday</span>
                    <input
                      ref={birthdayInputRef}
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      onFocus={openBirthdayPicker}
                      onClick={openBirthdayPicker}
                      max={maxBirthday}
                      required
                      className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300 [color-scheme:dark]"
                    />
                  </label>
                ) : null}

                <label className="block space-y-2">
                  <span className="text-sm text-white/75">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-white/75">Password</span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300"
                    placeholder="Minimum 8 characters"
                  />
                </label>

                {isSignUp ? (
                  <label className="block space-y-2">
                    <span className="text-sm text-white/75">Confirm password</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300"
                      placeholder="Re-enter password"
                    />
                  </label>
                ) : null}

                {error ? <p className="rounded-2xl border border-rose-300/50 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}
                {successMessage ? (
                  <p className="rounded-2xl border border-teal-300/50 bg-teal-300/10 px-4 py-3 text-sm text-teal-100">{successMessage}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-teal-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
                </button>

                <p className="text-center text-sm text-white/65">
                  {isSignUp ? "Already have an account?" : "New here?"}{" "}
                  <Link
                    to={isSignUp ? "/sign-in" : "/sign-up"}
                    className="font-semibold text-teal-200 underline-offset-4 transition hover:underline"
                  >
                    {isSignUp ? "Sign in" : "Create account"}
                  </Link>
                </p>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;
