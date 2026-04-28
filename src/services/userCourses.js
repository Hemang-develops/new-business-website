import { supabase } from "../supabase-client";

/**
 * @typedef {Object} UserCourseAccess
 * @property {string} id
 * @property {string} courseId
 * @property {string} offeringId
 * @property {string} accessToken
 * @property {string} accessUrl
 * @property {string} createdAt
 * @property {string|null} expiresAt
 * @property {string} courseTitle
 * @property {string|null|undefined} courseDescription
 * @property {boolean} isActive
 */

const buildAccessUrl = (access) => access.access_url || (access.access_token ? `/courses/access/${access.access_token}` : "");
const applyUserAccessFilter = (query, userEmail, userId) => {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  const normalizedUserId = String(userId || "").trim();

  if (normalizedEmail && normalizedUserId) {
    return query.or(`customer_email.eq.${normalizedEmail},user_id.eq.${normalizedUserId}`);
  }
  if (normalizedUserId) {
    return query.eq("user_id", normalizedUserId);
  }
  return query.eq("customer_email", normalizedEmail);
};

/**
 * Fetch all course access records for a user.
 * @param {string} userEmail
 * @param {string} userId
 * @returns {Promise<UserCourseAccess[]>}
 */
export const getUserCourseAccess = async (userEmail, userId) => {
  if (!userEmail && !userId) {
    console.log("[userCourses] No user identity provided for getUserCourseAccess");
    return [];
  }

  try {
    const normalizedEmail = String(userEmail || "").trim().toLowerCase();
    console.log("[userCourses] Fetching all courses for user:", normalizedEmail, userId);
    
    const query = supabase
      .from("storefront_course_access")
      .select(`
        id,
        course_id,
        offering_id,
        customer_email,
        access_token,
        access_url,
        created_at,
        expires_at,
        revoked_at
      `)
      .is("revoked_at", null);

    const { data: courseAccess, error } = await applyUserAccessFilter(query, normalizedEmail, userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[userCourses] Query error:", error);
      return [];
    }

    console.log(`[userCourses] Found ${courseAccess?.length || 0} course access records`);

    if (!courseAccess || courseAccess.length === 0) {
      return [];
    }

    // Get course details for each access
    const courseIds = [...new Set(courseAccess.map(a => a.course_id))];
    const { data: courses, error: coursesError } = await supabase
      .from("storefront_courses")
      .select("id, title, description, offering_id, is_active")
      .in("id", courseIds);

    if (coursesError) {
      console.error("[userCourses] Error fetching courses:", coursesError);
    }

    const courseMap = {};
    (courses || []).forEach(course => {
      courseMap[course.id] = course;
    });

    const result = (courseAccess || [])
      .filter(access => courseMap[access.course_id]) // Only include if course exists
      .map((access) => {
        const course = courseMap[access.course_id];
        return {
          id: access.id,
          courseId: access.course_id,
          offeringId: access.offering_id,
          accessToken: access.access_token,
          accessUrl: buildAccessUrl(access),
          createdAt: access.created_at,
          expiresAt: access.expires_at,
          courseTitle: course?.title || "Course",
          courseDescription: course?.description,
          isActive: !access.expires_at || new Date(access.expires_at) > new Date(),
        };
      });
    
    console.log(`[userCourses] Returning ${result.length} formatted courses`);
    return result;
  } catch (err) {
    console.error("[userCourses] Exception fetching user courses:", err);
    return [];
  }
};

/**
 * Fetch a specific course access record by offering ID.
 * @param {string} userEmail
 * @param {string} offeringId
 * @param {string} userId
 * @returns {Promise<UserCourseAccess|null>}
 */
export const getUserCourseByOfferingId = async (userEmail, offeringId, userId) => {
  if ((!userEmail && !userId) || !offeringId) {
    console.log("[userCourses] Missing params - email:", userEmail, "offeringId:", offeringId);
    return null;
  }

  try {
    const normalizedEmail = String(userEmail || "").trim().toLowerCase();
    const normalizedOfferingId = String(offeringId || "").trim();
    
    console.log("[userCourses] Fetching course access - email:", normalizedEmail, "offering:", normalizedOfferingId);

    const query = supabase
      .from("storefront_course_access")
      .select(`
        id,
        course_id,
        offering_id,
        access_token,
        access_url,
        created_at,
        expires_at,
        revoked_at
      `)
      .eq("offering_id", normalizedOfferingId)
      .is("revoked_at", null);

    const { data: courseAccess, error } = await applyUserAccessFilter(query, normalizedEmail, userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[userCourses] Query error:", error);
      return null;
    }

    console.log("[userCourses] courseAccess result:", courseAccess);

    if (!courseAccess) {
      console.log("[userCourses] No course access found");
      return null;
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from("storefront_courses")
      .select("id, title, description, offering_id, is_active")
      .eq("id", courseAccess.course_id)
      .maybeSingle();

    if (courseError || !course) {
      console.error("[userCourses] Error fetching course:", courseError);
      return null;
    }

    const result = {
      id: courseAccess.id,
      courseId: courseAccess.course_id,
      offeringId: courseAccess.offering_id,
      accessToken: courseAccess.access_token,
      accessUrl: buildAccessUrl(courseAccess),
      createdAt: courseAccess.created_at,
      expiresAt: courseAccess.expires_at,
      courseTitle: course.title || "Course",
      courseDescription: course.description,
      isActive: !courseAccess.expires_at || new Date(courseAccess.expires_at) > new Date(),
    };
    
    console.log("[userCourses] Returning course access:", result);
    return result;
  } catch (err) {
    console.error("[userCourses] Exception fetching course access:", err);
    return null;
  }
};
