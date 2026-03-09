import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase-client";

const AuthContext = createContext(null);
const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const mapSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) {
    return null;
  }

  const metadataFirstName = supabaseUser.user_metadata?.first_name || "";
  const metadataLastName = supabaseUser.user_metadata?.last_name || "";
  const metadataBirthday = supabaseUser.user_metadata?.birthday || "";
  const metadataFullName =
    supabaseUser.user_metadata?.full_name ||
    [metadataFirstName, metadataLastName].filter(Boolean).join(" ").trim();

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    firstName: metadataFirstName,
    lastName: metadataLastName,
    birthday: metadataBirthday,
    name: metadataFullName || supabaseUser.user_metadata?.name || (supabaseUser.email ? supabaseUser.email.split("@")[0] : "Account"),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }
      if (error) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setUser(mapSupabaseUser(data.session?.user));
      setIsLoading(false);
    };

    loadInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }
      setUser(mapSupabaseUser(session?.user));
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
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

    const nextUser = mapSupabaseUser(data.user);
    if (data.session) {
      setUser(nextUser);
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

    setUser(mapSupabaseUser(data.user));
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || "Unable to sign out.");
    }
    setUser(null);
  };

  const updateProfile = async ({ firstName, lastName }) => {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const fullName = `${normalizedFirstName} ${normalizedLastName}`.trim();

    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
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
      isAdmin: Boolean(user?.email && adminEmails.includes(user.email.toLowerCase())),
      isLoading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, isLoading]
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
