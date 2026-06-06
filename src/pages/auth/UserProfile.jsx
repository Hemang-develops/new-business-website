import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Camera, Check, LogOut, Pencil, Video, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../supabase-client";
import MyCoursesPage from "../storefront/MyCoursesPage";
import MyMeetingsTab from "../storefront/MyMeetingsTab";
import { slugify } from "../../utils/slugify";
import { storageBucket } from "../admin/catalogAdminHelpers";

const getInitials = (name, email) => {
  const nameParts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = nameParts
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return initials || (email ? email[0] : "U");
};



/**
 * UserProfile
 * Shown when a user is already authenticated.
 * Lets them view / update profile details and sign out.
 */
const TABS = [
  { id: "courses", label: "My Courses", icon: BookOpen },
  { id: "meetings", label: "My Meetings", icon: Video },
];

const UserProfile = () => {
  const { user, isAdmin, signOut, updateProfile } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() =>
    TABS.some((tab) => tab.id === requestedTab) ? requestedTab : "courses",
  );

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthday: "",
    profileImage: "",
  });
  const [draftProfileData, setDraftProfileData] = useState(profileData);
  const [pendingProfileImageFile, setPendingProfileImageFile] = useState(null);
  const [pendingProfileImagePreview, setPendingProfileImagePreview] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const displayName = useMemo(
    () => [profileData.firstName, profileData.lastName].filter(Boolean).join(" ").trim() || user?.name || "Your profile",
    [profileData.firstName, profileData.lastName, user?.name]
  );
  const initials = getInitials(displayName, profileData.email).toUpperCase();

  useEffect(() => {
    if (!user) return;

    const nextProfileData = {
      firstName: user.firstName || (user.name ? String(user.name).split(/\s+/)[0] : ""),
      lastName: user.lastName || (user.name ? String(user.name).split(/\s+/).slice(1).join(" ") : ""),
      email: user.email || "",
      birthday: user.birthday || "",
      profileImage: user.profileImage || "",
    };

    setProfileData(nextProfileData);
    setDraftProfileData(nextProfileData);
  }, [user]);

  useEffect(() => {
    if (TABS.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    if (!isEditOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isProfileSaving) {
        setIsEditOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditOpen, isProfileSaving]);

  useEffect(() => {
    return () => {
      if (pendingProfileImagePreview) {
        URL.revokeObjectURL(pendingProfileImagePreview);
      }
    };
  }, [pendingProfileImagePreview]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraftProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const clearPendingProfileImage = () => {
    setPendingProfileImageFile(null);
    setPendingProfileImagePreview("");
  };

  const uploadProfileImage = async (file) => {
    if (!user?.id) {
      throw new Error("Please sign in again before uploading a profile picture.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeBaseName = slugify(file.name.replace(/\.[^/.]+$/, "")) || "profile";
    const filePath = `profiles/${user.id}/${Date.now()}-${safeBaseName}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      throw new Error(uploadError.message || "Unable to upload profile picture.");
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(filePath);
    if (!data?.publicUrl) {
      throw new Error("Profile picture uploaded, but the image URL could not be created.");
    }

    return data.publicUrl;
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setError("");
    setSuccessMessage("");

    const previewUrl = URL.createObjectURL(file);
    setPendingProfileImageFile(file);
    setPendingProfileImagePreview(previewUrl);
    setDraftProfileData((prev) => ({ ...prev, profileImage: previewUrl }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!draftProfileData.firstName.trim() || !draftProfileData.lastName.trim()) {
      setError("Please add your first and last name.");
      return;
    }

    setIsProfileSaving(true);
    try {
      let profileImage = draftProfileData.profileImage;

      if (pendingProfileImageFile) {
        setIsImageUploading(true);
        profileImage = await uploadProfileImage(pendingProfileImageFile);
      }

      const nextProfileData = {
        ...draftProfileData,
        firstName: draftProfileData.firstName.trim(),
        lastName: draftProfileData.lastName.trim(),
        birthday: draftProfileData.birthday.trim(),
        profileImage,
      };

      await updateProfile(nextProfileData);
      setProfileData(nextProfileData);
      setDraftProfileData(nextProfileData);
      clearPendingProfileImage();
      setIsEditOpen(false);
      setSuccessMessage("Profile updated.");
      toast.success("Your profile details were updated.", "Profile updated");
    } catch (err) {
      const message = err.message || "Unable to update profile right now.";
      setError(message);
      toast.error(message);
    } finally {
      setIsProfileSaving(false);
      setIsImageUploading(false);
    }
  };

  const handleSignOut = async () => {
    setError("");
    setSuccessMessage("");

    try {
      await signOut();
      toast.info("You have been signed out of your account.", "Signed out");
    } catch (err) {
      const message = err.message || "Unable to sign out right now.";
      setError(message);
      toast.error(message);
    }
  };

  const closeEditDialog = () => {
    if (isProfileSaving) return;
    setDraftProfileData(profileData);
    clearPendingProfileImage();
    setError("");
    setIsEditOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-200/80">
          Account access
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center rounded-full border border-teal-300/50 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-300 hover:text-teal-200"
            >
              Manage website
            </Link>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-rose-200/50 hover:text-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className={`w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 ${isAdmin ? "" : "lg:w-[360px] lg:shrink-0"}`}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
              Profile details
            </p>
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-teal-300/60 hover:text-teal-100"
              aria-label="Edit profile"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-teal-200/30 bg-teal-300/10 text-4xl font-semibold text-teal-100 shadow-xl shadow-teal-950/30">
                {profileData.profileImage ? (
                  <img src={profileData.profileImage} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="absolute bottom-1 right-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-teal-300 text-gray-950 shadow-lg transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Edit profile picture"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-white">{displayName}</h2>
            <p className="mt-1 break-all text-sm text-white/65">{profileData.email}</p>
          </div>

          <dl className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Birthday</dt>
              <dd className="mt-1 text-sm text-white/85">{profileData.birthday || "Not added yet"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Account</dt>
              <dd className="mt-1 text-sm text-white/85">{isAdmin ? "Admin" : "Member"}</dd>
            </div>
          </dl>
        </aside>

        {!isAdmin && <section className="min-w-0 flex-1">
          {/* Tab bar */}
          <div className="mb-4 flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive
                      ? "bg-teal-300/15 text-teal-100 shadow-sm border border-teal-300/20"
                      : "text-white/50 hover:text-white/80"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === "courses" && <MyCoursesPage embedded />}
          {activeTab === "meetings" && <MyMeetingsTab />}
        </section>}
      </div>

      {isEditOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-contrast-50"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditDialog();
          }}
        >
          <form
            onSubmit={handleProfileSave}
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-gray-950 p-5 text-white shadow-2xl shadow-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/75">Edit profile</p>
                <h3 id="profile-edit-title" className="mt-2 text-2xl font-semibold text-white">
                  Profile details
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditDialog}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white"
                aria-label="Close profile editor"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-teal-200/30 bg-teal-300/10 text-2xl font-semibold text-teal-100">
                {draftProfileData.profileImage ? (
                  <img src={draftProfileData.profileImage} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Profile picture</p>
                <p className="mt-1 text-sm text-white/55">Upload a JPG, PNG, or WebP image for your account.</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProfileSaving}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-200 hover:bg-teal-300/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Camera className="h-4 w-4" />
                {pendingProfileImageFile ? "Change photo" : "Upload photo"}
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <label className="block flex-1 space-y-2">
                <span className="text-sm text-white/75">First name</span>
                <Input
                  type="text"
                  name="firstName"
                  value={draftProfileData.firstName}
                  onChange={handleDraftChange}
                  className="border-white/15 bg-black/30 text-white focus-visible:border-teal-300"
                />
              </label>
              <label className="block flex-1 space-y-2">
                <span className="text-sm text-white/75">Last name</span>
                <Input
                  type="text"
                  name="lastName"
                  value={draftProfileData.lastName}
                  onChange={handleDraftChange}
                  className="border-white/15 bg-black/30 text-white focus-visible:border-teal-300"
                />
              </label>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-white/75">Email</span>
                <Input
                  type="email"
                  name="email"
                  value={draftProfileData.email}
                  readOnly
                  disabled
                  title="Email cannot be changed from account settings."
                  className="border-white/15 bg-black/30 text-white/60"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/75">Birthday</span>
                <Input
                  type="date"
                  name="birthday"
                  value={draftProfileData.birthday}
                  onChange={handleDraftChange}
                  className="border-white/15 bg-black/30 text-white focus-visible:border-teal-300"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEditDialog}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/35 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProfileSaving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Check className="h-4 w-4" />
                {isProfileSaving ? "Saving..." : "Save details"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
