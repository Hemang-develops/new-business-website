import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGsapPulse } from "../../hooks/useGsapMotion";
import { getUserCourseAccess } from "../../services/userCourses";

const pageSizeOptions = [6, 9, 12, 24];

const formatDate = (value) => {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const MyCoursesPage = ({ embedded = false }) => {
  const { user } = useAuth();
  const pageRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);

  useGsapPulse(pageRef, "[data-gsap-pulse]", [isLoading]);

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      try {
        const userCourses = await getUserCourseAccess(user?.email, user?.id);
        setCourses(userCourses);
      } catch (error) {
        console.error("Error loading courses:", error);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [user?.email, user?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, searchTerm]);

  const visibleCourses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...courses]
      .sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }

        const aDate = new Date(a.createdAt || a.expiresAt || 0).getTime();
        const bDate = new Date(b.createdAt || b.expiresAt || 0).getTime();
        return bDate - aDate;
      })
      .filter((course) => {
        if (!normalizedSearch) return true;

        const haystack = [
          course.courseTitle,
          course.courseDescription,
          course.isActive ? "ongoing active" : "expired",
          course.createdAt,
          course.expiresAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });
  }, [courses, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(visibleCourses.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedCourses = visibleCourses.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );
  const resultStart = visibleCourses.length ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const resultEnd = Math.min(safeCurrentPage * pageSize, visibleCourses.length);
  const activeCourseCount = courses.filter((course) => course.isActive).length;
  const expiredCourseCount = Math.max(0, courses.length - activeCourseCount);

  const content = (
    <main ref={pageRef} className={embedded ? "h-full" : "mx-auto max-w-6xl py-28"}>
      <div className={embedded ? "rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20" : ""}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">
              Learning portal
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className={embedded ? "text-2xl font-semibold text-white" : "text-3xl font-semibold text-white sm:text-4xl"}>
                My Courses
              </h1>
              {courses.length !== 0 && <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
                {courses.length} total
              </span>}
            </div>
          </div>

          {courses.length !== 0 && <div className="flex flex-col gap-3 sm:flex-row xl:w-[29rem] items-end">
            <label className="block flex-1 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                Search
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search courses"
                  className="h-11 w-full rounded-xl border border-white/15 bg-black/30 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/20"
                />
              </span>
            </label>

            <label className="block space-y-2 sm:w-28 sm:shrink-0">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                Show
              </span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-300/20"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option} className="bg-gray-950">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>}
        </div>

        {/* dont need below div redundunt */}
        {/* <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Active</p>
            <p className="mt-2 text-2xl font-semibold text-white">{activeCourseCount}</p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Expired</p>
            <p className="mt-2 text-2xl font-semibold text-white">{expiredCourseCount}</p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Showing</p>
            <p className="mt-2 text-2xl font-semibold text-white">{visibleCourses.length}</p>
          </div>
        </div> */}

        <div className="mt-6">
          {isLoading ? (
            <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap">
              {Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
                <div
                  key={index}
                  data-gsap-pulse
                  className="h-56 rounded-2xl border border-white/10 bg-white/5 xl:basis-[calc(50%-0.5rem)]"
                />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-white/70">
              <BookOpen className="h-10 w-10 text-teal-200/70" />
              <p className="mt-4 text-lg font-semibold text-white">No courses yet</p>
              <p className="mt-2 max-w-md text-sm text-white/55">
                Purchased courses will appear here with your private access links.
              </p>
              <Link
                to="/#programs"
                className="mt-6 inline-flex rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 hover:border-teal-200 hover:bg-teal-300/20"
              >
                Browse courses
              </Link>
            </div>
          ) : visibleCourses.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-white/70">
              No courses match your search.
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {resultStart}-{resultEnd} of {visibleCourses.length} courses
                </span>
                <span>Page {safeCurrentPage} of {totalPages}</span>
              </div>

              <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap">
                {pagedCourses.map((course) => (
                  <article
                    key={course.id}
                    className="flex min-h-64 flex-col rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-teal-300/35 hover:bg-teal-300/[0.06] xl:basis-[calc(50%-0.5rem)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-teal-300/25 bg-teal-300/10 text-teal-100">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold leading-snug text-white">{course.courseTitle}</h3>
                      </div>
                      {course.isActive ? (
                        <span className="shrink-0 rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
                          Active
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-rose-300/40 bg-rose-300/10 px-3 py-1 text-xs font-semibold text-rose-100">
                          Expired
                        </span>
                      )}
                    </div>

                    {course.courseDescription ? (
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/60">
                        {course.courseDescription}
                      </p>
                    ) : null}

                    <div className="mt-auto flex flex-col gap-2 pt-5 text-xs text-white/50 sm:flex-row sm:flex-wrap">
                      <p className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-white/35" />
                        Bought {formatDate(course.createdAt)}
                      </p>
                      {course.expiresAt ? (
                        <p className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 text-white/35" />
                          Expires {formatDate(course.expiresAt)}
                        </p>
                      ) : null}
                    </div>

                    <a
                      href={course.accessUrl}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-teal-200"
                    >
                      Access course
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </article>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/50">
                  {visibleCourses.length} matching {visibleCourses.length === 1 ? "course" : "courses"}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-teal-300 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-teal-300 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );

  if (embedded) {
    return content;
  }

  return <div className="min-h-screen bg-gray-950 text-white">{content}</div>;
};

export default MyCoursesPage;
