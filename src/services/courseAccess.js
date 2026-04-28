import { supabase } from "../supabase-client";

export const loadCourseByToken = async (token) => {
  const { data, error } = await supabase.functions.invoke("course-access", {
    body: { token },
  });

  if (error) {
    throw new Error(error.message || "Unable to load course access.");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data;
};
