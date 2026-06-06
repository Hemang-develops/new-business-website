import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase-client";
import { createInitialsAvatarBlob, generateInitials } from "@/lib/imageUtils";
import { slugify } from "../utils/slugify";

const AuthContext = createContext(null);

const mapSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) {
    return null;
  }

  const rawFirstName = supabaseUser.user_metadata?.first_name || "";
  const rawLastName = supabaseUser.user_metadata?.last_name || "";
  const rawFullName =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    "";
  const nameParts = String(rawFullName || rawFirstName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const metadataFirstName =
    rawFirstName && rawLastName
      ? rawFirstName
      : nameParts[0] || rawFirstName;
  const metadataLastName =
    rawLastName ||
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");
  const metadataBirthday = supabaseUser.user_metadata?.birthday || "";
  const metadataProfileImage =
    supabaseUser.user_metadata?.profile_image ||
    supabaseUser.user_metadata?.avatar_url ||
    "";
  const metadataFullName =
    rawFullName ||
    [metadataFirstName, metadataLastName].filter(Boolean).join(" ").trim();

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    firstName: metadataFirstName,
    lastName: metadataLastName,
    birthday: metadataBirthday,
    profileImage: metadataProfileImage,
    name: metadataFullName || supabaseUser.user_metadata?.name || (supabaseUser.email ? supabaseUser.email.split("@")[0] : "Account"),
  };
};

const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "site-media";

const buildProfileImageKey = (userId, label) => {
  const safeName = slugify(String(label || "profile").replace(/\.[^/.]+$/, "")) || "profile";
  return `profiles/${userId}/${Date.now()}-${safeName}.webp`;
};

const userHasProfileImage = (supabaseUser) => {
  return Boolean(
    supabaseUser?.user_metadata?.profile_image || supabaseUser?.user_metadata?.avatar_url,
  );
};

const ensureProfileImageForUser = async (supabaseUser) => {
  if (!supabaseUser || userHasProfileImage(supabaseUser)) {
    return supabaseUser;
  }

  const firstName = supabaseUser.user_metadata?.first_name || "";
  const lastName = supabaseUser.user_metadata?.last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || supabaseUser.user_metadata?.name || "";
  const initials = generateInitials(fullName, supabaseUser.email || "");

  try {
    const avatarBlob = await createInitialsAvatarBlob({ initials, size: 512 });
    const key = buildProfileImageKey(supabaseUser.id, initials);
    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(key, avatarBlob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/webp",
    });
    if (uploadError) {
      console.warn("Failed to upload profile avatar:", uploadError);
      return supabaseUser;
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(key);
    const publicUrl = data?.publicUrl;
    if (!publicUrl) {
      console.warn("Failed to resolve uploaded avatar URL");
      return supabaseUser;
    }

    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      data: {
        profile_image: publicUrl,
        avatar_url: publicUrl,
        full_name: fullName,
      },
    });
    if (updateError) {
      console.warn("Failed to update user metadata with avatar URL:", updateError);
      return supabaseUser;
    }

    return updateData?.user || supabaseUser;
  } catch (err) {
    console.warn("Profile avatar generation failed:", err);
    return supabaseUser;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   let isMounted = true;

  //   const loadInitialSession = async () => {
  //     try {
  //       const { data, error } = await supabase.auth.getSession();
  //       if (!isMounted) {
  //         return;
  //       }
  //       if (error) {
  //         setUser(null);
  //         setIsAdmin(false);
  //         setIsLoading(false);
  //         return;
  //       }

  //     setUser(mapSupabaseUser(data.session?.user));

  //     if (data.session?.user) {
  //       const { data: isAdminData } = await supabase.rpc('is_storefront_admin');
  //       if (isMounted) setIsAdmin(!!isAdminData);
  //     } else {
  //       if (isMounted) setIsAdmin(false);
  //     }

  //     if (isMounted) {
  //       setIsLoading(false);
  //     }
  //     } catch (err) {
  //       console.warn("Session load error ignored:", err);
  //       if (isMounted) {
  //         setIsLoading(false);
  //       }
  //     }
  //   };

  //   loadInitialSession();

  //   const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
  //     if (!isMounted) {
  //       return;
  //     }
  //     setUser(mapSupabaseUser(session?.user));

  //     if (session?.user) {
  //       const { data: isAdminData } = await supabase.rpc('is_storefront_admin');
  //       if (isMounted) setIsAdmin(!!isAdminData);
  //     } else {
  //       if (isMounted) setIsAdmin(false);
  //     }

  //     if (isMounted) {
  //       setIsLoading(false);
  //     }
  //   });

  //   return () => {
  //     isMounted = false;
  //     authListener.subscription.unsubscribe();
  //   };
  // }, []);
  useEffect(() => {
    let isMounted = true;

    const applySession = async (session) => {
      if (!isMounted) return;

      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const userWithAvatar = await ensureProfileImageForUser(session.user);
      setUser(mapSupabaseUser(userWithAvatar));

      try {
        const { data: isAdminData } = await supabase.rpc("is_storefront_admin");
        if (isMounted) {
          setIsAdmin(!!isAdminData);
        }
      } catch (err) {
        console.warn("Admin check failed:", err);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const loadInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        await applySession(data.session);
      } catch (err) {
        console.warn("Session load failed:", err);
        if (isMounted) {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };

    void loadInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);


  const signUp = async ({ firstName, lastName, birthday, email, password }) => {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedBirthday = birthday.trim();
    const fullName = `${normalizedFirstName} ${normalizedLastName}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          birthday: normalizedBirthday,
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message || "Unable to create account.");
    }

    let nextUser = mapSupabaseUser(data.user);
    if (data.session) {
      const userWithAvatar = await ensureProfileImageForUser(data.user);
      nextUser = mapSupabaseUser(userWithAvatar);
      setUser(nextUser);
      // Wait to verify admin after successful signup
      const { data: isAdminData } = await supabase.rpc('is_storefront_admin');
      setIsAdmin(!!isAdminData);
      return { needsEmailConfirmation: false };
    }

    return { needsEmailConfirmation: true };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message || "Invalid email or password.");
    }

    const userWithAvatar = await ensureProfileImageForUser(data.user);
    setUser(mapSupabaseUser(userWithAvatar));
    const { data: isAdminData } = await supabase.rpc('is_storefront_admin');
    setIsAdmin(!!isAdminData);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || "Unable to sign out.");
    }
    setUser(null);
    setIsAdmin(false);
  };

  const updateProfile = async ({ firstName, lastName, birthday, profileImage }) => {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedBirthday = typeof birthday === "string" ? birthday.trim() : "";
    const normalizedProfileImage = typeof profileImage === "string" ? profileImage.trim() : "";
    const fullName = `${normalizedFirstName} ${normalizedLastName}`.trim();

    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        birthday: normalizedBirthday,
        profile_image: normalizedProfileImage,
        avatar_url: normalizedProfileImage,
        full_name: fullName,
      },
    });

    if (error) {
      throw new Error(error.message || "Unable to update profile.");
    }

    const nextUser = mapSupabaseUser(data.user);
    setUser(nextUser);
    return nextUser;
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin,
      isLoading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, isAdmin, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
};
